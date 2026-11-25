from django.urls import path

from .views import (
    ProductListView,
    ProductDetailView,
    ProductCategoryListView,
    ProductCategoryDetailView,
    ProductBrandListView,
    ProductBrandDetailView,
    FeaturedProductListView,
    ProductAvailabilityView,
)


app_name = "jalali_products"


urlpatterns = [
    # محصولات
    path(
        "products/",
        ProductListView.as_view(),
        name="product-list",
    ),
    path(
        "products/<str:identifier>/",
        ProductDetailView.as_view(),
        name="product-detail",
    ),
    path(
        "products/<str:identifier>/availability/",
        ProductAvailabilityView.as_view(),
        name="product-availability",
    ),

    # محصولات ویژه
    path(
        "featured/",
        FeaturedProductListView.as_view(),
        name="featured-products",
    ),

    # دسته‌بندی‌ها
    path(
        "categories/",
        ProductCategoryListView.as_view(),
        name="category-list",
    ),
    path(
        "categories/<slug:slug>/",
        ProductCategoryDetailView.as_view(),
        name="category-detail",
    ),

    # برندها
    path(
        "brands/",
        ProductBrandListView.as_view(),
        name="brand-list",
    ),
    path(
        "brands/<slug:slug>/",
        ProductBrandDetailView.as_view(),
        name="brand-detail",
    ),
]
