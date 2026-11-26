
import hashlib
import secrets

from django.db import transaction
from django.utils import timezone

from rest_framework import generics, permissions, status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.products.models import Product

from .models import Order, OrderStatusHistory
from .serializers import (
    OrderSerializer,
    OrderCreateSerializer,
)


class CustomerOrderListCreateView(generics.ListCreateAPIView):

    def get_permissions(self):

        if self.request.method == "POST":
            return [permissions.AllowAny()]

        return [permissions.IsAuthenticated()]

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

    def create(self, request, *args, **kwargs):

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order = serializer.save()

        response_data = OrderSerializer(
            order,
            context={"request": request},
        ).data

        response_data["success"] = True
        response_data["message"] = "سفارش با موفقیت ثبت شد."

        # توکن خام فقط یک‌بار برای مشتری مهمان ارسال می‌شود.
        if order.customer_type == Order.CustomerType.GUEST:

            response_data["guest_tracking_token"] = (
                getattr(order, "_guest_tracking_token", None)
            )

        return Response(
            response_data,
            status=status.HTTP_201_CREATED,
        )


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


class GuestOrderTrackingView(APIView):

    permission_classes = [permissions.AllowAny]

    def post(self, request):

        order_number = request.data.get("order_number", "")
        tracking_token = request.data.get("tracking_token", "")

        if not isinstance(order_number, str):
            raise ValidationError({
                "order_number": "شماره سفارش معتبر نیست."
            })

        if not isinstance(tracking_token, str):
            raise ValidationError({
                "tracking_token": "کد پیگیری معتبر نیست."
            })

        order_number = order_number.strip()
        tracking_token = tracking_token.strip()

        if not order_number or not tracking_token:
            raise ValidationError({
                "detail": "شماره سفارش و کد پیگیری الزامی هستند."
            })

        if len(order_number) > 32 or len(tracking_token) > 256:
            raise ValidationError({
                "detail": "اطلاعات پیگیری معتبر نیست."
            })

        try:

            order = (
                Order.objects
                .prefetch_related("items")
                .get(
                    order_number=order_number,
                    customer__isnull=True,
                    customer_type=Order.CustomerType.GUEST,
                )
            )

        except Order.DoesNotExist:

            raise NotFound(
                "سفارش پیدا نشد یا اطلاعات پیگیری اشتباه است."
            )

        supplied_hash = hashlib.sha256(
            tracking_token.encode("utf-8")
        ).hexdigest()

        stored_hash = order.guest_tracking_token_hash

        if not stored_hash or not secrets.compare_digest(
            supplied_hash,
            stored_hash,
        ):

            raise NotFound(
                "سفارش پیدا نشد یا اطلاعات پیگیری اشتباه است."
            )

        # اطلاعات خصوصی مشتری هرگز در پاسخ عمومی قرار نمی‌گیرد.
        return Response({

            "success": True,

            "order": {
                "order_number": order.order_number,
                "status": order.status,
                "payment_status": order.payment_status,
                "total_amount": order.total_amount,
                "currency": order.currency,
                "tracking_code": order.tracking_code,
                "placed_at": order.placed_at,
                "confirmed_at": order.confirmed_at,
                "shipped_at": order.shipped_at,
                "delivered_at": order.delivered_at,

                "items": [
                    {
                        "product_name": item.product_name,
                        "product_sku": item.product_sku,
                        "quantity": item.quantity,
                        "unit_price": item.unit_price,
                        "line_total": item.line_total,
                    }
                    for item in order.items.all()
                ],
            },

        }, status=status.HTTP_200_OK)


class CustomerOrderCancellationView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, order_id):

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

            raise NotFound("سفارش موردنظر پیدا نشد.")

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

        for item in order_items:

            product = product_map.get(item.product_id)

            if product is None:

                raise ValidationError(
                    "یکی از محصولات سفارش دیگر در دسترس نیست."
                )

            product.stock_quantity += item.quantity

            product.save(
                update_fields=[
                    "stock_quantity",
                    "availability",
                    "updated_at",
                ]
            )

        old_status = order.status

        order.status = Order.Status.CANCELLED
        order.cancelled_at = timezone.now()

        order.save(
            update_fields=[
                "status",
                "cancelled_at",
                "updated_at",
            ]
        )

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
