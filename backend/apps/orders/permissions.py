
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsOrderManager(BasePermission):
    """
    دسترسی مدیریتی سفارش‌ها فقط برای کارکنان مجاز.
    """

    message = "شما اجازه مدیریت سفارش‌ها را ندارید."

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        if not user.is_staff:
            return False

        if user.is_superuser:
            return True

        return user.has_perm("orders.view_order") or (
            request.method not in SAFE_METHODS
            and user.has_perm("orders.change_order")
        )


class IsOrderOwnerOrManager(BasePermission):
    """
    مشتری فقط سفارش خودش را مشاهده می‌کند.
    مدیر مجاز می‌تواند سفارش‌ها را مدیریت کند.
    """

    def has_object_permission(self, request, view, obj):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        if user.is_superuser:
            return True

        if user.is_staff and user.has_perm("orders.view_order"):
            return True

        return obj.customer_id == user.id and request.method in SAFE_METHODS
