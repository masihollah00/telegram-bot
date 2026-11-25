
from rest_framework.routers import DefaultRouter

from .admin_views import AdminOrderViewSet


app_name = "jalali_orders_admin"

router = DefaultRouter()

router.register(
    r"orders",
    AdminOrderViewSet,
    basename="admin-order",
)

urlpatterns = router.urls
