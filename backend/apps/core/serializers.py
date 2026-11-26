
import json
import math
import os
import re
import warnings

from urllib.parse import urlsplit

from PIL import Image, UnidentifiedImageError

from rest_framework import serializers

from .models import (
    StoreConfiguration,
    SiteTheme,
    SiteAsset,
    SitePageSection,
    SiteNavigationLink,
)


# =========================================================
# SHARED VALIDATION HELPERS
# =========================================================

HEX_COLOR_RE = re.compile(
    r"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|"
    r"[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$"
)

RGB_COLOR_RE = re.compile(
    r"^rgba?\(\s*"
    r"(?:\d{1,3}%?\s*,\s*){2}"
    r"\d{1,3}%?"
    r"(?:\s*,\s*(?:0|1|0?\.\d+|100%))?"
    r"\s*\)$",
    re.IGNORECASE,
)

HSL_COLOR_RE = re.compile(
    r"^hsla?\(\s*"
    r"-?\d+(?:\.\d+)?(?:deg|rad|turn)?\s*,\s*"
    r"\d{1,3}%\s*,\s*\d{1,3}%"
    r"(?:\s*,\s*(?:0|1|0?\.\d+))?"
    r"\s*\)$",
    re.IGNORECASE,
)

SAFE_CSS_LENGTH_RE = re.compile(
    r"^(?:0|"
    r"\d+(?:\.\d+)?(?:px|rem|em|vw|vh|%)"
    r")$",
    re.IGNORECASE,
)

SAFE_CSS_NUMBER_RE = re.compile(
    r"^\d+(?:\.\d+)?$"
)

SAFE_SLUG_RE = re.compile(
    r"^[a-zA-Z0-9_-]+$"
)


def validate_json_object(
    value,
    label,
    max_bytes=32768,
    max_depth=8,
    max_items=500,
):
    """
    Validate JSON data size, nesting and value types.
    """

    if not isinstance(value, dict):
        raise serializers.ValidationError(
            f"{label} باید یک شیء معتبر باشد."
        )

    try:
        encoded = json.dumps(
            value,
            ensure_ascii=False,
            allow_nan=False,
        ).encode("utf-8")

    except (TypeError, ValueError):
        raise serializers.ValidationError(
            f"{label} شامل داده نامعتبر است."
        )

    if len(encoded) > max_bytes:
        raise serializers.ValidationError(
            f"حجم {label} بیش از حد مجاز است."
        )

    item_count = 0

    def inspect(node, depth=0):

        nonlocal item_count

        if depth > max_depth:
            raise serializers.ValidationError(
                f"ساختار {label} بیش از حد تو در تو است."
            )

        item_count += 1

        if item_count > max_items:
            raise serializers.ValidationError(
                f"تعداد داده‌های {label} بیش از حد مجاز است."
            )

        if isinstance(node, dict):

            for key, child in node.items():

                if not isinstance(key, str) or len(key) > 120:
                    raise serializers.ValidationError(
                        f"کلید نامعتبر در {label} وجود دارد."
                    )

                inspect(child, depth + 1)

        elif isinstance(node, list):

            for child in node:
                inspect(child, depth + 1)

        elif isinstance(node, str):

            if len(node) > 5000:
                raise serializers.ValidationError(
                    f"یکی از مقادیر متنی {label} بیش از حد طولانی است."
                )

        elif isinstance(node, float):

            if not math.isfinite(node):
                raise serializers.ValidationError(
                    f"مقدار عددی نامعتبر در {label} وجود دارد."
                )

        elif node is None or isinstance(node, (bool, int)):
            pass

        else:
            raise serializers.ValidationError(
                f"نوع داده نامعتبر در {label} وجود دارد."
            )

    inspect(value)

    return value


def validate_safe_color(value, label="رنگ"):

    if not isinstance(value, str):
        raise serializers.ValidationError(
            f"{label} باید متنی باشد."
        )

    normalized = value.strip()

    if len(normalized) > 40:
        raise serializers.ValidationError(
            f"{label} بیش از حد طولانی است."
        )

    if not (
        HEX_COLOR_RE.fullmatch(normalized)
        or RGB_COLOR_RE.fullmatch(normalized)
        or HSL_COLOR_RE.fullmatch(normalized)
    ):
        raise serializers.ValidationError(
            f"فرمت {label} معتبر نیست."
        )

    return normalized


# =========================================================
# STORE CONFIGURATION
# =========================================================

class StoreConfigurationSerializer(serializers.ModelSerializer):

    class Meta:
        model = StoreConfiguration
        fields = [
            "store_name",
            "slogan",
            "support_phone",
            "support_email",
            "seller_phone",
            "seller_telegram",
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

    class Meta:
        model = StoreConfiguration
        fields = [
            "id",
            "store_name",
            "slogan",
            "support_phone",
            "support_email",
            "seller_phone",
            "seller_telegram",
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

    def validate_store_name(self, value):

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "نام فروشگاه نمی‌تواند خالی باشد."
            )

        return value

    def validate_slogan(self, value):
        return value.strip()

    def validate_seller_phone(self, value):

        value = value.strip()

        if not re.fullmatch(r"[0-9+\-\s()]{7,20}", value):
            raise serializers.ValidationError(
                "شماره تماس فروشنده معتبر نیست."
            )

        return value

    def validate_seller_telegram(self, value):

        value = value.strip()

        if value.startswith("@"):
            username = value[1:]
        elif "t.me/" in value:
            username = value.rstrip("/").split("t.me/")[-1]
        else:
            username = value

        if not re.fullmatch(r"[A-Za-z0-9_]{5,32}", username):
            raise serializers.ValidationError(
                "آیدی تلگرام فروشنده معتبر نیست."
            )

        return "@" + username

    def validate_currency(self, value):

        value = value.strip().upper()

        if not re.fullmatch(r"[A-Z]{3,10}", value):
            raise serializers.ValidationError(
                "کد واحد پول معتبر نیست."
            )

        return value

    def validate_announcement_link(self, value):

        value = value.strip()

        if not value:
            return value

        if value.startswith("/") and not value.startswith("//"):
            return value

        parsed = urlsplit(value)

        if (
            parsed.scheme not in ("http", "https")
            or not parsed.netloc
            or parsed.username
            or parsed.password
        ):
            raise serializers.ValidationError(
                "لینک اطلاعیه باید یک آدرس معتبر HTTP یا HTTPS باشد."
            )

        return value


# =========================================================
# SITE THEME — PUBLIC
# =========================================================

class SiteThemeSerializer(serializers.ModelSerializer):

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


# =========================================================
# SITE THEME — ADMIN
# =========================================================

class SiteThemeAdminSerializer(serializers.ModelSerializer):

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

    COLOR_CSS_VARIABLES = {
        "--jalali-primary",
        "--jalali-secondary",
        "--jalali-accent",
        "--jalali-background",
        "--jalali-surface",
        "--jalali-text",
        "--jalali-muted",
        "--jalali-border",
    }

    LENGTH_CSS_VARIABLES = {
        "--jalali-radius",
        "--jalali-container-width",
        "--jalali-section-gap",
    }

    def validate_colors(self, value):

        validate_json_object(
            value,
            "پالت رنگ",
            max_bytes=4096,
            max_depth=2,
            max_items=30,
        )

        unknown = set(value.keys()) - self.ALLOWED_COLOR_KEYS

        if unknown:
            raise serializers.ValidationError(
                "کلیدهای رنگ ناشناخته هستند: "
                + ", ".join(sorted(unknown))
            )

        for key, color in value.items():
            value[key] = validate_safe_color(
                color,
                f"رنگ {key}",
            )

        return value

    def validate_custom_css_variables(self, value):

        validate_json_object(
            value,
            "متغیرهای CSS",
            max_bytes=4096,
            max_depth=2,
            max_items=30,
        )

        unknown = (
            set(value.keys())
            - self.ALLOWED_CSS_VARIABLES
        )

        if unknown:
            raise serializers.ValidationError(
                "متغیرهای CSS غیرمجاز هستند: "
                + ", ".join(sorted(unknown))
            )

        cleaned = {}

        for key, item in value.items():

            if not isinstance(item, (str, int, float)):
                raise serializers.ValidationError(
                    f"مقدار {key} معتبر نیست."
                )

            if isinstance(item, bool):
                raise serializers.ValidationError(
                    f"مقدار {key} نمی‌تواند بولی باشد."
                )

            text_value = str(item).strip()

            if not text_value or len(text_value) > 40:
                raise serializers.ValidationError(
                    f"مقدار {key} معتبر نیست."
                )

            if key in self.COLOR_CSS_VARIABLES:

                cleaned[key] = validate_safe_color(
                    text_value,
                    key,
                )

            elif key in self.LENGTH_CSS_VARIABLES:

                if not (
                    SAFE_CSS_LENGTH_RE.fullmatch(text_value)
                ):
                    raise serializers.ValidationError(
                        f"مقدار اندازه‌ای {key} معتبر نیست."
                    )

                cleaned[key] = text_value

        return cleaned

    def validate_assets(self, value):

        validate_json_object(
            value,
            "دارایی‌های تم",
            max_bytes=8192,
            max_depth=3,
            max_items=60,
        )

        normalized = {}

        for key, asset_id in value.items():

            if not isinstance(key, str):
                raise serializers.ValidationError(
                    "شناسه جایگاه تصویر معتبر نیست."
                )

            if not SAFE_SLUG_RE.fullmatch(key):
                raise serializers.ValidationError(
                    "شناسه جایگاه تصویر فقط می‌تواند شامل "
                    "حروف انگلیسی، عدد، خط تیره و زیرخط باشد."
                )

            if asset_id is None:
                normalized[key] = None
                continue

            try:
                numeric_id = int(asset_id)
            except (TypeError, ValueError):
                raise serializers.ValidationError(
                    f"شناسه تصویر {key} باید عدد معتبر باشد."
                )

            if numeric_id <= 0:
                raise serializers.ValidationError(
                    f"شناسه تصویر {key} معتبر نیست."
                )

            normalized[key] = numeric_id

        ids = [
            item
            for item in normalized.values()
            if item is not None
        ]

        if ids:

            existing = set(
                SiteAsset.objects.filter(
                    pk__in=ids,
                    is_active=True,
                    asset_type__in=[
                        SiteAsset.AssetType.IMAGE,
                        SiteAsset.AssetType.BANNER,
                        SiteAsset.AssetType.LOGO,
                    ],
                ).values_list("pk", flat=True)
            )

            missing = set(ids) - existing

            if missing:
                raise serializers.ValidationError(
                    "برخی تصاویر انتخاب‌شده وجود ندارند، "
                    "غیرفعال هستند یا نوع مجاز ندارند."
                )

        return normalized

    def validate_typography(self, value):

        return validate_json_object(
            value,
            "تنظیمات تایپوگرافی",
            max_bytes=8192,
            max_depth=5,
            max_items=100,
        )

    def validate_layout(self, value):

        return validate_json_object(
            value,
            "تنظیمات چیدمان",
            max_bytes=8192,
            max_depth=5,
            max_items=100,
        )

    def validate_motion(self, value):

        return validate_json_object(
            value,
            "تنظیمات حرکت",
            max_bytes=8192,
            max_depth=5,
            max_items=100,
        )

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
        read_only_fields = [
            "id",
            "updated_at",
            "updated_by",
        ]

    def validate_name(self, value):

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "نام تم نمی‌تواند خالی باشد."
            )

        return value


# =========================================================
# PUBLIC MEDIA SERIALIZER
# =========================================================

class SiteAssetSerializer(serializers.ModelSerializer):

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

        try:
            url = obj.file.url
        except (ValueError, OSError):
            return None

        return (
            request.build_absolute_uri(url)
            if request
            else url
        )


# =========================================================
# CENTRAL MEDIA LIBRARY — ADMIN
# =========================================================

class SiteAssetAdminSerializer(serializers.ModelSerializer):

    file_url = serializers.SerializerMethodField(
        read_only=True,
    )

    ALLOWED_IMAGE_EXTENSIONS = {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".gif",
    }

    MAX_FILE_SIZE = 12 * 1024 * 1024

    MAX_IMAGE_PIXELS = 40_000_000

    IMAGE_FORMATS = {
        ".jpg": "JPEG",
        ".jpeg": "JPEG",
        ".png": "PNG",
        ".webp": "WEBP",
        ".gif": "GIF",
    }

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

        try:
            url = obj.file.url
        except (ValueError, OSError):
            return None

        return (
            request.build_absolute_uri(url)
            if request
            else url
        )

    def validate_title(self, value):

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "عنوان فایل الزامی است."
            )

        return value

    def validate_file(self, uploaded_file):

        extension = os.path.splitext(
            uploaded_file.name
        )[1].lower()

        allowed = (
            self.ALLOWED_IMAGE_EXTENSIONS
            | {".pdf"}
        )

        if extension not in allowed:
            raise serializers.ValidationError(
                "فرمت مجاز: JPG، PNG، WEBP، GIF و PDF."
            )

        if uploaded_file.size <= 0:
            raise serializers.ValidationError(
                "فایل انتخاب‌شده خالی است."
            )

        if uploaded_file.size > self.MAX_FILE_SIZE:
            raise serializers.ValidationError(
                "حجم فایل نباید بیشتر از ۱۲ مگابایت باشد."
            )

        return uploaded_file

    def validate_metadata(self, value):

        return validate_json_object(
            value,
            "اطلاعات تکمیلی فایل",
            max_bytes=8192,
            max_depth=5,
            max_items=100,
        )

    def validate(self, attrs):

        uploaded_file = attrs.get("file")

        asset_type = attrs.get(
            "asset_type",
            getattr(self.instance, "asset_type", None),
        )

        if not uploaded_file:
            return attrs

        extension = os.path.splitext(
            uploaded_file.name
        )[1].lower()

        is_document = (
            asset_type == SiteAsset.AssetType.DOCUMENT
        )

        if is_document:

            if extension != ".pdf":
                raise serializers.ValidationError({
                    "file": "برای سند فقط فایل PDF مجاز است."
                })

            uploaded_file.seek(0)
            signature = uploaded_file.read(5)
            uploaded_file.seek(0)

            if signature != b"%PDF-":
                raise serializers.ValidationError({
                    "file": "محتوای فایل PDF معتبر نیست."
                })

            return attrs

        if extension == ".pdf":
            raise serializers.ValidationError({
                "file": (
                    "فایل PDF نمی‌تواند به‌عنوان تصویر "
                    "ثبت شود."
                )
            })

        expected_format = self.IMAGE_FORMATS.get(
            extension,
        )

        if not expected_format:
            raise serializers.ValidationError({
                "file": "فرمت تصویر پشتیبانی نمی‌شود."
            })

        try:

            uploaded_file.seek(0)

            with warnings.catch_warnings():

                warnings.simplefilter(
                    "error",
                    Image.DecompressionBombWarning,
                )

                image = Image.open(uploaded_file)

                detected_format = image.format

                width, height = image.size

                if width <= 0 or height <= 0:
                    raise serializers.ValidationError({
                        "file": "ابعاد تصویر معتبر نیست."
                    })

                if (
                    width * height
                    > self.MAX_IMAGE_PIXELS
                ):
                    raise serializers.ValidationError({
                        "file": "ابعاد تصویر بیش از حد مجاز است."
                    })

                if detected_format != expected_format:
                    raise serializers.ValidationError({
                        "file": (
                            "محتوای تصویر با پسوند فایل "
                            "هماهنگ نیست."
                        )
                    })

                image.verify()

        except serializers.ValidationError:
            raise

        except (
            UnidentifiedImageError,
            Image.DecompressionBombError,
            Image.DecompressionBombWarning,
            OSError,
            ValueError,
        ):
            raise serializers.ValidationError({
                "file": (
                    "تصویر معتبر نیست یا قابل پردازش نیست."
                )
            })

        finally:
            uploaded_file.seek(0)

        return attrs


# =========================================================
# PAGE BUILDER — PUBLIC
# =========================================================

class SitePageSectionSerializer(serializers.ModelSerializer):

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


# =========================================================
# PAGE BUILDER — ADMIN
# =========================================================

class SitePageSectionAdminSerializer(serializers.ModelSerializer):

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

    def validate_page_key(self, value):

        value = value.strip()

        if not SAFE_SLUG_RE.fullmatch(value):
            raise serializers.ValidationError(
                "شناسه صفحه معتبر نیست."
            )

        return value

    def validate_section_key(self, value):

        value = value.strip()

        if not SAFE_SLUG_RE.fullmatch(value):
            raise serializers.ValidationError(
                "شناسه بخش معتبر نیست."
            )

        return value

    def validate_section_type(self, value):

        if value not in self.ALLOWED_SECTION_TYPES:
            raise serializers.ValidationError(
                "نوع این بخش در صفحه‌ساز پشتیبانی نمی‌شود."
            )

        return value

    def validate_content(self, value):

        return validate_json_object(
            value,
            "محتوای بخش",
            max_bytes=32768,
            max_depth=8,
            max_items=500,
        )

    def validate_settings(self, value):

        return validate_json_object(
            value,
            "تنظیمات بخش",
            max_bytes=16384,
            max_depth=6,
            max_items=250,
        )

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
        read_only_fields = [
            "id",
            "updated_at",
            "updated_by",
        ]


# =========================================================
# NAVIGATION — PUBLIC
# =========================================================

class SiteNavigationLinkSerializer(serializers.ModelSerializer):

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


# =========================================================
# NAVIGATION — ADMIN
# =========================================================

class SiteNavigationLinkAdminSerializer(serializers.ModelSerializer):

    def validate_label(self, value):

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "عنوان لینک الزامی است."
            )

        return value

    def validate_url(self, value):

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "آدرس لینک نمی‌تواند خالی باشد."
            )

        if any(ord(char) < 32 for char in value):
            raise serializers.ValidationError(
                "آدرس لینک دارای نویسه غیرمجاز است."
            )

        if value.startswith("/"):

            if value.startswith("//"):
                raise serializers.ValidationError(
                    "آدرس نسبی پروتکل مجاز نیست."
                )

            return value

        parsed = urlsplit(value)

        if parsed.scheme in ("http", "https"):

            if (
                not parsed.netloc
                or parsed.username
                or parsed.password
            ):
                raise serializers.ValidationError(
                    "آدرس وب معتبر نیست."
                )

            return value

        if parsed.scheme == "mailto":

            if not parsed.path or "@" not in parsed.path:
                raise serializers.ValidationError(
                    "آدرس ایمیل معتبر نیست."
                )

            return value

        if parsed.scheme == "tel":

            if not re.fullmatch(
                r"\+?[0-9()\-\s]{5,25}",
                parsed.path,
            ):
                raise serializers.ValidationError(
                    "شماره تلفن لینک معتبر نیست."
                )

            return value

        raise serializers.ValidationError(
            "لینک باید مسیر داخلی یا آدرس معتبر "
            "HTTP، HTTPS، ایمیل یا تلفن باشد."
        )

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
        read_only_fields = [
            "id",
            "updated_at",
            "updated_by",
        ]
