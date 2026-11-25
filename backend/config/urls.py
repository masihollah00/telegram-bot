
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health_check(request):
    return JsonResponse(
        {
            "success": True,
            "service": "JALALI COSMETICS API",
            "status": "healthy",
        }
    )


urlpatterns = [
    path("admin/", admin.site.urls),

    # Server health
    path(
        "api/health/",
        health_check,
        name="health-check",
    ),

    # Public and administrative store APIs
    path(
        "api/store/",
        include("apps.core.urls"),
    ),
]
