
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


# =========================================================
# HEALTH CHECK
# =========================================================

def health_check(request):

    return JsonResponse({
        "success": True,
        "service": "JALALI API",
        "status": "healthy",
    })


# =========================================================
# ROOT URL CONFIGURATION
# =========================================================

urlpatterns = [

    # Django administration
    path(
        "admin/",
        admin.site.urls,
    ),

    # API health
    path(
        "api/health/",
        health_check,
        name="health-check",
    ),

    # =====================================================
    # PUBLIC STORE API
    # =====================================================

    # Core settings and store configuration
    path(
        "api/store/",
        include("apps.core.urls"),
    ),

    # Products, categories and brands
    path(
        "api/store/",
        include("apps.products.urls"),
    ),

    # Orders and payments
    path(
        "api/store/",
        include("apps.orders.urls"),
    ),

    # Customers and wholesale accounts
    path(
        "api/store/",
        include("apps.customers.urls"),
    ),

    # =====================================================
    # ADMIN STORE API
    # =====================================================

    # Product management
    path(
        "api/admin/store/products/",
        include("apps.products.admin_urls"),
    ),

]
