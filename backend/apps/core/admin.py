
from django.contrib import admin
from django.utils.html import format_html

from .models import (
    StoreConfiguration,
    SiteTheme,
    SiteAsset,
    SitePageSection,
    SiteNavigationLink,
)


# =========================================================
# ADMIN SITE BRANDING
# =========================================================

admin.site.site_header = "JALALI COSMETICS"
admin.site.site_title = "مدیریت مرکزی پخش جلالی"
admin.site.index_title = "مرکز مدیریت فروشگاه"


# =========================================================
# STORE CONFIGURATION
# =========================================================

@admin.register(StoreConfiguration)
class StoreConfigurationAdmin(admin.ModelAdmin):

    list_display = (
        "store_name",
        "support_phone",
        "maintenance_status",
        "announcement_status",
        "updated_at",
        "updated_by",
    )

    readonly_fields = (
        "updated_at",
        "updated_by",
    )

    fieldsets = (
        (
            "هویت فروشگاه",
            {
                "fields": (
                    "store_name",
                    "slogan",
                )
            },
        ),
        (
            "اطلاعات تماس",
            {
                "fields": (
                    "support_phone",
                    "support_email",
                    "address",
                    "postal_code",
                )
            },
        ),
        (
            "تنظیمات مالی",
            {
                "fields": (
                    "currency",
                    "display_currency",
                )
            },
        ),
        (
            "وضعیت فروشگاه",
            {
                "fields": (
                    "maintenance_mode",
                    "maintenance_message",
                )
            },
        ),
        (
            "اطلاعیه عمومی",
            {
                "fields": (
                    "announcement_enabled",
                    "announcement_text",
                    "announcement_link",
                )
            },
        ),
        (
            "اطلاعات ویرایش",
            {
                "fields": (
                    "updated_at",
                    "updated_by",
                )
            },
        ),
    )

    def maintenance_status(self, obj):
        if obj.maintenance_mode:
            return format_html(
                '<span style="color:#c0392b;font-weight:bold;">فعال</span>'
            )

        return format_html(
            '<span style="color:#229954;font-weight:bold;">غیرفعال</span>'
        )

    maintenance_status.short_description = "حالت تعمیر"

    def announcement_status(self, obj):
        return "فعال" if obj.announcement_enabled else "غیرفعال"

    announcement_status.short_description = "اطلاعیه"

    def save_model(self, request, obj, form, change):
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


# =========================================================
# SITE THEME MANAGEMENT
# =========================================================

@admin.register(SiteTheme)
class SiteThemeAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "active_status",
        "updated_at",
        "updated_by",
    )

    list_filter = (
        "is_active",
        "updated_at",
    )

    search_fields = (
        "name",
    )

    readonly_fields = (
        "updated_at",
        "updated_by",
    )

    fieldsets = (
        (
            "مشخصات تم",
            {
                "fields": (
                    "name",
                    "is_active",
                )
            },
        ),
        (
            "رنگ‌بندی",
            {
                "fields": (
                    "colors",
                    "custom_css_variables",
                )
            },
        ),
        (
            "ظاهر و چیدمان",
            {
                "fields": (
                    "typography",
                    "layout",
                    "motion",
                )
            },
        ),
        (
            "تصاویر و دارایی‌ها",
            {
                "fields": (
                    "assets",
                )
            },
        ),
        (
            "اطلاعات ویرایش",
            {
                "fields": (
                    "updated_at",
                    "updated_by",
                )
            },
        ),
    )

    def active_status(self, obj):
        if obj.is_active:
            return format_html(
                '<strong style="color:#229954;">تم فعال</strong>'
            )

        return "غیرفعال"

    active_status.short_description = "وضعیت"

    def save_model(self, request, obj, form, change):
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


# =========================================================
# CENTRAL MEDIA LIBRARY
# =========================================================

@admin.register(SiteAsset)
class SiteAssetAdmin(admin.ModelAdmin):

    list_display = (
        "preview",
        "title",
        "asset_type",
        "file_size",
        "active_status",
        "uploaded_at",
        "uploaded_by",
    )

    list_filter = (
        "asset_type",
        "is_active",
        "uploaded_at",
    )

    search_fields = (
        "title",
        "alt_text",
        "description",
    )

    readonly_fields = (
        "preview",
        "file_size",
        "uploaded_at",
        "uploaded_by",
    )

    fieldsets = (
        (
            "مشخصات فایل",
            {
                "fields": (
                    "title",
                    "asset_type",
                    "file",
                    "preview",
                )
            },
        ),
        (
            "اطلاعات تصویر",
            {
                "fields": (
                    "alt_text",
                    "description",
                )
            },
        ),
        (
            "اطلاعات تکمیلی",
            {
                "fields": (
                    "metadata",
                )
            },
        ),
        (
            "وضعیت و مالکیت",
            {
                "fields": (
                    "is_active",
                    "file_size",
                    "uploaded_at",
                    "uploaded_by",
                )
            },
        ),
    )

    def preview(self, obj):
        if not obj.file:
            return "بدون فایل"

        try:
            url = obj.file.url
        except (ValueError, OSError):
            return "پیش‌نمایش در دسترس نیست"

        if obj.asset_type == SiteAsset.AssetType.DOCUMENT:
            return format_html(
                '<a href="{}" target="_blank" rel="noopener">'
                'مشاهده سند</a>',
                url,
            )

        return format_html(
            '<a href="{}" target="_blank" rel="noopener">'
            '<img src="{}" style="width:72px;height:58px;'
            'object-fit:cover;border-radius:8px;" />'
            '</a>',
            url,
            url,
        )

    preview.short_description = "پیش‌نمایش"

    def file_size(self, obj):
        if not obj.file:
            return "—"

        try:
            size = obj.file.size
        except (ValueError, OSError):
            return "نامشخص"

        if size >= 1024 * 1024:
            return f"{size / (1024 * 1024):.2f} مگابایت"

        return f"{size / 1024:.1f} کیلوبایت"

    file_size.short_description = "حجم فایل"

    def active_status(self, obj):
        return "فعال" if obj.is_active else "غیرفعال"

    active_status.short_description = "وضعیت"

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.uploaded_by = request.user

        super().save_model(request, obj, form, change)


# =========================================================
# PAGE BUILDER
# =========================================================

@admin.register(SitePageSection)
class SitePageSectionAdmin(admin.ModelAdmin):

    list_display = (
        "page_key",
        "section_key",
        "section_type",
        "title",
        "enabled_status",
        "sort_order",
        "updated_at",
    )

    list_filter = (
        "page_key",
        "section_type",
        "is_enabled",
    )

    search_fields = (
        "page_key",
        "section_key",
        "title",
    )

    list_editable = (
        "sort_order",
    )

    readonly_fields = (
        "updated_at",
        "updated_by",
    )

    ordering = (
        "page_key",
        "sort_order",
    )

    fieldsets = (
        (
            "شناسه و نوع بخش",
            {
                "fields": (
                    "page_key",
                    "section_key",
                    "section_type",
                    "title",
                )
            },
        ),
        (
            "محتوا",
            {
                "fields": (
                    "content",
                )
            },
        ),
        (
            "تنظیمات نمایش",
            {
                "fields": (
                    "settings",
                    "is_enabled",
                    "sort_order",
                )
            },
        ),
        (
            "اطلاعات ویرایش",
            {
                "fields": (
                    "updated_at",
                    "updated_by",
                )
            },
        ),
    )

    def enabled_status(self, obj):
        return "نمایش داده می‌شود" if obj.is_enabled else "مخفی"

    enabled_status.short_description = "وضعیت نمایش"

    def save_model(self, request, obj, form, change):
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


# =========================================================
# NAVIGATION MANAGEMENT
# =========================================================

@admin.register(SiteNavigationLink)
class SiteNavigationLinkAdmin(admin.ModelAdmin):

    list_display = (
        "label",
        "placement",
        "url",
        "enabled_status",
        "sort_order",
        "updated_at",
    )

    list_filter = (
        "placement",
        "is_enabled",
    )

    search_fields = (
        "label",
        "url",
    )

    list_editable = (
        "sort_order",
    )

    readonly_fields = (
        "updated_at",
        "updated_by",
    )

    ordering = (
        "placement",
        "sort_order",
    )

    fieldsets = (
        (
            "مشخصات لینک",
            {
                "fields": (
                    "label",
                    "url",
                    "placement",
                    "icon",
                )
            },
        ),
        (
            "نحوه نمایش",
            {
                "fields": (
                    "open_in_new_tab",
                    "is_enabled",
                    "sort_order",
                )
            },
        ),
        (
            "اطلاعات ویرایش",
            {
                "fields": (
                    "updated_at",
                    "updated_by",
                )
            },
        ),
    )

    def enabled_status(self, obj):
        return "فعال" if obj.is_enabled else "غیرفعال"

    enabled_status.short_description = "وضعیت"

    def save_model(self, request, obj, form, change):
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)
