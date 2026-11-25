from django.contrib import admin
from django.db.models import Count
from django.utils.html import format_html

from .models import (
    Product,
    ProductCategory,
    ProductBrand,
    ProductImage,
    ProductPriceTier,
)


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = (
        "image",
        "alt_text",
        "sort_order",
        "is_primary",
    )


class ProductPriceTierInline(admin.TabularInline):
    model = ProductPriceTier
    extra = 0
    fields = (
        "minimum_quantity",
        "unit_price",
        "is_active",
    )


@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "slug",
        "product_count",
        "is_active",
        "sort_order",
    )
    list_filter = ("is_active",)
    search_fields = ("name", "slug", "description")
    prepopulated_fields = {"slug": ("name",)}
    ordering = ("sort_order", "name")

    @admin.display(description="تعداد محصولات")
    def product_count(self, obj):
        return obj.products.count()


@admin.register(ProductBrand)
class ProductBrandAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "slug",
        "is_active",
        "website",
        "created_at",
    )
    list_filter = ("is_active",)
    search_fields = ("name", "slug", "description")
    prepopulated_fields = {"slug": ("name",)}
    ordering = ("name",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "sku",
        "category",
        "brand",
        "public_price",
        "stock_quantity",
        "availability",
        "is_active",
        "is_featured",
    )
    list_filter = (
        "is_active",
        "is_featured",
        "availability",
        "category",
        "brand",
    )
    search_fields = (
        "name",
        "sku",
        "barcode",
        "description",
    )
    readonly_fields = (
        "id",
        "availability",
        "created_at",
        "updated_at",
        "image_preview",
    )
    list_select_related = ("category", "brand")
    inlines = (
        ProductImageInline,
        ProductPriceTierInline,
    )
    ordering = ("-created_at",)
    date_hierarchy = "created_at"
    list_per_page = 50

    fieldsets = (
        (
            "اطلاعات اصلی",
            {
                "fields": (
                    "name",
                    "slug",
                    "sku",
                    "barcode",
                    "category",
                    "brand",
                )
            },
        ),
        (
            "توضیحات و تصاویر",
            {
                "fields": (
                    "short_description",
                    "description",
                    "image",
                    "image_preview",
                )
            },
        ),
        (
            "قیمت و موجودی",
            {
                "fields": (
                    "public_price",
                    "cost_price",
                    "stock_quantity",
                    "availability",
                    "minimum_order_quantity",
                    "units_per_carton",
                    "weight_grams",
                )
            },
        ),
        (
            "وضعیت نمایش",
            {
                "fields": (
                    "is_active",
                    "is_featured",
                )
            },
        ),
        (
            "بهینه‌سازی موتور جستجو",
            {
                "fields": (
                    "seo_title",
                    "seo_description",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "اطلاعات سیستمی",
            {
                "fields": (
                    "id",
                    "created_at",
                    "updated_at",
                ),
                "classes": ("collapse",),
            },
        ),
    )

    @admin.display(description="پیش‌نمایش تصویر")
    def image_preview(self, obj):
        if not obj or not obj.image:
            return "تصویری ثبت نشده است"

        try:
            return format_html(
                '<img src="{}" style="max-width:160px;'
                'max-height:160px;object-fit:contain;'
                'border-radius:12px;" />',
                obj.image.url,
            )
        except (ValueError, OSError):
            return "تصویر در دسترس نیست"

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related(
            "category",
            "brand",
        ).prefetch_related(
            "gallery",
            "price_tiers",
        )


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = (
        "product",
        "alt_text",
        "sort_order",
        "is_primary",
        "created_at",
    )
    list_filter = ("is_primary", "created_at")
    search_fields = (
        "product__name",
        "product__sku",
        "alt_text",
    )
    list_select_related = ("product",)
    ordering = ("product", "sort_order")


@admin.register(ProductPriceTier)
class ProductPriceTierAdmin(admin.ModelAdmin):
    list_display = (
        "product",
        "minimum_quantity",
        "unit_price",
        "is_active",
        "created_at",
    )
    list_filter = ("is_active",)
    search_fields = (
        "product__name",
        "product__sku",
    )
    list_select_related = ("product",)
    ordering = ("product", "minimum_quantity")
