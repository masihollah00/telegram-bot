
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
        return obj.changed_by.get_full_name() or obj.changed_by.get_username()


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
    )

    items = OrderCreateItemSerializer(
        many=True,
        allow_empty=False,
    )

    def validate_customer_phone(self, value):
        normalized = value.replace(" ", "").replace("-", "")
        if not normalized.replace("+", "").isdigit():
            raise serializers.ValidationError(
                "شماره تماس معتبر نیست."
            )
        if len(normalized) < 10 or len(normalized) > 15:
            raise serializers.ValidationError(
                "طول شماره تماس معتبر نیست."
            )
        return normalized

    def validate(self, attrs):
        product_ids = [item["product_id"] for item in attrs["items"]]

        if len(product_ids) != len(set(product_ids)):
            raise serializers.ValidationError({
                "items": "هر محصول فقط یک‌بار در سفارش ثبت شود."
            })

        products = Product.objects.filter(
            id__in=product_ids,
            is_active=True,
        )

        product_map = {product.id: product for product in products}

        for item in attrs["items"]:
            product = product_map.get(item["product_id"])

            if product is None:
                raise serializers.ValidationError({
                    "items": "یکی از محصولات موجود یا فعال نیست."
                })

            if not product.is_available:
                raise serializers.ValidationError({
                    "items": f"محصول {product.name} ناموجود است."
                })

            quantity = item["quantity"]

            if quantity < product.minimum_order_quantity:
                raise serializers.ValidationError({
                    "items": (
                        f"حداقل سفارش {product.name} "
                        f"{product.minimum_order_quantity} عدد است."
                    )
                })

            if (
                product.carton_quantity
                and product.carton_quantity > 1
                and quantity % product.carton_quantity != 0
            ):
                raise serializers.ValidationError({
                    "items": (
                        f"تعداد سفارش {product.name} باید "
                        f"مضربی از تعداد کارتن باشد."
                    )
                })

        attrs["_product_map"] = product_map
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        from uuid import uuid4

        from django.db.models import Q

        user = self.context["request"].user
        product_map = validated_data.pop("_product_map")
        items_data = validated_data.pop("items")

        subtotal = 0
        prepared_items = []

        for item in items_data:
            product = Product.objects.select_for_update().get(
                Q(id=item["product_id"]),
                is_active=True,
            )

            if not product.is_available:
                raise serializers.ValidationError({
                    "items": f"محصول {product.name} دیگر موجود نیست."
                })

            quantity = item["quantity"]

            if quantity < product.minimum_order_quantity:
                raise serializers.ValidationError({
                    "items": f"حداقل سفارش {product.name} رعایت نشده است."
                })

            if (
                product.carton_quantity
                and product.carton_quantity > 1
                and quantity % product.carton_quantity != 0
            ):
                raise serializers.ValidationError({
                    "items": f"تعداد کارتن محصول {product.name} معتبر نیست."
                })

            line_total = product.public_price * quantity
            subtotal += line_total

            prepared_items.append({
                "product": product,
                "quantity": quantity,
                "unit_price": product.public_price,
                "line_total": line_total,
            })

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
            description="سفارش توسط مشتری ثبت شد.",
            changed_by=user,
        )

        return order
