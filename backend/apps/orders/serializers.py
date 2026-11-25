
from django.db import transaction
from rest_framework import serializers

from apps.products.models import Product
from .models import Order, OrderItem, OrderStatusHistory


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = (
            "id",
            "product",
            "product_name",
            "product_sku",
            "quantity",
            "unit_price",
            "discount_amount",
            "line_total",
            "created_at",
        )
        read_only_fields = fields


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = OrderStatusHistory
        fields = (
            "id",
            "old_status",
            "new_status",
            "description",
            "changed_by_name",
            "created_at",
        )

    def get_changed_by_name(self, obj):
        if not obj.changed_by:
            return None
        return (
            obj.changed_by.get_full_name()
            or obj.changed_by.get_username()
        )


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Order
        fields = (
            "id",
            "order_number",
            "status",
            "payment_status",
            "subtotal",
            "discount_amount",
            "shipping_amount",
            "tax_amount",
            "total_amount",
            "currency",
            "customer_name",
            "customer_phone",
            "customer_email",
            "province",
            "city",
            "postal_code",
            "shipping_address",
            "customer_note",
            "tracking_code",
            "placed_at",
            "confirmed_at",
            "shipped_at",
            "delivered_at",
            "created_at",
            "updated_at",
            "items",
            "status_history",
        )
        read_only_fields = fields


class OrderCreateItemSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)


class OrderCreateSerializer(serializers.Serializer):
    customer_name = serializers.CharField(max_length=160)
    customer_phone = serializers.CharField(max_length=20)

    customer_email = serializers.EmailField(
        required=False,
        allow_blank=True,
    )

    province = serializers.CharField(max_length=100)
    city = serializers.CharField(max_length=100)
    postal_code = serializers.CharField(max_length=20)
    shipping_address = serializers.CharField()

    customer_note = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=3000,
    )

    items = OrderCreateItemSerializer(
        many=True,
        allow_empty=False,
    )

    def validate_customer_phone(self, value):
        normalized = (
            value.strip()
            .replace(" ", "")
            .replace("-", "")
        )

        if not normalized.replace("+", "").isdigit():
            raise serializers.ValidationError(
                "شماره تماس معتبر نیست."
            )

        if not 10 <= len(normalized) <= 15:
            raise serializers.ValidationError(
                "طول شماره تماس معتبر نیست."
            )

        return normalized

    def validate(self, attrs):
        product_ids = [
            item["product_id"]
            for item in attrs["items"]
        ]

        if len(product_ids) != len(set(product_ids)):
            raise serializers.ValidationError({
                "items": "هر محصول فقط یک‌بار در سفارش ثبت شود."
            })

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        from uuid import uuid4

        user = self.context["request"].user
        items_data = validated_data.pop("items")

        product_ids = [
            item["product_id"]
            for item in items_data
        ]

        # قفل‌کردن ردیف محصولات تا پایان تراکنش
        # برای جلوگیری از ثبت هم‌زمان سفارش بیش از موجودی
        locked_products = list(
            Product.objects
            .select_for_update()
            .filter(
                id__in=product_ids,
                is_active=True,
            )
            .order_by("id")
        )

        product_map = {
            product.id: product
            for product in locked_products
        }

        if len(product_map) != len(product_ids):
            raise serializers.ValidationError({
                "items": "یکی از محصولات یافت نشد یا غیرفعال است."
            })

        prepared_items = []
        subtotal = 0

        # اعتبارسنجی موجودی و تعداد سفارش
        for item in items_data:
            product = product_map[item["product_id"]]
            quantity = item["quantity"]

            if quantity < product.minimum_order_quantity:
                raise serializers.ValidationError({
                    "items": (
                        f"حداقل سفارش {product.name} "
                        f"{product.minimum_order_quantity} عدد است."
                    )
                })

            if (
                product.units_per_carton > 1
                and quantity % product.units_per_carton != 0
            ):
                raise serializers.ValidationError({
                    "items": (
                        f"تعداد سفارش {product.name} باید "
                        f"مضربی از {product.units_per_carton} باشد."
                    )
                })

            if quantity > product.stock_quantity:
                raise serializers.ValidationError({
                    "items": (
                        f"موجودی کافی برای {product.name} وجود ندارد. "
                        f"موجودی فعلی: {product.stock_quantity}"
                    )
                })

            if product.public_price <= 0:
                raise serializers.ValidationError({
                    "items": (
                        f"قیمت محصول {product.name} هنوز تعیین نشده است."
                    )
                })

            line_total = product.public_price * quantity
            subtotal += line_total

            prepared_items.append({
                "product": product,
                "quantity": quantity,
                "unit_price": product.public_price,
                "line_total": line_total,
            })

        # رزرو موجودی در همان تراکنش ثبت سفارش
        for item in prepared_items:
            product = item["product"]
            product.stock_quantity -= item["quantity"]

            product.save(update_fields=[
                "stock_quantity",
                "availability",
                "updated_at",
            ])

        # محاسبه مبلغ صرفاً در سرور
        order = Order.objects.create(
            order_number=f"JAL-{uuid4().hex[:12].upper()}",
            customer=user,
            subtotal=subtotal,
            total_amount=subtotal,
            **validated_data,
        )

        OrderItem.objects.bulk_create([
            OrderItem(
                order=order,
                product=item["product"],
                product_name=item["product"].name,
                product_sku=item["product"].sku,
                quantity=item["quantity"],
                unit_price=item["unit_price"],
                line_total=item["line_total"],
            )
            for item in prepared_items
        ])

        OrderStatusHistory.objects.create(
            order=order,
            old_status="",
            new_status=Order.Status.PENDING,
            description="سفارش توسط مشتری ثبت شد و موجودی آن رزرو شد.",
            changed_by=user,
        )

        return order
