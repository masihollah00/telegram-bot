
import uuid

from django.db.models import Q
from django.shortcuts import get_object_or_404

from rest_framework import generics, filters
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination

from .models import (
    Product,
    ProductCategory,
    ProductBrand,
)

from .serializers import (
    ProductPublicSerializer,
    ProductCategorySerializer,
    ProductBrandSerializer,
)


# =========================================================
# STORE PAGINATION
# =========================================================

class StorePagination(PageNumberPagination):

    page_size = 24
    page_size_query_param = "page_size"
    max_page_size = 100


# =========================================================
# PUBLIC PRODUCT QUERYSET
# =========================================================

class PublicProductQuerySet:

    @staticmethod
    def get_queryset():

        return (
            Product.objects
            .filter(is_active=True)
            .select_related(
                "category",
                "brand",
            )
            .prefetch_related(
                "gallery",
                "price_tiers",
            )
        )


# =========================================================
# PRODUCT LOOKUP HELPER
# =========================================================

def find_public_product(identifier):

    queryset = PublicProductQuerySet.get_queryset()

    # ابتدا جست‌وجو با اسلاگ
    product = queryset.filter(
        slug=identifier
    ).first()

    if product:
        return product

    # سپس جست‌وجو با UUID معتبر
    try:
        product_uuid = uuid.UUID(str(identifier))
    except (ValueError, TypeError, AttributeError):
        raise NotFound(
            "محصول موردنظر پیدا نشد."
        )

    product = queryset.filter(
        id=product_uuid
    ).first()

    if not product:
        raise NotFound(
            "محصول موردنظر پیدا نشد."
        )

    return product


# =========================================================
# PRODUCT LIST
# =========================================================

class ProductListView(generics.ListAPIView):

    serializer_class = ProductPublicSerializer

    permission_classes = [AllowAny]
    authentication_classes = []

    pagination_class = StorePagination

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "name",
        "sku",
        "barcode",
        "short_description",
        "description",
        "brand__name",
        "category__name",
    ]

    ordering_fields = [
        "name",
        "public_price",
        "created_at",
        "updated_at",
    ]

    ordering = ["-created_at"]

    def get_queryset(self):

        queryset = PublicProductQuerySet.get_queryset()

        params = self.request.query_params

        category = params.get("category")
        brand = params.get("brand")
        availability = params.get("availability")
        featured = params.get("featured")

        minimum_price = params.get("min_price")
        maximum_price = params.get("max_price")

        # Category filter
        if category:

            queryset = queryset.filter(
                Q(category__slug=category)
                | Q(category__id=category)
            )

        # Brand filter
        if brand:

            queryset = queryset.filter(
                Q(brand__slug=brand)
                | Q(brand__id=brand)
            )

        # Availability filter
        if availability in (
            Product.Availability.IN_STOCK,
            Product.Availability.OUT_OF_STOCK,
        ):

            queryset = queryset.filter(
                availability=availability
            )

        # Featured filter
        if featured in ("true", "1"):

            queryset = queryset.filter(
                is_featured=True
            )

        elif featured in ("false", "0"):

            queryset = queryset.filter(
                is_featured=False
            )

        # Minimum price
        if minimum_price:

            try:
                minimum_price = int(minimum_price)

                if minimum_price < 0:
                    return queryset.none()

                queryset = queryset.filter(
                    public_price__gte=minimum_price
                )

            except (ValueError, TypeError):

                return queryset.none()

        # Maximum price
        if maximum_price:

            try:
                maximum_price = int(maximum_price)

                if maximum_price < 0:
                    return queryset.none()

                queryset = queryset.filter(
                    public_price__lte=maximum_price
                )

            except (ValueError, TypeError):

                return queryset.none()

        # جلوگیری از بازه قیمت نامعتبر
        if minimum_price and maximum_price:

            try:

                if int(minimum_price) > int(maximum_price):
                    return queryset.none()

            except (ValueError, TypeError):
                return queryset.none()

        return queryset


# =========================================================
# PRODUCT DETAIL
# =========================================================

class ProductDetailView(generics.RetrieveAPIView):

    serializer_class = ProductPublicSerializer

    permission_classes = [AllowAny]
    authentication_classes = []

    def get_object(self):

        identifier = self.kwargs.get("identifier")

        return find_public_product(identifier)


# =========================================================
# CATEGORY LIST
# =========================================================

class ProductCategoryListView(generics.ListAPIView):

    serializer_class = ProductCategorySerializer

    permission_classes = [AllowAny]
    authentication_classes = []

    def get_queryset(self):

        return (
            ProductCategory.objects
            .filter(is_active=True)
            .order_by(
                "sort_order",
                "name",
            )
        )


# =========================================================
# CATEGORY DETAIL
# =========================================================

class ProductCategoryDetailView(generics.RetrieveAPIView):

    serializer_class = ProductCategorySerializer

    permission_classes = [AllowAny]
    authentication_classes = []

    lookup_field = "slug"

    def get_queryset(self):

        return ProductCategory.objects.filter(
            is_active=True
        )


# =========================================================
# BRAND LIST
# =========================================================

class ProductBrandListView(generics.ListAPIView):

    serializer_class = ProductBrandSerializer

    permission_classes = [AllowAny]
    authentication_classes = []

    filter_backends = [
        filters.SearchFilter,
    ]

    search_fields = [
        "name",
        "description",
    ]

    def get_queryset(self):

        return (
            ProductBrand.objects
            .filter(is_active=True)
            .order_by("name")
        )


# =========================================================
# BRAND DETAIL
# =========================================================

class ProductBrandDetailView(generics.RetrieveAPIView):

    serializer_class = ProductBrandSerializer

    permission_classes = [AllowAny]
    authentication_classes = []

    lookup_field = "slug"

    def get_queryset(self):

        return ProductBrand.objects.filter(
            is_active=True
        )


# =========================================================
# FEATURED PRODUCTS
# =========================================================

class FeaturedProductListView(generics.ListAPIView):

    serializer_class = ProductPublicSerializer

    permission_classes = [AllowAny]
    authentication_classes = []

    pagination_class = None

    def get_queryset(self):

        raw_limit = self.request.query_params.get(
            "limit",
            "8",
        )

        try:

            limit = int(raw_limit)

            limit = max(
                1,
                min(limit, 30),
            )

        except (ValueError, TypeError):

            limit = 8

        return (
            PublicProductQuerySet.get_queryset()
            .filter(is_featured=True)
            .order_by("-created_at")[:limit]
        )


# =========================================================
# PRODUCT AVAILABILITY
# =========================================================

class ProductAvailabilityView(APIView):

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, identifier):

        product = find_public_product(identifier)

        available = product.stock_quantity > 0

        return Response({

            "success": True,

            "product_id": str(product.id),

            "sku": product.sku,

            "availability": product.availability,

            "available": available,

            "message": (
                "موجود"
                if available
                else "ناموجود"
            ),

        })
