
from django.urls import path

from .views import (
    StoreConfigurationPublicView,
    StoreConfigurationAdminView,
)


app_name = "jalali_core"


urlpatterns = [
    # Public store configuration
    path(
        "information/",
        StoreConfigurationPublicView.as_view(),
        name="store-information",
    ),

    # Staff-only store configuration management
    path(
        "admin/configuration/",
        StoreConfigurationAdminView.as_view(),
        name="admin-store-configuration",
    ),
]
