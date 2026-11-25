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
    # پنل مدیریت Django
    path("admin/", admin.site.urls),

    # بررسی سلامت سرور
    path(
        "api/health/",
        health_check,
        name="health-check",
    ),

    # اطلاعات عمومی فروشگاه و تنظیمات مدیریتی
    path(
        "api/store/",
        include("apps.core.urls"),
    ),

    # محصولات، دسته‌بندی‌ها و برندها
    path(
        "api/store/",
        include("apps.products.urls"),
    ),
]
