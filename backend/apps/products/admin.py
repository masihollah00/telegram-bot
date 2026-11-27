
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


# =========================================================
# INLINE MANAGEMENT
# =========================================================

class ProductImageInline(admin.TabularInline):

    model = ProductImage
    extra = 1
    show_change_link = True

    fields = (
        "image",
        "alt_text",
        "sort_order",
        "is_primary",
    )


class ProductPriceTierInline(admin.TabularInline):

    model = ProductPriceTier
    extra = 0
    show_change_link = True

    fields = (
        "minimum_quantity",
        "unit_price",
        "is_active",
    )


# =========================================================
# PRODUCT CATEGORY ADMIN
# =========================================================

@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "slug",
        "product_count",
        "is_active",
        "sort_order",
        "created_at",
    )

    list_filter = (
        "is_active",
        "created_at",
    )

    search_fields = (
        "name",
        "slug",
        "description",
    )

    prepopulated_fields = {
        "slug": ("name",),
    }

    ordering = (
        "sort_order",
        "name",
    )

    list_editable = (
        "is_active",
        "sort_order",
    )

    list_per_page = 50

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    actions = (
        "activate_categories",
        "deactivate_categories",
    )

    def get_queryset(self, request):

        queryset = super().get_queryset(request)

        return queryset.annotate(
            total_products=Count("products")
        )

    @admin.display(
        description="تعداد محصولات",
        ordering="total_products",
    )
    def product_count(self, obj):

        return obj.total_products

    @admin.action(description="فعال‌سازی دسته‌بندی‌های انتخاب‌شده")
    def activate_categories(self, request, queryset):

        updated = queryset.update(
            is_active=True
        )

        self.message_user(
            request,
            f"{updated} دسته‌بندی فعال شد."
        )

    @admin.action(description="غیرفعال‌سازی دسته‌بندی‌های انتخاب‌شده")
    def deactivate_categories(self, request, queryset):

        updated = queryset.update(
            is_active=False
        )

        self.message_user(
            request,
            f"{updated} دسته‌بندی غیرفعال شد."
        )


# =========================================================
# PRODUCT BRAND ADMIN
# =========================================================

@admin.register(ProductBrand)
class ProductBrandAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "slug",
        "is_active",
        "website",
        "created_at",
    )

    list_filter = (
        "is_active",
        "created_at",
    )

    search_fields = (
        "name",
        "slug",
        "description",
    )

    prepopulated_fields = {
        "slug": ("name",),
    }

    ordering = (
        "name",
    )

    list_editable = (
        "is_active",
    )

    list_per_page = 50

    readonly_fields = (
        "created_at",
    )

    actions = (
        "activate_brands",
        "deactivate_brands",
    )

    @admin.action(description="فعال‌سازی برندهای انتخاب‌شده")
    def activate_brands(self, request, queryset):

        updated = queryset.update(
            is_active=True
        )

        self.message_user(
            request,
            f"{updated} برند فعال شد."
        )

    @admin.action(description="غیرفعال‌سازی برندهای انتخاب‌شده")
    def deactivate_brands(self, request, queryset):

        updated = queryset.update(
            is_active=False
        )

        self.message_user(
            request,
            f"{updated} برند غیرفعال شد."
        )


# =========================================================
# PRODUCT ADMIN
# =========================================================

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):

    list_display = (
        "image_thumbnail",
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
        "created_at",
    )

    search_fields = (
        "name",
        "sku",
        "barcode",
        "short_description",
        "description",
    )

    list_select_related = (
        "category",
        "brand",
    )

    readonly_fields = (
        "id",
        "availability",
        "created_at",
        "updated_at",
        "image_preview",
    )

    inlines = (
        ProductImageInline,
        ProductPriceTierInline,
    )

    ordering = (
        "-created_at",
    )

    date_hierarchy = "created_at"

    list_per_page = 50

    list_editable = (
        "is_active",
        "is_featured",
    )

    actions = (
        "activate_products",
        "deactivate_products",
        "feature_products",
        "unfeature_products",
    )

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
                "classes": (
                    "collapse",
                ),
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
                "classes": (
                    "collapse",
                ),
            },
        ),

    )

    def get_queryset(self, request):

        queryset = super().get_queryset(request)

        return (
            queryset
            .select_related(
                "category",
                "brand",
            )
            .prefetch_related(
                "gallery",
                "price_tiers",
            )
        )

    @admin.display(description="تصویر")
    def image_thumbnail(self, obj):

        if not obj.image:
            return "بدون تصویر"

        try:

            return format_html(
                '<img src="{}" '
                'style="width:48px;height:48px;'
                'object-fit:contain;border-radius:8px;" />',
                obj.image.url,
            )

        except (ValueError, OSError):

            return "تصویر در دسترس نیست"

    @admin.display(description="پیش‌نمایش تصویر")
    def image_preview(self, obj):

        if not obj or not obj.image:
            return "تصویری ثبت نشده است"

        try:

            return format_html(
                '<img src="{}" '
                'style="max-width:200px;max-height:200px;'
                'object-fit:contain;border-radius:12px;" />',
                obj.image.url,
            )

        except (ValueError, OSError):

            return "تصویر در دسترس نیست"

    @admin.action(description="فعال‌سازی محصولات انتخاب‌شده")
    def activate_products(self, request, queryset):

        updated = queryset.update(
            is_active=True
        )

        self.message_user(
            request,
            f"{updated} محصول فعال شد."
        )

    @admin.action(description="غیرفعال‌سازی محصولات انتخاب‌شده")
    def deactivate_products(self, request, queryset):

        updated = queryset.update(
            is_active=False
        )

        self.message_user(
            request,
            f"{updated} محصول غیرفعال شد."
        )

    @admin.action(description="ویژه‌کردن محصولات انتخاب‌شده")
    def feature_products(self, request, queryset):

        updated = queryset.update(
            is_featured=True
        )

        self.message_user(
            request,
            f"{updated} محصول ویژه شد."
        )

    @admin.action(description="حذف وضعیت ویژه محصولات انتخاب‌شده")
    def unfeature_products(self, request, queryset):

        updated = queryset.update(
            is_featured=False
        )

        self.message_user(
            request,
            f"وضعیت ویژه {updated} محصول برداشته شد."
        )


# =========================================================
# PRODUCT IMAGE ADMIN
# =========================================================

@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):

    list_display = (
        "product",
        "image_preview",
        "alt_text",
        "sort_order",
        "is_primary",
        "created_at",
    )

    list_filter = (
        "is_primary",
        "created_at",
    )

    search_fields = (
        "product__name",
        "product__sku",
        "alt_text",
    )

    list_select_related = (
        "product",
    )

    ordering = (
        "product",
        "sort_order",
    )

    list_per_page = 50

    readonly_fields = (
        "created_at",
        "image_preview",
    )

    @admin.display(description="پیش‌نمایش")
    def image_preview(self, obj):

        if not obj or not obj.image:
            return "بدون تصویر"

        try:

            return format_html(
                '<img src="{}" '
                'style="width:90px;height:90px;'
                'object-fit:contain;border-radius:10px;" />',
                obj.image.url,
            )

        except (ValueError, OSError):

            return "تصویر در دسترس نیست"


# =========================================================
# PRODUCT PRICE TIER ADMIN
# =========================================================

@admin.register(ProductPriceTier)
class ProductPriceTierAdmin(admin.ModelAdmin):

    list_display = (
        "product",
        "minimum_quantity",
        "unit_price",
        "is_active",
        "created_at",
    )

    list_filter = (
        "is_active",
        "created_at",
    )

    search_fields = (
        "product__name",
        "product__sku",
    )

    list_select_related = (
        "product",
    )

    ordering = (
        "product",
        "minimum_quantity",
    )

    list_editable = (
        "is_active",
    )

    list_per_page = 50

    readonly_fields = (
        "created_at",
    )

    actions = (
        "activate_tiers",
        "deactivate_tiers",
    )

    @admin.action(description="فعال‌سازی قیمت‌های انتخاب‌شده")
    def activate_tiers(self, request, queryset):

        updated = queryset.update(
            is_active=True
        )

        self.message_user(
            request,
            f"{updated} قیمت پلکانی فعال شد."
        )

    @admin.action(description="غیرفعال‌سازی قیمت‌های انتخاب‌شده")
    def deactivate_tiers(self, request, queryset):

        updated = queryset.update(
            is_active=False
        )

        self.message_user(
            request,
            f"{updated} قیمت پلکانی غیرفعال شد."
        )
