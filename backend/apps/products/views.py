from django.db.models import Q
from django.shortcuts import get_object_or_404

from rest_framework import generics, filters
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


class StorePagination(PageNumberPagination):
    page_size = 24
    page_size_query_param = "page_size"
    max_page_size = 100


class PublicProductQuerySet:
    @staticmethod
    def get_queryset():
        return (
            Product.objects
            .filter(is_active=True)
            .select_related("category", "brand")
            .prefetch_related("gallery", "price_tiers")
        )


class ProductListView(generics.ListAPIView):
    """
    فهرست محصولات فعال فروشگاه.
    """

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
    ]

    ordering = ["-created_at"]

    def get_queryset(self):
        queryset = PublicProductQuerySet.get_queryset()

        category = self.request.query_params.get("category")
        brand = self.request.query_params.get("brand")
        availability = self.request.query_params.get("availability")
        featured = self.request.query_params.get("featured")
        minimum_price = self.request.query_params.get("min_price")
        maximum_price = self.request.query_params.get("max_price")

        if category:
            queryset = queryset.filter(
                Q(category__slug=category)
                | Q(category__id=category)
            )

        if brand:
            queryset = queryset.filter(
                Q(brand__slug=brand)
                | Q(brand__id=brand)
            )

        if availability in ("in_stock", "out_of_stock"):
            queryset = queryset.filter(
                availability=availability
            )

        if featured in ("true", "1"):
            queryset = queryset.filter(is_featured=True)

        if minimum_price:
            try:
                queryset = queryset.filter(
                    public_price__gte=int(minimum_price)
                )
            except (ValueError, TypeError):
                queryset = queryset.none()

        if maximum_price:
            try:
                queryset = queryset.filter(
                    public_price__lte=int(maximum_price)
                )
            except (ValueError, TypeError):
                queryset = queryset.none()

        return queryset


class ProductDetailView(generics.RetrieveAPIView):
    """
    جزئیات یک محصول با شناسه یا اسلاگ.
    """

    serializer_class = ProductPublicSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    lookup_field = "slug"

    def get_queryset(self):
        return PublicProductQuerySet.get_queryset()

    def get_object(self):
        identifier = self.kwargs.get("identifier")

        queryset = self.get_queryset()

        product = queryset.filter(
            Q(slug=identifier)
            | Q(id=identifier)
        ).first()

        if product is None:
            from rest_framework.exceptions import NotFound

            raise NotFound(
                "محصول موردنظر پیدا نشد."
            )

        return product


class ProductCategoryListView(generics.ListAPIView):
    """
    فهرست دسته‌بندی‌های فعال.
    """

    serializer_class = ProductCategorySerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    def get_queryset(self):
        return (
            ProductCategory.objects
            .filter(is_active=True)
            .order_by("sort_order", "name")
        )


class ProductCategoryDetailView(generics.RetrieveAPIView):
    """
    جزئیات یک دسته‌بندی.
    """

    serializer_class = ProductCategorySerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    lookup_field = "slug"

    def get_queryset(self):
        return ProductCategory.objects.filter(
            is_active=True
        )


class ProductBrandListView(generics.ListAPIView):
    """
    فهرست برندهای فعال.
    """

    serializer_class = ProductBrandSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    search_fields = ["name", "description"]
    filter_backends = [filters.SearchFilter]

    def get_queryset(self):
        return ProductBrand.objects.filter(
            is_active=True
        ).order_by("name")


class ProductBrandDetailView(generics.RetrieveAPIView):
    """
    جزئیات یک برند.
    """

    serializer_class = ProductBrandSerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    lookup_field = "slug"

    def get_queryset(self):
        return ProductBrand.objects.filter(
            is_active=True
        )


class FeaturedProductListView(generics.ListAPIView):
    """
    محصولات ویژه صفحه اصلی.
    """

    serializer_class = ProductPublicSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    pagination_class = None

    def get_queryset(self):
        limit = self.request.query_params.get("limit", "8")

        try:
            limit = max(1, min(int(limit), 30))
        except (ValueError, TypeError):
            limit = 8

        return (
            PublicProductQuerySet.get_queryset()
            .filter(is_featured=True)
            .order_by("-created_at")[:limit]
        )


class ProductAvailabilityView(APIView):
    """
    نمایش وضعیت عمومی موجودی یک محصول.
    تعداد واقعی انبار افشا نمی‌شود.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, identifier):
        product = get_object_or_404(
            Product.objects.filter(is_active=True),
            Q(slug=identifier) | Q(id=identifier),
        )

        return Response({
            "success": True,
            "product_id": str(product.id),
            "sku": product.sku,
            "availability": product.availability,
            "available": product.stock_quantity > 0,
            "message": (
                "موجود"
                if product.stock_quantity > 0
                else "ناموجود"
            ),
        })
