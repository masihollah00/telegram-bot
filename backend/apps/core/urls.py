
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


app_name = "jalali_core"


# ---------------------------------------------------------
# ROUTER — CENTRAL WEBSITE MANAGEMENT
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

    # -----------------------------------------------------
    # PUBLIC STORE INFORMATION
    # -----------------------------------------------------

    path(
        "information/",
        StoreConfigurationPublicView.as_view(),
        name="store-information",
    ),

    # -----------------------------------------------------
    # PUBLIC DESIGN SYSTEM
    # -----------------------------------------------------

    path(
        "design/active/",
        ActiveSiteThemeView.as_view(),
        name="active-site-theme",
    ),

    # -----------------------------------------------------
    # PUBLIC PAGE BUILDER
    # Example: ?page=home
    # -----------------------------------------------------

    path(
        "pages/sections/",
        PublicSiteSectionsView.as_view(),
        name="public-site-sections",
    ),

    # -----------------------------------------------------
    # PUBLIC NAVIGATION
    # Example: ?placement=header
    # -----------------------------------------------------

    path(
        "navigation/",
        PublicNavigationView.as_view(),
        name="public-site-navigation",
    ),

    # -----------------------------------------------------
    # STORE CONFIGURATION MANAGEMENT
    # -----------------------------------------------------

    path(
        "admin/configuration/",
        StoreConfigurationAdminView.as_view(),
        name="admin-store-configuration",
    ),

    # -----------------------------------------------------
    # CENTRAL GALLERY IMAGE ASSIGNMENT
    # -----------------------------------------------------

    path(
        "admin/media/assign/",
        AssignGalleryAssetView.as_view(),
        name="admin-media-assign",
    ),

    # -----------------------------------------------------
    # ALL MANAGEMENT ROUTER ENDPOINTS
    # -----------------------------------------------------

    path(
        "",
        include(router.urls),
    ),
]
