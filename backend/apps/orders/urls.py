
from django.urls import path

from .views import (
    CustomerOrderListCreateView,
    CustomerOrderDetailView,
    CustomerOrderTrackingView,
    CustomerOrderCancellationView,
)


app_name = "jalali_orders"


urlpatterns = [
    path(
        "orders/",
        CustomerOrderListCreateView.as_view(),
        name="customer-order-list-create",
    ),

    path(
        "orders/<uuid:order_id>/",
        CustomerOrderDetailView.as_view(),
        name="customer-order-detail",
    ),

    path(
        "orders/<uuid:order_id>/tracking/",
        CustomerOrderTrackingView.as_view(),
        name="customer-order-tracking",
    ),

    path(
        "orders/<uuid:order_id>/cancel/",
        CustomerOrderCancellationView.as_view(),
        name="customer-order-cancel",
    ),
]
