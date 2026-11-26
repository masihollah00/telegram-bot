
from django.urls import path

from .views import (
    CustomerOrderListCreateView,
    CustomerOrderDetailView,
    CustomerOrderTrackingView,
    CustomerOrderCancellationView,
    GuestOrderTrackingView,
)


app_name = "jalali_orders"


urlpatterns = [

    # ثبت سفارش و فهرست سفارش‌های مشتری
    path(
        "orders/",
        CustomerOrderListCreateView.as_view(),
        name="customer-order-list-create",
    ),

    # جزئیات سفارش مشتری واردشده
    path(
        "orders/<uuid:order_id>/",
        CustomerOrderDetailView.as_view(),
        name="customer-order-detail",
    ),

    # پیگیری سفارش مشتری واردشده
    path(
        "orders/<uuid:order_id>/tracking/",
        CustomerOrderTrackingView.as_view(),
        name="customer-order-tracking",
    ),

    # پیگیری سفارش مهمان با شماره سفارش و توکن محرمانه
    path(
        "orders/guest/tracking/",
        GuestOrderTrackingView.as_view(),
        name="guest-order-tracking",
    ),

    # لغو سفارش مشتری واردشده
    path(
        "orders/<uuid:order_id>/cancel/",
        CustomerOrderCancellationView.as_view(),
        name="customer-order-cancel",
    ),

]
