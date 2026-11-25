
from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.products.models import Product

from .models import Order, OrderStatusHistory


ALLOWED_TRANSITIONS = {
    Order.Status.PENDING: {
        Order.Status.CONFIRMED,
        Order.Status.CANCELLED,
    },
    Order.Status.CONFIRMED: {
        Order.Status.PROCESSING,
        Order.Status.CANCELLED,
    },
    Order.Status.PROCESSING: {
        Order.Status.SHIPPED,
        Order.Status.CANCELLED,
    },
    Order.Status.SHIPPED: {
        Order.Status.DELIVERED,
    },
    Order.Status.DELIVERED: set(),
    Order.Status.CANCELLED: set(),
    Order.Status.REFUNDED: set(),
}


@transaction.atomic
def reserve_order_stock(order_id):
    """
    رزرو موجودی سفارش به‌صورت اتمیک.
    این تابع باید فقط یک‌بار برای هر سفارش فراخوانی شود.
    """
    order = Order.objects.select_for_update().get(id=order_id)

    if order.status not in (
        Order.Status.PENDING,
        Order.Status.CONFIRMED,
    ):
        raise ValidationError("وضعیت سفارش اجازه رزرو موجودی را نمی‌دهد.")

    items = list(order.items.select_related("product").all())

    if not items:
        raise ValidationError("سفارش فاقد محصول است.")

    for item in items:
        product = Product.objects.select_for_update().get(
            id=item.product_id
        )

        if product.stock_quantity < item.quantity:
            raise ValidationError(
                f"موجودی محصول {product.name} کافی نیست."
            )

    for item in items:
        product = Product.objects.select_for_update().get(
            id=item.product_id
        )

        product.stock_quantity -= item.quantity
        product.save(update_fields=["stock_quantity"])

    return order


@transaction.atomic
def restore_order_stock(order_id):
    """
    بازگرداندن موجودی سفارش لغوشده.
    این تابع باید فقط برای سفارش‌هایی اجرا شود
    که قبلاً موجودی آن‌ها رزرو شده است.
    """
    order = Order.objects.select_for_update().get(id=order_id)

    if order.status != Order.Status.CANCELLED:
        raise ValidationError(
            "فقط سفارش لغوشده قابل بازگرداندن موجودی است."
        )

    items = list(order.items.select_related("product").all())

    for item in items:
        product = Product.objects.select_for_update().get(
            id=item.product_id
        )

        product.stock_quantity += item.quantity
        product.save(update_fields=["stock_quantity"])

    return order


@transaction.atomic
def change_order_status(order_id, new_status, changed_by=None,
                        description=""):
    order = Order.objects.select_for_update().get(id=order_id)

    valid_statuses = {
        value for value, label in Order.Status.choices
    }

    if new_status not in valid_statuses:
        raise ValidationError("وضعیت سفارش معتبر نیست.")

    old_status = order.status

    if new_status == old_status:
        return order

    allowed = ALLOWED_TRANSITIONS.get(old_status, set())

    if new_status not in allowed:
        raise ValidationError(
            "تغییر وضعیت سفارش از این مرحله مجاز نیست."
        )

    now = timezone.now()

    order.status = new_status

    if new_status == Order.Status.CONFIRMED:
        order.confirmed_at = now

    elif new_status == Order.Status.SHIPPED:
        order.shipped_at = now

    elif new_status == Order.Status.DELIVERED:
        order.delivered_at = now

    elif new_status == Order.Status.CANCELLED:
        order.cancelled_at = now

    order.save()

    OrderStatusHistory.objects.create(
        order=order,
        old_status=old_status,
        new_status=new_status,
        description=description,
        changed_by=changed_by,
    )

    return order
