from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health_check(request):
    return JsonResponse({
        "success": True,
        "service": "JALALI COSMETICS API",
        "status": "healthy",
    })


urlpatterns = [
    path("admin/", admin.site.urls),

    # وضعیت سرور
    path(
        "api/health/",
        health_check,
        name="health-check",
    ),

    # API عمومی فروشگاه
    path(
        "api/store/",
        include("apps.core.urls"),
    ),
    path(
        "api/store/",
        include("apps.products.urls"),
    ),

    # API سفارش‌های مشتری
    path(
        "api/store/",
        include("apps.orders.urls"),
    ),

    # API حساب مشتری
    path(
        "api/store/",
        include("apps.customers.urls"),
    ),

    # مدیریت محصولات
    path(
        "api/admin/store/products/",
        include("apps.products.admin_urls"),
    ),
]
