
from django.contrib import admin

from .models import (
    CustomerProfile,
    CustomerAddress,
    PartnerApplication,
)


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "account_type",
        "partner_status",
        "is_verified",
        "created_at",
    )

    list_filter = (
        "account_type",
        "partner_status",
        "is_verified",
    )

    search_fields = (
        "user__username",
        "user__email",
        "business_name",
        "national_id",
    )

    readonly_fields = (
        "id",
        "created_at",
        "updated_at",
    )


@admin.register(CustomerAddress)
class CustomerAddressAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "customer",
        "recipient_name",
        "city",
        "province",
        "is_default",
    )

    list_filter = (
        "province",
        "city",
        "is_default",
    )

    search_fields = (
        "customer__username",
        "recipient_name",
        "recipient_phone",
        "postal_code",
    )


@admin.register(PartnerApplication)
class PartnerApplicationAdmin(admin.ModelAdmin):
    list_display = (
        "business_name",
        "owner_name",
        "phone",
        "city",
        "status",
        "created_at",
    )

    list_filter = (
        "status",
        "province",
        "created_at",
    )

    search_fields = (
        "business_name",
        "owner_name",
        "phone",
        "national_id",
    )

    readonly_fields = (
        "id",
        "created_at",
        "updated_at",
    )

    fieldsets = (
        ("اطلاعات متقاضی", {
            "fields": (
                "customer",
                "owner_name",
                "phone",
                "national_id",
            )
        }),
        ("اطلاعات کسب‌وکار", {
            "fields": (
                "business_name",
                "business_license_number",
                "province",
                "city",
                "business_address",
                "description",
            )
        }),
        ("بررسی درخواست", {
            "fields": (
                "status",
                "review_note",
                "reviewed_by",
                "reviewed_at",
            )
        }),
    )

    def save_model(self, request, obj, form, change):
        from django.utils import timezone

        if change and obj.status != PartnerApplication.Status.PENDING:
            obj.reviewed_by = request.user
            obj.reviewed_at = timezone.now()

        super().save_model(request, obj, form, change)

        profile, _ = CustomerProfile.objects.get_or_create(
            user=obj.customer
        )

        if obj.status == PartnerApplication.Status.APPROVED:
            profile.partner_status = CustomerProfile.PartnerStatus.APPROVED
            profile.account_type = CustomerProfile.AccountType.WHOLESALE

        elif obj.status == PartnerApplication.Status.REJECTED:
            profile.partner_status = CustomerProfile.PartnerStatus.REJECTED

        profile.save()
