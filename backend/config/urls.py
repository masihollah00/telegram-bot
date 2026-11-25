
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static


def health_check(request):
    return JsonResponse({
        "success": True,
        "service": "JALALI COSMETICS API",
        "status": "healthy",
        "version": "1.0.0",
    })


def store_information(request):
    return JsonResponse({
        "success": True,
        "store": {
            "name": settings.STORE_NAME,
            "currency": settings.STORE_CURRENCY,
            "display_currency": settings.STORE_DISPLAY_CURRENCY,
            "country": settings.STORE_COUNTRY,
            "language": settings.STORE_LANGUAGE,
            "timezone": settings.STORE_TIME_ZONE,
        }
    })


urlpatterns = [
    path(
        "admin/",
        admin.site.urls,
        name="admin",
    ),

    path(
        "api/health/",
        health_check,
        name="health-check",
    ),

    path(
        "api/store/information/",
        store_information,
        name="store-information",
    ),

    # Future API modules:
    # path("api/store/products/", include("apps.products.urls")),
    # path("api/store/categories/", include("apps.categories.urls")),
    # path("api/store/brands/", include("apps.brands.urls")),
    # path("api/store/orders/", include("apps.orders.urls")),
    # path("api/store/customers/", include("apps.customers.urls")),
    # path("api/store/partners/", include("apps.partners.urls")),
    # path("api/store/auth/", include("apps.accounts.urls")),
    # path("api/store/quotations/", include("apps.quotations.urls")),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )
