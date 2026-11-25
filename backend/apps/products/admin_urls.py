
from rest_framework.routers import DefaultRouter

from .admin_views import (
    AdminProductCategoryViewSet,
    AdminProductBrandViewSet,
    AdminProductViewSet,
    AdminProductImageViewSet,
    AdminProductPriceTierViewSet,
)

app_name = "jalali_products_admin"

router = DefaultRouter()

router.register(
    r"categories",
    AdminProductCategoryViewSet,
    basename="admin-product-category",
)

router.register(
    r"brands",
    AdminProductBrandViewSet,
    basename="admin-product-brand",
)

router.register(
    r"products",
    AdminProductViewSet,
    basename="admin-product",
)

router.register(
    r"product-images",
    AdminProductImageViewSet,
    basename="admin-product-image",
)

router.register(
    r"price-tiers",
    AdminProductPriceTierViewSet,
    basename="admin-product-price-tier",
)

urlpatterns = router.urls
