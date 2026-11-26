from datetime import timedelta

from django.db.models import Sum
from django.utils import timezone

from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.products.models import Product
from apps.orders.models import Order
from apps.customers.models import PartnerApplication

from .throttles import AdminUserRateThrottle


class AdminDashboardView(APIView):
    """
    داشبورد مدیریتی JALALI

    تمام آمار از دیتابیس واقعی خوانده می‌شوند.
    دسترسی فقط برای کاربران مدیر و احراز هویت شده مجاز است.
    """

    permission_classes = [IsAdminUser]
    throttle_classes = [AdminUserRateThrottle]

    def get(self, request):
        now = timezone.now()

        today_start = now.replace(
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )

        month_start = today_start.replace(day=1)

        seven_days_ago = now - timedelta(days=7)
        thirty_days_ago = now - timedelta(days=30)

        # -------------------------------------------------
        # PRODUCTS
        # -------------------------------------------------

        products = Product.objects.all()

        total_products = products.count()

        active_products = products.filter(
            is_active=True
        ).count()

        inactive_products = products.filter(
            is_active=False
        ).count()

        in_stock_products = products.filter(
            stock_quantity__gt=0,
            is_active=True,
        ).count()

        out_of_stock_products = products.filter(
            stock_quantity=0,
            is_active=True,
        ).count()

        low_stock_products = products.filter(
            stock_quantity__gt=0,
            stock_quantity__lte=5,
            is_active=True,
        ).count()

        # -------------------------------------------------
        # ORDERS
        # -------------------------------------------------

        orders = Order.objects.all()

        total_orders = orders.count()

        today_orders = orders.filter(
            created_at__gte=today_start
        ).count()

        last_seven_days_orders = orders.filter(
            created_at__gte=seven_days_ago
        ).count()

        last_thirty_days_orders = orders.filter(
            created_at__gte=thirty_days_ago
        ).count()

        pending_orders = orders.filter(
            status=Order.Status.PENDING
        ).count()

        processing_orders = orders.filter(
            status=Order.Status.PROCESSING
        ).count()

        shipped_orders = orders.filter(
            status=Order.Status.SHIPPED
        ).count()

        delivered_orders = orders.filter(
            status=Order.Status.DELIVERED
        ).count()

        cancelled_orders = orders.filter(
            status=Order.Status.CANCELLED
        ).count()

        # -------------------------------------------------
        # PAYMENTS AND REVENUE
        # -------------------------------------------------

        paid_orders = orders.filter(
            payment_status=Order.PaymentStatus.PAID
        )

        total_paid_revenue = (
            paid_orders.aggregate(
                total=Sum("total_amount")
            )["total"] or 0
        )

        today_revenue = (
            paid_orders.filter(
                created_at__gte=today_start
            ).aggregate(
                total=Sum("total_amount")
            )["total"] or 0
        )

        monthly_revenue = (
            paid_orders.filter(
                created_at__gte=month_start
            ).aggregate(
                total=Sum("total_amount")
            )["total"] or 0
        )

        last_thirty_days_revenue = (
            paid_orders.filter(
                created_at__gte=thirty_days_ago
            ).aggregate(
                total=Sum("total_amount")
            )["total"] or 0
        )

        unpaid_orders = orders.filter(
            payment_status=Order.PaymentStatus.UNPAID
        ).count()

        payment_pending_orders = orders.filter(
            payment_status=Order.PaymentStatus.PENDING
        ).count()

        failed_payment_orders = orders.filter(
            payment_status=Order.PaymentStatus.FAILED
        ).count()

        refunded_orders = orders.filter(
            payment_status=Order.PaymentStatus.REFUNDED
        ).count()

        # -------------------------------------------------
        # WHOLESALE PARTNERS
        # -------------------------------------------------

        partner_applications = PartnerApplication.objects.all()

        total_partner_applications = (
            partner_applications.count()
        )

        pending_partner_applications = (
            partner_applications.filter(
                status=PartnerApplication.Status.PENDING
            ).count()
        )

        approved_partner_applications = (
            partner_applications.filter(
                status=PartnerApplication.Status.APPROVED
            ).count()
        )

        rejected_partner_applications = (
            partner_applications.filter(
                status=PartnerApplication.Status.REJECTED
            ).count()
        )

        # -------------------------------------------------
        # RECENT ORDERS
        # -------------------------------------------------

        recent_orders_queryset = (
            orders.order_by("-created_at")[:10]
        )

        recent_orders = []

        for order in recent_orders_queryset:
            recent_orders.append({
                "id": str(order.id),
                "order_number": order.order_number,
                "customer_name": order.customer_name,
                "customer_type": order.customer_type,
                "status": order.status,
                "status_label": order.get_status_display(),
                "payment_status": order.payment_status,
                "payment_status_label": (
                    order.get_payment_status_display()
                ),
                "total_amount": order.total_amount,
                "currency": order.currency,
                "created_at": order.created_at.isoformat(),
            })

        # -------------------------------------------------
        # LOW STOCK PRODUCTS
        # -------------------------------------------------

        low_stock_queryset = (
            products.filter(
                is_active=True,
                stock_quantity__lte=5,
            )
            .order_by("stock_quantity", "name")[:10]
        )

        low_stock_items = []

        for product in low_stock_queryset:
            low_stock_items.append({
                "id": str(product.id),
                "name": product.name,
                "sku": product.sku,
                "stock_quantity": product.stock_quantity,
                "public_price": product.public_price,
                "availability": product.availability,
            })

        # -------------------------------------------------
        # RESPONSE
        # -------------------------------------------------

        return Response({
            "success": True,

            "dashboard": {
                "generated_at": now.isoformat(),
                "timezone": timezone.get_current_timezone_name(),
                "currency": "تومان",
            },

            "overview": {
                "total_products": total_products,
                "active_products": active_products,
                "inactive_products": inactive_products,

                "total_orders": total_orders,
                "today_orders": today_orders,
                "last_seven_days_orders": (
                    last_seven_days_orders
                ),
                "last_thirty_days_orders": (
                    last_thirty_days_orders
                ),

                "total_paid_revenue": total_paid_revenue,
                "today_revenue": today_revenue,
                "monthly_revenue": monthly_revenue,
                "last_thirty_days_revenue": (
                    last_thirty_days_revenue
                ),

                "total_partner_applications": (
                    total_partner_applications
                ),
                "pending_partner_applications": (
                    pending_partner_applications
                ),
            },

            "products": {
                "total": total_products,
                "active": active_products,
                "inactive": inactive_products,
                "in_stock": in_stock_products,
                "out_of_stock": out_of_stock_products,
                "low_stock": low_stock_products,
            },

            "orders": {
                "total": total_orders,
                "today": today_orders,
                "last_seven_days": last_seven_days_orders,
                "last_thirty_days": last_thirty_days_orders,

                "pending": pending_orders,
                "processing": processing_orders,
                "shipped": shipped_orders,
                "delivered": delivered_orders,
                "cancelled": cancelled_orders,
            },

            "payments": {
                "paid_orders": paid_orders.count(),
                "unpaid_orders": unpaid_orders,
                "pending_orders": payment_pending_orders,
                "failed_orders": failed_payment_orders,
                "refunded_orders": refunded_orders,

                "total_paid_revenue": total_paid_revenue,
                "today_revenue": today_revenue,
                "monthly_revenue": monthly_revenue,
                "last_thirty_days_revenue": (
                    last_thirty_days_revenue
                ),
            },

            "wholesale": {
                "total": total_partner_applications,
                "pending": pending_partner_applications,
                "approved": approved_partner_applications,
                "rejected": rejected_partner_applications,
            },

            "recent_orders": recent_orders,

            "low_stock_products": low_stock_items,
        })
