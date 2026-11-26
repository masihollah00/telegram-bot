
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health_check(request):
    return JsonResponse({
        "success": True,
        "service": "JALALI API",
        "status": "healthy",
    })


urlpatterns = [
    path(
        "admin/",
        admin.site.urls,
    ),

    # وضعیت و سلامت سرور
    path(
        "api/health/",
        health_check,
        name="health-check",
    ),

    # API عمومی و تنظیمات مرکزی فروشگاه
    path(
        "api/store/",
        include("apps.core.urls"),
    ),

    # محصولات، دسته‌بندی‌ها و برندها
    path(
        "api/store/",
        include("apps.products.urls"),
    ),

    # سفارش‌ها و پرداخت‌ها
    path(
        "api/store/",
        include("apps.orders.urls"),
    ),

    # حساب مشتریان و همکاری عمده
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
