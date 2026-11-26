from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    StoreConfigurationPublicView,
    StoreConfigurationAdminView,
    ActiveSiteThemeView,
    PublicSiteSectionsView,
    PublicNavigationView,
    AdminSiteThemeViewSet,
    AdminSiteAssetViewSet,
    AdminSitePageSectionViewSet,
    AdminSiteNavigationViewSet,
    AssignGalleryAssetView,
)

from .admin_auth import (
    admin_csrf,
    admin_login,
    admin_me,
    admin_logout,
)

from .admin_dashboard import AdminDashboardView


app_name = "jalali_core"


# ---------------------------------------------------------
# CENTRAL ADMIN ROUTER
# ---------------------------------------------------------

router = DefaultRouter()

router.register(
    "admin/design/themes",
    AdminSiteThemeViewSet,
    basename="admin-site-themes",
)

router.register(
    "admin/media",
    AdminSiteAssetViewSet,
    basename="admin-site-media",
)

router.register(
    "admin/pages/sections",
    AdminSitePageSectionViewSet,
    basename="admin-site-sections",
)

router.register(
    "admin/navigation",
    AdminSiteNavigationViewSet,
    basename="admin-site-navigation",
)


# ---------------------------------------------------------
# URL PATTERNS
# ---------------------------------------------------------

urlpatterns = [

    # ADMIN AUTHENTICATION

    path(
        "admin/auth/csrf/",
        admin_csrf,
        name="admin-auth-csrf",
    ),

    path(
        "admin/auth/login/",
        admin_login,
        name="admin-auth-login",
    ),

    path(
        "admin/auth/me/",
        admin_me,
        name="admin-auth-me",
    ),

    path(
        "admin/auth/logout/",
        admin_logout,
        name="admin-auth-logout",
    ),

    # ADMIN DASHBOARD

    path(
        "admin/dashboard/",
        AdminDashboardView.as_view(),
        name="admin-dashboard",
    ),

    # PUBLIC STORE INFORMATION

    path(
        "information/",
        StoreConfigurationPublicView.as_view(),
        name="store-information",
    ),

    # PUBLIC DESIGN SYSTEM

    path(
        "design/active/",
        ActiveSiteThemeView.as_view(),
        name="active-site-theme",
    ),

    # PUBLIC PAGE SECTIONS

    path(
        "pages/sections/",
        PublicSiteSectionsView.as_view(),
        name="public-site-sections",
    ),

    # PUBLIC NAVIGATION

    path(
        "navigation/",
        PublicNavigationView.as_view(),
        name="public-site-navigation",
    ),

    # STORE CONFIGURATION MANAGEMENT

    path(
        "admin/configuration/",
        StoreConfigurationAdminView.as_view(),
        name="admin-store-configuration",
    ),

    # CENTRAL MEDIA ASSIGNMENT

    path(
        "admin/media/assign/",
        AssignGalleryAssetView,
        name="admin-media-assign",
    ),

    # ROUTER ENDPOINTS

    path(
        "",
        include(router.urls),
    ),
]
