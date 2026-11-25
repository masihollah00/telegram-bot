from django.urls import path

from .views import (
    CustomerProfileView,
    CustomerAddressListCreateView,
    CustomerAddressDetailView,
    PartnerApplicationListCreateView,
)


app_name = "jalali_customers"


urlpatterns = [
    # پروفایل مشتری
    path(
        "customer/profile/",
        CustomerProfileView.as_view(),
        name="customer-profile",
    ),

    # فهرست و ثبت آدرس‌های مشتری
    path(
        "customer/addresses/",
        CustomerAddressListCreateView.as_view(),
        name="customer-address-list-create",
    ),

    # مشاهده، ویرایش و حذف آدرس مشخص
    path(
        "customer/addresses/<uuid:id>/",
        CustomerAddressDetailView.as_view(),
        name="customer-address-detail",
    ),

    # درخواست عضویت در طرح همکاری
    path(
        "customer/partner-applications/",
        PartnerApplicationListCreateView.as_view(),
        name="partner-application-list-create",
    ),
]
