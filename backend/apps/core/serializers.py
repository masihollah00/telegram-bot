
from rest_framework import serializers

from .models import StoreConfiguration


class StoreConfigurationSerializer(serializers.ModelSerializer):
    """
    Public representation of the store configuration.

    Private administrative information such as updated_by
    is intentionally excluded.
    """

    class Meta:
        model = StoreConfiguration

        fields = [
            "store_name",
            "slogan",
            "support_phone",
            "support_email",
            "address",
            "postal_code",
            "currency",
            "display_currency",
            "maintenance_mode",
            "maintenance_message",
            "announcement_enabled",
            "announcement_text",
            "announcement_link",
            "updated_at",
        ]

        read_only_fields = fields


class StoreConfigurationAdminSerializer(
    serializers.ModelSerializer
):
    """
    Administrative serializer.

    Permission checks must be enforced in the API view,
    not merely by using this serializer.
    """

    class Meta:
        model = StoreConfiguration

        fields = [
            "id",
            "store_name",
            "slogan",
            "support_phone",
            "support_email",
            "address",
            "postal_code",
            "currency",
            "display_currency",
            "maintenance_mode",
            "maintenance_message",
            "announcement_enabled",
            "announcement_text",
            "announcement_link",
            "updated_at",
            "updated_by",
        ]

        read_only_fields = [
            "id",
            "updated_at",
            "updated_by",
        ]
