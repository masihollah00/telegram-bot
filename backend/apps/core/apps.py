
from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"

    name = "apps.core"

    label = "jalali_core"

    verbose_name = "هسته مرکزی پخش جلالی"

    def ready(self):
        """
        Initialize application-level integrations.

        Signal registrations and startup integrations
        can be imported here when they are implemented.
        Avoid database queries during application startup.
        """
        pass
