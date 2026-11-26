
from django.db.models import Q

from rest_framework import filters, serializers, viewsets
from rest_framework.parsers import (
    JSONParser,
    FormParser,
    MultiPartParser,
)
from rest_framework.permissions import IsAdminUser

from .models import (
    Product,
    ProductCategory,
    ProductBrand,
    ProductImage,
    ProductPriceTier,
)

from .serializers import (
    ProductAdminSerializer,
    ProductImageAdminSerializer,
    ProductPriceTierAdminSerializer,
)


# =========================================================
# BASE ADMIN VIEWSET
# =========================================================

class AdminBaseViewSet(viewsets.ModelViewSet):
    """
    پایه مشترک مدیریت محصولات فروشگاه JALALI
    """

    permission_classes = [IsAdminUser]

    parser_classes = [
        JSONParser,
        FormParser,
        MultiPartParser,
    ]

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    ordering = ["-pk"]


# =========================================================
# CATEGORY ADMIN SERIALIZER
# =========================================================

class AdminProductCategorySerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = ProductCategory
        fields = "__all__"

        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
        )


# =========================================================
# BRAND ADMIN SERIALIZER
# =========================================================

class AdminProductBrandSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = ProductBrand
        fields = "__all__"

        read_only_fields = (
            "id",
            "created_at",
        )


# =========================================================
# CATEGORY ADMIN VIEWSET
# =========================================================

class AdminProductCategoryViewSet(AdminBaseViewSet):

    serializer_class = AdminProductCategorySerializer

    queryset = ProductCategory.objects.all()

    search_fields = [
        "name",
        "slug",
        "description",
    ]

    ordering_fields = [
        "name",
        "sort_order",
        "created_at",
        "updated_at",
    ]

    def get_queryset(self):
        queryset = super().get_queryset()

        active = self.request.query_params.get("active")

        if active in ("true", "1"):
            queryset = queryset.filter(is_active=True)

        elif active in ("false", "0"):
            queryset = queryset.filter(is_active=False)

        return queryset


# =========================================================
# BRAND ADMIN VIEWSET
# =========================================================

class AdminProductBrandViewSet(AdminBaseViewSet):

    serializer_class = AdminProductBrandSerializer

    queryset = ProductBrand.objects.all()

    search_fields = [
        "name",
        "slug",
        "description",
    ]

    ordering_fields = [
        "name",
        "created_at",
    ]

    def get_queryset(self):
        queryset = super().get_queryset()

        active = self.request.query_params.get("active")

        if active in ("true", "1"):
            queryset = queryset.filter(is_active=True)

        elif active in ("false", "0"):
            queryset = queryset.filter(is_active=False)

        return queryset


# =========================================================
# PRODUCT ADMIN VIEWSET
# =========================================================

class AdminProductViewSet(AdminBaseViewSet):

    serializer_class = ProductAdminSerializer

    search_fields = [
        "name",
        "sku",
        "barcode",
        "short_description",
        "description",
        "category__name",
        "brand__name",
    ]

    ordering_fields = [
        "name",
        "public_price",
        "cost_price",
        "stock_quantity",
        "created_at",
        "updated_at",
    ]

    def get_queryset(self):

        queryset = (
            Product.objects
            .select_related(
                "category",
                "brand",
            )
            .prefetch_related(
                "gallery",
                "price_tiers",
            )
        )

        params = self.request.query_params

        # Category filter
        category = params.get("category")

        if category:
            queryset = queryset.filter(
                Q(category__slug=category)
                | Q(category__id=category)
            )

        # Brand filter
        brand = params.get("brand")

        if brand:
            queryset = queryset.filter(
                Q(brand__slug=brand)
                | Q(brand__id=brand)
            )

        # Active filter
        active = params.get("active")

        if active in ("true", "1"):
            queryset = queryset.filter(is_active=True)

        elif active in ("false", "0"):
            queryset = queryset.filter(is_active=False)

        # Featured filter
        featured = params.get("featured")

        if featured in ("true", "1"):
            queryset = queryset.filter(is_featured=True)

        elif featured in ("false", "0"):
            queryset = queryset.filter(is_featured=False)

        # SKU exact filter
        sku = params.get("sku")

        if sku:
            queryset = queryset.filter(
                sku__iexact=sku.strip()
            )

        # Availability filter
        availability = params.get("availability")

        if availability in (
            Product.Availability.IN_STOCK,
            Product.Availability.OUT_OF_STOCK,
        ):
            queryset = queryset.filter(
                availability=availability
            )

        # Stock filters
        stock = params.get("stock")

        if stock == "available":
            queryset = queryset.filter(
                stock_quantity__gt=0
            )

        elif stock == "empty":
            queryset = queryset.filter(
                stock_quantity=0
            )

        return queryset


# =========================================================
# PRODUCT IMAGE ADMIN VIEWSET
# =========================================================

class AdminProductImageViewSet(AdminBaseViewSet):

    serializer_class = ProductImageAdminSerializer

    queryset = (
        ProductImage.objects
        .select_related("product")
        .all()
    )

    search_fields = [
        "product__name",
        "product__sku",
        "alt_text",
    ]

    ordering_fields = [
        "sort_order",
        "created_at",
    ]

    def get_queryset(self):

        queryset = super().get_queryset()

        product_id = self.request.query_params.get(
            "product"
        )

        if product_id:
            queryset = queryset.filter(
                product_id=product_id
            )

        primary = self.request.query_params.get(
            "primary"
        )

        if primary in ("true", "1"):
            queryset = queryset.filter(
                is_primary=True
            )

        elif primary in ("false", "0"):
            queryset = queryset.filter(
                is_primary=False
            )

        return queryset


# =========================================================
# PRODUCT PRICE TIER ADMIN VIEWSET
# =========================================================

class AdminProductPriceTierViewSet(AdminBaseViewSet):

    serializer_class = ProductPriceTierAdminSerializer

    queryset = (
        ProductPriceTier.objects
        .select_related("product")
        .all()
    )

    search_fields = [
        "product__name",
        "product__sku",
    ]

    ordering_fields = [
        "minimum_quantity",
        "unit_price",
        "created_at",
    ]

    def get_queryset(self):

        queryset = super().get_queryset()

        product_id = self.request.query_params.get(
            "product"
        )

        if product_id:
            queryset = queryset.filter(
                product_id=product_id
            )

        active = self.request.query_params.get(
            "active"
        )

        if active in ("true", "1"):
            queryset = queryset.filter(
                is_active=True
            )

        elif active in ("false", "0"):
            queryset = queryset.filter(
                is_active=False
            )

        return queryset
