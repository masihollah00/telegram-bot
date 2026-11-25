
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

    # System health
    path("api/health/", health_check, name="health-check"),

    # Public storefront API
    path("api/store/", include("apps.core.urls")),
    path("api/store/", include("apps.products.urls")),

    # Protected product management API
    path(
        "api/admin/store/products/",
        include("apps.products.admin_urls"),
    ),
]
