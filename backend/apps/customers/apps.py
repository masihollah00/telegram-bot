
from django.apps import AppConfig


class CustomersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.customers"
    label = "jalali_customers"
    verbose_name = "مدیریت مشتریان و همکاران پخش جلالی"
