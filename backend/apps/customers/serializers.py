
from rest_framework import serializers

from .models import (
    CustomerProfile,
    CustomerAddress,
    PartnerApplication,
)


class CustomerProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    class Meta:
        model = CustomerProfile
        fields = (
            "id",
            "username",
            "account_type",
            "partner_status",
            "business_name",
            "province",
            "city",
            "is_verified",
            "created_at",
        )
        read_only_fields = fields


class CustomerAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerAddress
        fields = (
            "id",
            "title",
            "recipient_name",
            "recipient_phone",
            "province",
            "city",
            "postal_code",
            "address",
            "is_default",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
        )

    def validate_recipient_phone(self, value):
        value = value.strip().replace(" ", "").replace("-", "")

        if not value.replace("+", "").isdigit():
            raise serializers.ValidationError("شماره تماس معتبر نیست.")

        if not 10 <= len(value) <= 15:
            raise serializers.ValidationError("طول شماره تماس معتبر نیست.")

        return value


class PartnerApplicationSerializer(serializers.ModelSerializer):
    national_id = serializers.CharField(
        write_only=True,
        max_length=20,
    )

    class Meta:
        model = PartnerApplication
        fields = (
            "id",
            "business_name",
            "owner_name",
            "phone",
            "national_id",
            "business_license_number",
            "province",
            "city",
            "business_address",
            "description",
            "status",
            "review_note",
            "reviewed_at",
            "created_at",
        )
        read_only_fields = (
            "id",
            "status",
            "review_note",
            "reviewed_at",
            "created_at",
        )

    def validate_phone(self, value):
        value = value.strip().replace(" ", "").replace("-", "")

        if not value.replace("+", "").isdigit():
            raise serializers.ValidationError("شماره تماس معتبر نیست.")

        if not 10 <= len(value) <= 15:
            raise serializers.ValidationError("شماره تماس معتبر نیست.")

        return value

    def validate_national_id(self, value):
        value = value.strip()

        if not value.isdigit():
            raise serializers.ValidationError("کد ملی باید فقط شامل عدد باشد.")

        if not 8 <= len(value) <= 12:
            raise serializers.ValidationError("کد ملی معتبر نیست.")

        return value

    def validate(self, attrs):
        request = self.context.get("request")

        if request and request.user.is_authenticated:
            has_pending = PartnerApplication.objects.filter(
                customer=request.user,
                status=PartnerApplication.Status.PENDING,
            ).exists()

            if has_pending and self.instance is None:
                raise serializers.ValidationError(
                    "شما یک درخواست همکاری در حال بررسی دارید."
                )

        return attrs

    def create(self, validated_data):
        request = self.context["request"]

        application = PartnerApplication.objects.create(
            customer=request.user,
            status=PartnerApplication.Status.PENDING,
            **validated_data,
        )

        profile, _ = CustomerProfile.objects.get_or_create(
            user=request.user,
        )

        profile.partner_status = CustomerProfile.PartnerStatus.PENDING
        profile.save(update_fields=["partner_status", "updated_at"])

        return application
