
from django.db.models import Q
from django.utils import timezone

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Order
from .permissions import IsOrderManager
from .serializers import OrderSerializer
from .services import change_order_status


class AdminOrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, IsOrderManager]

    queryset = (
        Order.objects
        .select_related("customer")
        .prefetch_related("items", "status_history")
        .all()
        .order_by("-created_at")
    )

    def get_queryset(self):
        queryset = super().get_queryset()

        search = self.request.query_params.get("search")
        order_status = self.request.query_params.get("status")
        payment_status = self.request.query_params.get(
            "payment_status"
        )

        if search:
            queryset = queryset.filter(
                Q(order_number__icontains=search)
                | Q(customer_name__icontains=search)
                | Q(customer_phone__icontains=search)
                | Q(tracking_code__icontains=search)
            )

        if order_status:
            queryset = queryset.filter(status=order_status)

        if payment_status:
            queryset = queryset.filter(
                payment_status=payment_status
            )

        return queryset

    @action(detail=True, methods=["post"])
    def change_status(self, request, pk=None):
        order = self.get_object()

        new_status = request.data.get("status")
        description = request.data.get("description", "")

        if not isinstance(new_status, str) or not new_status:
            raise ValidationError({
                "status": "وضعیت جدید سفارش الزامی است."
            })

        if not isinstance(description, str):
            raise ValidationError({
                "description": "توضیحات معتبر نیست."
            })

        if len(description) > 2000:
            raise ValidationError({
                "description": "توضیحات بیش از حد طولانی است."
            })

        order = change_order_status(
            order_id=order.id,
            new_status=new_status,
            changed_by=request.user,
            description=description,
        )

        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def set_tracking(self, request, pk=None):
        order = self.get_object()

        tracking_code = request.data.get("tracking_code")

        if not isinstance(tracking_code, str):
            raise ValidationError({
                "tracking_code": "کد رهگیری معتبر نیست."
            })

        tracking_code = tracking_code.strip()

        if not tracking_code or len(tracking_code) > 100:
            raise ValidationError({
                "tracking_code": "کد رهگیری باید بین ۱ تا ۱۰۰ نویسه باشد."
            })

        if order.status not in (
            Order.Status.PROCESSING,
            Order.Status.SHIPPED,
        ):
            raise ValidationError(
                "ثبت کد رهگیری فقط برای سفارش در حال آماده‌سازی یا ارسال‌شده مجاز است."
            )

        order.tracking_code = tracking_code

        if order.status == Order.Status.PROCESSING:
            order.status = Order.Status.SHIPPED
            order.shipped_at = timezone.now()

        order.save(
            update_fields=[
                "tracking_code",
                "status",
                "shipped_at",
                "updated_at",
            ]
        )

        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_200_OK,
        )
