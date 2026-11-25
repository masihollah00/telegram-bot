
from django.db import transaction
from django.utils import timezone

from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.products.models import Product

from .models import Order, OrderStatusHistory
from .serializers import (
    OrderSerializer,
    OrderCreateSerializer,
)


class CustomerOrderListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Order.objects
            .filter(customer=self.request.user)
            .prefetch_related("items", "status_history")
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return OrderCreateSerializer
        return OrderSerializer

    def perform_create(self, serializer):
        serializer.save()


class CustomerOrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"
    lookup_url_kwarg = "order_id"

    def get_queryset(self):
        return (
            Order.objects
            .filter(customer=self.request.user)
            .prefetch_related("items", "status_history")
        )


class CustomerOrderTrackingView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"
    lookup_url_kwarg = "order_id"

    def get_queryset(self):
        return (
            Order.objects
            .filter(customer=self.request.user)
            .prefetch_related("items", "status_history")
        )


class CustomerOrderCancellationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, order_id):
        # قفل سفارش برای جلوگیری از لغو هم‌زمان
        try:
            order = (
                Order.objects
                .select_for_update()
                .get(
                    id=order_id,
                    customer=request.user,
                )
            )
        except Order.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("سفارش موردنظر پیدا نشد.")

        # سفارش فقط در وضعیت اولیه و بدون پرداخت قابل لغو است
        if order.status != Order.Status.PENDING:
            raise ValidationError(
                "این سفارش دیگر در وضعیت قابل لغو نیست."
            )

        if order.payment_status not in (
            Order.PaymentStatus.UNPAID,
            Order.PaymentStatus.FAILED,
        ):
            raise ValidationError(
                "وضعیت پرداخت سفارش اجازه لغو خودکار را نمی‌دهد."
            )

        order_items = list(
            order.items.select_related("product").all()
        )

        product_ids = [
            item.product_id
            for item in order_items
        ]

        # قفل محصولات به ترتیب ثابت برای کاهش احتمال بن‌بست
        products = list(
            Product.objects
            .select_for_update()
            .filter(id__in=product_ids)
            .order_by("id")
        )

        product_map = {
            product.id: product
            for product in products
        }

        # بازگرداندن موجودی رزروشده
        for item in order_items:
            product = product_map.get(item.product_id)

            if product is None:
                raise ValidationError(
                    "یکی از محصولات سفارش دیگر در دسترس نیست. "
                    "برای اصلاح موجودی با مدیریت فروشگاه تماس بگیرید."
                )

            product.stock_quantity += item.quantity

            product.save(update_fields=[
                "stock_quantity",
                "availability",
                "updated_at",
            ])

        old_status = order.status

        order.status = Order.Status.CANCELLED
        order.cancelled_at = timezone.now()

        order.save(update_fields=[
            "status",
            "cancelled_at",
            "updated_at",
        ])

        OrderStatusHistory.objects.create(
            order=order,
            old_status=old_status,
            new_status=Order.Status.CANCELLED,
            description=(
                "سفارش توسط مشتری لغو شد و موجودی محصولات "
                "به انبار بازگردانده شد."
            ),
            changed_by=request.user,
        )

        return Response({
            "success": True,
            "message": "سفارش لغو شد و موجودی به انبار برگشت.",
            "order": OrderSerializer(
                order,
                context={"request": request},
            ).data,
        }, status=status.HTTP_200_OK)
