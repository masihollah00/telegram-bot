
import os

from rest_framework import serializers

from .models import (
    StoreConfiguration,
    SiteTheme,
    SiteAsset,
    SitePageSection,
    SiteNavigationLink,
)


class StoreConfigurationSerializer(serializers.ModelSerializer):
    """Public read-only representation of store information."""

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


class StoreConfigurationAdminSerializer(serializers.ModelSerializer):
    """Administrative store configuration serializer."""

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
        read_only_fields = ["id", "updated_at", "updated_by"]


class SiteThemeSerializer(serializers.ModelSerializer):
    """Public, read-only active theme representation."""

    class Meta:
        model = SiteTheme
        fields = [
            "id",
            "name",
            "colors",
            "typography",
            "layout",
            "motion",
            "assets",
            "custom_css_variables",
            "updated_at",
        ]
        read_only_fields = fields


class SiteThemeAdminSerializer(serializers.ModelSerializer):
    """Validated theme editor serializer for authenticated staff."""

    ALLOWED_COLOR_KEYS = {
        "primary",
        "secondary",
        "accent",
        "background",
        "surface",
        "surfaceElevated",
        "text",
        "muted",
        "border",
        "success",
        "warning",
        "danger",
    }

    ALLOWED_CSS_VARIABLES = {
        "--jalali-primary",
        "--jalali-secondary",
        "--jalali-accent",
        "--jalali-background",
        "--jalali-surface",
        "--jalali-text",
        "--jalali-muted",
        "--jalali-border",
        "--jalali-radius",
        "--jalali-container-width",
        "--jalali-section-gap",
    }

    def validate_colors(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError(
                "پالت رنگ باید یک شیء معتبر باشد."
            )

        unknown = set(value.keys()) - self.ALLOWED_COLOR_KEYS
        if unknown:
            raise serializers.ValidationError(
                "کلیدهای رنگ ناشناخته هستند: "
                + ", ".join(sorted(unknown))
            )

        for key, color in value.items():
            if not isinstance(color, str) or len(color) > 40:
                raise serializers.ValidationError(
                    f"مقدار رنگ {key} معتبر نیست."
                )

            normalized = color.strip().lower()
            if not (
                normalized.startswith("#")
                or normalized.startswith("rgb(")
                or normalized.startswith("rgba(")
                or normalized.startswith("hsl(")
                or normalized.startswith("hsla(")
            ):
                raise serializers.ValidationError(
                    f"فرمت رنگ {key} پشتیبانی نمی‌شود."
                )

        return value

    def validate_custom_css_variables(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError(
                "متغیرهای طراحی باید یک شیء معتبر باشند."
            )

        unknown = set(value.keys()) - self.ALLOWED_CSS_VARIABLES
        if unknown:
            raise serializers.ValidationError(
                "متغیرهای CSS غیرمجاز هستند: "
                + ", ".join(sorted(unknown))
            )

        for key, item in value.items():
            if not isinstance(item, (str, int, float)):
                raise serializers.ValidationError(
                    f"مقدار {key} باید متنی یا عددی باشد."
                )

            if len(str(item)) > 100:
                raise serializers.ValidationError(
                    f"مقدار {key} بیش از حد طولانی است."
                )

        return value

    def validate_assets(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError(
                "دارایی‌های تم باید یک شیء معتبر باشند."
            )

        for key, asset_id in value.items():
            if not isinstance(key, str) or len(key) > 80:
                raise serializers.ValidationError(
                    "شناسه جایگاه تصویر معتبر نیست."
                )

            if asset_id is not None and not isinstance(
                asset_id, (int, str)
            ):
                raise serializers.ValidationError(
                    f"شناسه دارایی {key} معتبر نیست."
                )

        return value

    class Meta:
        model = SiteTheme
        fields = [
            "id",
            "name",
            "is_active",
            "colors",
            "typography",
            "layout",
            "motion",
            "assets",
            "custom_css_variables",
            "updated_at",
            "updated_by",
        ]
        read_only_fields = ["id", "updated_at", "updated_by"]


class SiteAssetSerializer(serializers.ModelSerializer):
    """Public metadata for assets in the media library."""

    file_url = serializers.SerializerMethodField()

    class Meta:
        model = SiteAsset
        fields = [
            "id",
            "title",
            "asset_type",
            "file",
            "file_url",
            "alt_text",
            "description",
            "metadata",
            "is_active",
            "uploaded_at",
        ]
        read_only_fields = [
            "id",
            "file_url",
            "uploaded_at",
            "is_active",
        ]

    def get_file_url(self, obj):
        request = self.context.get("request")
        if not obj.file:
            return None

        url = obj.file.url
        return request.build_absolute_uri(url) if request else url


class SiteAssetAdminSerializer(serializers.ModelSerializer):
    """Admin upload serializer with extension and size restrictions."""

    file_url = serializers.SerializerMethodField(read_only=True)

    ALLOWED_EXTENSIONS = {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".avif",
        ".gif",
        ".pdf",
    }

    MAX_FILE_SIZE = 12 * 1024 * 1024

    class Meta:
        model = SiteAsset
        fields = [
            "id",
            "title",
            "asset_type",
            "file",
            "file_url",
            "alt_text",
            "description",
            "metadata",
            "is_active",
            "uploaded_at",
            "uploaded_by",
        ]
        read_only_fields = [
            "id",
            "file_url",
            "uploaded_at",
            "uploaded_by",
        ]

    def get_file_url(self, obj):
        request = self.context.get("request")
        if not obj.file:
            return None

        url = obj.file.url
        return request.build_absolute_uri(url) if request else url

    def validate_file(self, uploaded_file):
        extension = os.path.splitext(
            uploaded_file.name
        )[1].lower()

        if extension not in self.ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                "فرمت فایل مجاز نیست. "
                "فرمت‌های مجاز: JPG، PNG، WEBP، AVIF، GIF و PDF."
            )

        if uploaded_file.size > self.MAX_FILE_SIZE:
            raise serializers.ValidationError(
                "حجم فایل نباید بیشتر از ۱۲ مگابایت باشد."
            )

        return uploaded_file

    def validate_metadata(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError(
                "اطلاعات تکمیلی باید یک شیء معتبر باشد."
            )
        return value


class SitePageSectionSerializer(serializers.ModelSerializer):
    """Public representation of enabled page sections."""

    class Meta:
        model = SitePageSection
        fields = [
            "id",
            "page_key",
            "section_key",
            "section_type",
            "title",
            "content",
            "settings",
            "sort_order",
            "updated_at",
        ]
        read_only_fields = fields


class SitePageSectionAdminSerializer(serializers.ModelSerializer):
    """Administrative page builder serializer."""

    ALLOWED_SECTION_TYPES = {
        "hero",
        "banner",
        "text",
        "image",
        "gallery",
        "product_grid",
        "category_grid",
        "brand_grid",
        "features",
        "testimonials",
        "faq",
        "newsletter",
        "promotion",
        "spacer",
        "custom_content",
    }

    def validate_section_type(self, value):
        if value not in self.ALLOWED_SECTION_TYPES:
            raise serializers.ValidationError(
                "نوع این بخش در صفحه‌ساز پشتیبانی نمی‌شود."
            )
        return value

    def validate_content(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError(
                "محتوای بخش باید یک شیء معتبر باشد."
            )
        return value

    def validate_settings(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError(
                "تنظیمات بخش باید یک شیء معتبر باشد."
            )
        return value

    class Meta:
        model = SitePageSection
        fields = [
            "id",
            "page_key",
            "section_key",
            "section_type",
            "title",
            "content",
            "settings",
            "is_enabled",
            "sort_order",
            "updated_at",
            "updated_by",
        ]
        read_only_fields = ["id", "updated_at", "updated_by"]


class SiteNavigationLinkSerializer(serializers.ModelSerializer):
    """Public representation of enabled navigation links."""

    class Meta:
        model = SiteNavigationLink
        fields = [
            "id",
            "label",
            "url",
            "placement",
            "icon",
            "open_in_new_tab",
            "sort_order",
        ]
        read_only_fields = fields


class SiteNavigationLinkAdminSerializer(serializers.ModelSerializer):
    """Administrative navigation editor serializer."""

    def validate_url(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "آدرس لینک نمی‌تواند خالی باشد."
            )

        if value.startswith("//"):
            raise serializers.ValidationError(
                "آدرس نسبی پروتکل مجاز نیست."
            )

        if value.startswith("/"):
            return value

        if not (
            value.startswith("https://")
            or value.startswith("http://")
            or value.startswith("mailto:")
            or value.startswith("tel:")
        ):
            raise serializers.ValidationError(
                "لینک باید مسیر داخلی یا آدرس معتبر HTTP، HTTPS، "
                "ایمیل یا تلفن باشد."
            )

        return value

    class Meta:
        model = SiteNavigationLink
        fields = [
            "id",
            "label",
            "url",
            "placement",
            "icon",
            "open_in_new_tab",
            "is_enabled",
            "sort_order",
            "updated_at",
            "updated_by",
        ]
        read_only_fields = ["id", "updated_at", "updated_by"]
