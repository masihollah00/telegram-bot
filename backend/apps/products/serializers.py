
from django.db import transaction
from rest_framework import serializers

from .models import (
    Product,
    ProductCategory,
    ProductBrand,
    ProductImage,
    ProductPriceTier,
)


# =========================================================
# CATEGORY SERIALIZER
# =========================================================

class ProductCategorySerializer(serializers.ModelSerializer):

    product_count = serializers.SerializerMethodField()

    class Meta:
        model = ProductCategory

        fields = (
            "id",
            "name",
            "slug",
            "description",
            "image",
            "product_count",
        )

    def get_product_count(self, obj):

        annotated_count = getattr(
            obj,
            "active_product_count",
            None,
        )

        if annotated_count is not None:
            return annotated_count

        return obj.products.filter(
            is_active=True,
            stock_quantity__gt=0,
        ).count()


# =========================================================
# BRAND SERIALIZER
# =========================================================

class ProductBrandSerializer(serializers.ModelSerializer):

    class Meta:
        model = ProductBrand

        fields = (
            "id",
            "name",
            "slug",
            "description",
            "logo",
            "website",
        )


# =========================================================
# PRODUCT IMAGE SERIALIZER
# =========================================================

class ProductImageSerializer(serializers.ModelSerializer):

    class Meta:
        model = ProductImage

        fields = (
            "id",
            "image",
            "alt_text",
            "sort_order",
            "is_primary",
        )

        read_only_fields = fields


# =========================================================
# PUBLIC PRICE TIER SERIALIZER
# =========================================================

class ProductPriceTierPublicSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = ProductPriceTier

        fields = (
            "minimum_quantity",
            "unit_price",
        )

        read_only_fields = fields


# =========================================================
# PUBLIC PRODUCT SERIALIZER
# =========================================================

class ProductPublicSerializer(serializers.ModelSerializer):

    category = ProductCategorySerializer(
        read_only=True,
    )

    brand = ProductBrandSerializer(
        read_only=True,
    )

    gallery = ProductImageSerializer(
        many=True,
        read_only=True,
    )

    price_tiers = serializers.SerializerMethodField()

    availability = serializers.CharField(
        read_only=True,
    )

    class Meta:
        model = Product

        fields = (
            "id",
            "name",
            "slug",
            "sku",
            "short_description",
            "description",
            "image",
            "gallery",
            "category",
            "brand",
            "public_price",
            "availability",
            "minimum_order_quantity",
            "units_per_carton",
            "weight_grams",
            "is_featured",
            "price_tiers",
            "seo_title",
            "seo_description",
            "created_at",
            "updated_at",
        )

        read_only_fields = fields

    def get_price_tiers(self, obj):

        tiers = obj.price_tiers.filter(
            is_active=True,
        ).order_by(
            "minimum_quantity",
        )

        return ProductPriceTierPublicSerializer(
            tiers,
            many=True,
            context=self.context,
        ).data


# =========================================================
# ADMIN PRODUCT SERIALIZER
# =========================================================

class ProductAdminSerializer(serializers.ModelSerializer):

    gallery = ProductImageSerializer(
        many=True,
        read_only=True,
    )

    price_tiers = serializers.SerializerMethodField()

    class Meta:
        model = Product

        fields = "__all__"

        read_only_fields = (
            "id",
            "availability",
            "created_at",
            "updated_at",
        )

    def get_price_tiers(self, obj):

        tiers = obj.price_tiers.all().order_by(
            "minimum_quantity",
        )

        return ProductPriceTierAdminSerializer(
            tiers,
            many=True,
            context=self.context,
        ).data

    def validate_sku(self, value):

        value = value.strip().upper()

        queryset = Product.objects.filter(
            sku=value,
        )

        if self.instance:
            queryset = queryset.exclude(
                pk=self.instance.pk,
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "این کد محصول قبلاً ثبت شده است."
            )

        return value

    def validate_barcode(self, value):

        return value.strip()

    def validate_name(self, value):

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "نام محصول الزامی است."
            )

        return value

    def validate_slug(self, value):

        value = value.strip()

        queryset = Product.objects.filter(
            slug=value,
        )

        if self.instance:
            queryset = queryset.exclude(
                pk=self.instance.pk,
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "این شناسه آدرس قبلاً استفاده شده است."
            )

        return value

    def validate_stock_quantity(self, value):

        if value < 0:
            raise serializers.ValidationError(
                "موجودی نمی‌تواند منفی باشد."
            )

        return value

    def validate_minimum_order_quantity(self, value):

        if value < 1:
            raise serializers.ValidationError(
                "حداقل تعداد سفارش باید حداقل یک باشد."
            )

        return value

    def validate_units_per_carton(self, value):

        if value < 1:
            raise serializers.ValidationError(
                "تعداد در هر کارتن باید حداقل یک باشد."
            )

        return value

    def validate(self, attrs):

        public_price = attrs.get(
            "public_price",
            getattr(
                self.instance,
                "public_price",
                0,
            ),
        )

        cost_price = attrs.get(
            "cost_price",
            getattr(
                self.instance,
                "cost_price",
                0,
            ),
        )

        if public_price < 0 or cost_price < 0:
            raise serializers.ValidationError(
                "قیمت‌ها نمی‌توانند منفی باشند."
            )

        return attrs


# =========================================================
# ADMIN PRODUCT IMAGE SERIALIZER
# =========================================================

class ProductImageAdminSerializer(serializers.ModelSerializer):

    class Meta:
        model = ProductImage

        fields = "__all__"

        read_only_fields = (
            "id",
            "created_at",
        )


# =========================================================
# ADMIN PRICE TIER SERIALIZER
# =========================================================

class ProductPriceTierAdminSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = ProductPriceTier

        fields = "__all__"

        read_only_fields = (
            "id",
            "created_at",
        )

    def validate(self, attrs):

        product = attrs.get(
            "product",
            getattr(
                self.instance,
                "product",
                None,
            ),
        )

        minimum_quantity = attrs.get(
            "minimum_quantity",
            getattr(
                self.instance,
                "minimum_quantity",
                None,
            ),
        )

        if product and minimum_quantity:

            queryset = ProductPriceTier.objects.filter(
                product=product,
                minimum_quantity=minimum_quantity,
            )

            if self.instance:
                queryset = queryset.exclude(
                    pk=self.instance.pk,
                )

            if queryset.exists():
                raise serializers.ValidationError(
                    "برای این تعداد، قیمت پلکانی دیگری ثبت شده است."
                )

        return attrs


# =========================================================
# QUICK ORDER ITEM SERIALIZER
# =========================================================

class ProductQuickOrderItemSerializer(serializers.Serializer):

    sku = serializers.CharField(
        max_length=80,
    )

    quantity = serializers.IntegerField(
        min_value=1,
    )

    def validate_sku(self, value):

        return value.strip().upper()


# =========================================================
# QUICK ORDER SERIALIZER
# =========================================================

class ProductQuickOrderSerializer(serializers.Serializer):

    items = ProductQuickOrderItemSerializer(
        many=True,
        allow_empty=False,
    )

    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=2000,
    )

    def validate_items(self, items):

        skus = [
            item["sku"]
            for item in items
        ]

        if len(skus) != len(set(skus)):
            raise serializers.ValidationError(
                "کد محصول تکراری در سفارش وجود دارد."
            )

        products = {
            product.sku: product
            for product in Product.objects.filter(
                sku__in=skus,
                is_active=True,
            )
        }

        errors = []

        for item in items:

            product = products.get(
                item["sku"],
            )

            if not product:

                errors.append(
                    f"محصول با کد {item['sku']} یافت نشد."
                )

                continue

            if item["quantity"] < product.minimum_order_quantity:

                errors.append(
                    f"حداقل سفارش {product.name} برابر "
                    f"{product.minimum_order_quantity} عدد است."
                )

                continue

            if item["quantity"] > product.stock_quantity:

                errors.append(
                    f"موجودی کافی برای {product.name} وجود ندارد."
                )

        if errors:
            raise serializers.ValidationError(errors)

        return items


# =========================================================
# QUICK ORDER PROCESSING
# =========================================================

class ProductQuickOrderProcessor:

    @staticmethod
    @transaction.atomic
    def validate_and_lock(items):

        skus = [
            item["sku"]
            for item in items
        ]

        products = {
            product.sku: product
            for product in Product.objects
            .select_for_update()
            .filter(
                sku__in=skus,
                is_active=True,
            )
        }

        validated_items = []
        errors = []

        for item in items:

            product = products.get(
                item["sku"],
            )

            if not product:

                errors.append(
                    f"محصول {item['sku']} پیدا نشد."
                )

                continue

            quantity = item["quantity"]

            if quantity < product.minimum_order_quantity:

                errors.append(
                    f"حداقل سفارش {product.name} "
                    f"{product.minimum_order_quantity} عدد است."
                )

                continue

            if quantity > product.stock_quantity:

                errors.append(
                    f"موجودی کافی برای {product.name} وجود ندارد."
                )

                continue

            validated_items.append({
                "product": product,
                "quantity": quantity,
                "unit_price": product.public_price,
            })

        if errors:
            raise serializers.ValidationError(errors)

        return validated_items
