
import uuid

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "در انتظار بررسی"
        CONFIRMED = "confirmed", "تأیید شده"
        PROCESSING = "processing", "در حال آماده‌سازی"
        SHIPPED = "shipped", "ارسال شده"
        DELIVERED = "delivered", "تحویل شده"
        CANCELLED = "cancelled", "لغو شده"
        REFUNDED = "refunded", "مرجوع شده"

    class PaymentStatus(models.TextChoices):
        UNPAID = "unpaid", "پرداخت نشده"
        PENDING = "pending", "در انتظار پرداخت"
        PAID = "paid", "پرداخت شده"
        FAILED = "failed", "ناموفق"
        REFUNDED = "refunded", "بازپرداخت شده"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    order_number = models.CharField(
        max_length=32,
        unique=True,
        db_index=True,
    )

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="jalali_orders",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )

    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.UNPAID,
        db_index=True,
    )

    subtotal = models.PositiveBigIntegerField(default=0)
    discount_amount = models.PositiveBigIntegerField(default=0)
    shipping_amount = models.PositiveBigIntegerField(default=0)
    tax_amount = models.PositiveBigIntegerField(default=0)
    total_amount = models.PositiveBigIntegerField(default=0)

    currency = models.CharField(max_length=8, default="IRT")

    customer_name = models.CharField(max_length=160)
    customer_phone = models.CharField(max_length=20)
    customer_email = models.EmailField(blank=True)

    province = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    shipping_address = models.TextField()

    customer_note = models.TextField(blank=True)
    admin_note = models.TextField(blank=True)

    tracking_code = models.CharField(
        max_length=100,
        blank=True,
        db_index=True,
    )

    placed_at = models.DateTimeField(default=timezone.now)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["customer", "created_at"]),
            models.Index(fields=["payment_status", "created_at"]),
        ]

    def __str__(self):
        return self.order_number


class OrderItem(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
    )

    product = models.ForeignKey(
        "jalali_products.Product",
        on_delete=models.PROTECT,
        related_name="order_items",
    )

    product_name = models.CharField(max_length=250)
    product_sku = models.CharField(max_length=100)
    quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)]
    )

    unit_price = models.PositiveBigIntegerField()
    discount_amount = models.PositiveBigIntegerField(default=0)
    line_total = models.PositiveBigIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def save(self, *args, **kwargs):
        self.line_total = max(
            0,
            (self.unit_price * self.quantity) - self.discount_amount,
        )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product_name} × {self.quantity}"


class OrderStatusHistory(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="status_history",
    )

    old_status = models.CharField(max_length=20, blank=True)
    new_status = models.CharField(max_length=20)
    description = models.TextField(blank=True)

    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="jalali_order_status_changes",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.order.order_number}: {self.new_status}"
