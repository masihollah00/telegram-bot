
from django.contrib import admin

from .models import Order, OrderItem, OrderStatusHistory


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = (
        "product_name",
        "product_sku",
        "unit_price",
        "discount_amount",
        "line_total",
        "created_at",
    )
    fields = (
        "product",
        "product_name",
        "product_sku",
        "quantity",
        "unit_price",
        "discount_amount",
        "line_total",
    )


class OrderStatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    can_delete = False
    readonly_fields = (
        "old_status",
        "new_status",
        "description",
        "changed_by",
        "created_at",
    )


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_number",
        "customer_name",
        "customer_phone",
        "total_amount",
        "status",
        "payment_status",
        "created_at",
    )

    list_filter = (
        "status",
        "payment_status",
        "created_at",
        "province",
    )

    search_fields = (
        "order_number",
        "customer_name",
        "customer_phone",
        "customer_email",
        "tracking_code",
    )

    readonly_fields = (
        "id",
        "order_number",
        "customer",
        "subtotal",
        "discount_amount",
        "shipping_amount",
        "tax_amount",
        "total_amount",
        "placed_at",
        "created_at",
        "updated_at",
    )

    inlines = [
        OrderItemInline,
        OrderStatusHistoryInline,
    ]

    list_per_page = 30
    date_hierarchy = "created_at"


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = (
        "product_name",
        "product_sku",
        "order",
        "quantity",
        "unit_price",
        "line_total",
    )

    search_fields = (
        "product_name",
        "product_sku",
        "order__order_number",
    )

    list_filter = ("created_at",)


@admin.register(OrderStatusHistory)
class OrderStatusHistoryAdmin(admin.ModelAdmin):
    list_display = (
        "order",
        "old_status",
        "new_status",
        "changed_by",
        "created_at",
    )

    search_fields = (
        "order__order_number",
        "description",
    )

    list_filter = (
        "new_status",
        "created_at",
    )

    readonly_fields = (
        "order",
        "old_status",
        "new_status",
        "description",
        "changed_by",
        "created_at",
    )
