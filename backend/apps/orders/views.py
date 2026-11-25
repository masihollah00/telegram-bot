
from django.db.models import Prefetch
from rest_framework import generics, permissions
from rest_framework.exceptions import NotFound

from .models import Order, OrderItem, OrderStatusHistory
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
            .prefetch_related(
                "items",
                "status_history",
            )
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
            .prefetch_related(
                "items",
                "status_history",
            )
        )


class CustomerOrderTrackingView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"
    lookup_url_kwarg = "order_id"

    def get_queryset(self):
        return Order.objects.filter(
            customer=self.request.user
        ).prefetch_related("items", "status_history")
