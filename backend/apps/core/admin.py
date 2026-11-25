
from django.contrib import admin
from django.utils.html import format_html

from .models import StoreConfiguration


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
        if obj.announcement_enabled:
            return "فعال"

        return "غیرفعال"

    announcement_status.short_description = "اطلاعیه"

    def save_model(self, request, obj, form, change):
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)
