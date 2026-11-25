from django.db.models import Q

from rest_framework import viewsets, filters
from rest_framework.permissions import IsAdminUser
from rest_framework.parsers import (
    JSONParser,
    FormParser,
    MultiPartParser,
)

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


class AdminBaseViewSet(viewsets.ModelViewSet):
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


class AdminProductCategorySerializer(
    __import__(
        "rest_framework.serializers",
        fromlist=["ModelSerializer"]
    ).ModelSerializer
):
    class Meta:
        model = ProductCategory
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
        )


class AdminProductBrandSerializer(
    __import__(
        "rest_framework.serializers",
        fromlist=["ModelSerializer"]
    ).ModelSerializer
):
    class Meta:
        model = ProductBrand
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
        )


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
    ]


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


class AdminProductViewSet(AdminBaseViewSet):
    serializer_class = ProductAdminSerializer

    search_fields = [
        "name",
        "sku",
        "barcode",
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

        category = self.request.query_params.get(
            "category"
        )

        brand = self.request.query_params.get(
            "brand"
        )

        active = self.request.query_params.get(
            "active"
        )

        sku = self.request.query_params.get("sku")

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

        if active in ("true", "1"):
            queryset = queryset.filter(is_active=True)

        elif active in ("false", "0"):
            queryset = queryset.filter(is_active=False)

        if sku:
            queryset = queryset.filter(sku__iexact=sku.strip())

        return queryset


class AdminProductImageViewSet(AdminBaseViewSet):
    serializer_class = ProductImageAdminSerializer

    queryset = ProductImage.objects.select_related(
        "product"
    ).all()

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

        return queryset


class AdminProductPriceTierViewSet(AdminBaseViewSet):
    serializer_class = ProductPriceTierAdminSerializer

    queryset = ProductPriceTier.objects.select_related(
        "product"
    ).all()

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

        return queryset
