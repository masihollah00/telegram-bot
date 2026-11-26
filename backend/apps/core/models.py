
import os
from datetime import date

from django.conf import settings
from django.core.validators import MinLengthValidator
from django.db import models


def site_asset_upload_path(instance, filename):
    """
    Store uploaded website assets in organized,
    date-based directories.
    """
    extension = os.path.splitext(filename)[1].lower()
    safe_name = f"{instance.asset_type}_{instance.pk or 'new'}{extension}"
    return (
        f"site-assets/{date.today():%Y/%m/%d}/"
        f"{safe_name}"
    )


class StoreConfiguration(models.Model):
    """
    Central public configuration for JALALI COSMETICS.

    Never store payment credentials, private API keys,
    passwords or other secrets in this public configuration.
    """

    store_name = models.CharField(
        max_length=150,
        default="JALALI COSMETICS",
        verbose_name="نام فروشگاه",
    )

    slogan = models.CharField(
        max_length=200,
        default="BEAUTY. BUSINESS. TRUST.",
        verbose_name="شعار فروشگاه",
    )

    support_phone = models.CharField(
        max_length=20,
        blank=True,
        verbose_name="شماره تماس پشتیبانی",
    )

    support_email = models.EmailField(
        blank=True,
        verbose_name="ایمیل پشتیبانی",
    )

    address = models.TextField(
        blank=True,
        verbose_name="نشانی فروشگاه",
    )

    postal_code = models.CharField(
        max_length=20,
        blank=True,
        verbose_name="کد پستی",
    )

    currency = models.CharField(
        max_length=10,
        default="IRR",
        validators=[MinLengthValidator(3)],
        verbose_name="واحد پول",
    )

    display_currency = models.CharField(
        max_length=20,
        default="تومان",
        verbose_name="واحد نمایش قیمت",
    )

    maintenance_mode = models.BooleanField(
        default=False,
        verbose_name="حالت تعمیر و نگهداری",
    )

    maintenance_message = models.TextField(
        blank=True,
        verbose_name="پیام تعمیر و نگهداری",
    )

    announcement_enabled = models.BooleanField(
        default=False,
        verbose_name="فعال بودن اطلاعیه سایت",
    )

    announcement_text = models.TextField(
        blank=True,
        verbose_name="متن اطلاعیه",
    )

    announcement_link = models.URLField(
        blank=True,
        verbose_name="لینک اطلاعیه",
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="آخرین به‌روزرسانی",
    )

    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="store_configuration_updates",
        verbose_name="آخرین ویرایش‌کننده",
    )

    class Meta:
        verbose_name = "تنظیمات فروشگاه"
        verbose_name_plural = "تنظیمات فروشگاه"
        ordering = ["-updated_at"]

    def __str__(self):
        return f"تنظیمات {self.store_name}"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)


class SiteTheme(models.Model):
    """
    Database-backed design system for the storefront.

    The mobile management application will update these
    values through authenticated administrative APIs.
    """

    name = models.CharField(
        max_length=120,
        default="JALALI SIGNATURE",
        verbose_name="نام تم",
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name="تم فعال",
    )

    colors = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="پالت رنگ",
        help_text="رنگ‌های اصلی، پس‌زمینه، متن، مرزها و تأکیدها",
    )

    typography = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="تنظیمات تایپوگرافی",
    )

    layout = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="تنظیمات چیدمان",
    )

    motion = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="تنظیمات حرکت و انیمیشن",
    )

    assets = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="تصاویر و دارایی‌های تم",
        help_text="شناسه دارایی‌های ثبت‌شده در گالری سایت",
    )

    custom_css_variables = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="متغیرهای CSS مجاز",
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="آخرین تغییر",
    )

    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="site_theme_updates",
        verbose_name="ویرایش‌کننده",
    )

    class Meta:
        verbose_name = "تم سایت"
        verbose_name_plural = "تم‌های سایت"
        ordering = ["-updated_at"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.is_active:
            SiteTheme.objects.exclude(pk=self.pk).filter(
                is_active=True
            ).update(is_active=False)

        super().save(*args, **kwargs)


class SiteAsset(models.Model):
    """
    Central media library for website images and files.

    Uploaded files are stored by the configured Django
    storage backend, not in browser local storage.
    """

    class AssetType(models.TextChoices):
        IMAGE = "image", "تصویر"
        BANNER = "banner", "بنر"
        LOGO = "logo", "لوگو"
        ICON = "icon", "آیکون"
        DOCUMENT = "document", "سند"

    title = models.CharField(
        max_length=180,
        verbose_name="عنوان فایل",
    )

    asset_type = models.CharField(
        max_length=20,
        choices=AssetType.choices,
        default=AssetType.IMAGE,
        db_index=True,
        verbose_name="نوع فایل",
    )

    file = models.FileField(
        upload_to=site_asset_upload_path,
        verbose_name="فایل",
    )

    alt_text = models.CharField(
        max_length=250,
        blank=True,
        verbose_name="متن جایگزین تصویر",
    )

    description = models.TextField(
        blank=True,
        verbose_name="توضیحات",
    )

    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="اطلاعات تکمیلی",
    )

    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="فعال",
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="زمان بارگذاری",
    )

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="site_assets",
        verbose_name="بارگذاری‌کننده",
    )

    class Meta:
        verbose_name = "دارایی رسانه‌ای سایت"
        verbose_name_plural = "گالری رسانه‌ای سایت"
        ordering = ["-uploaded_at"]

    def __str__(self):
        return self.title


class SitePageSection(models.Model):
    """
    Editable content blocks for individual website pages.

    Each section stores structured content as JSON.
    The storefront will render supported section types
    using real database content.
    """

    page_key = models.SlugField(
        max_length=100,
        db_index=True,
        verbose_name="شناسه صفحه",
    )

    section_key = models.SlugField(
        max_length=120,
        verbose_name="شناسه بخش",
    )

    section_type = models.CharField(
        max_length=80,
        verbose_name="نوع بخش",
        help_text="مانند hero، banner، text، gallery یا product_grid",
    )

    title = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="عنوان مدیریتی بخش",
    )

    content = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="محتوای بخش",
    )

    settings = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="تنظیمات نمایش بخش",
    )

    is_enabled = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="نمایش بخش",
    )

    sort_order = models.PositiveIntegerField(
        default=0,
        db_index=True,
        verbose_name="ترتیب نمایش",
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="آخرین تغییر",
    )

    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="site_section_updates",
        verbose_name="ویرایش‌کننده",
    )

    class Meta:
        verbose_name = "بخش صفحه"
        verbose_name_plural = "بخش‌های صفحات سایت"
        ordering = ["page_key", "sort_order", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["page_key", "section_key"],
                name="unique_site_page_section",
            )
        ]
        indexes = [
            models.Index(
                fields=["page_key", "is_enabled", "sort_order"],
                name="site_section_display_idx",
            )
        ]

    def __str__(self):
        return f"{self.page_key} / {self.section_key}"


class SiteNavigationLink(models.Model):
    """
    Editable navigation and footer links.
    Supports internal paths and external URLs.
    """

    class Placement(models.TextChoices):
        HEADER = "header", "منوی اصلی"
        FOOTER = "footer", "پاورقی"
        MOBILE = "mobile", "منوی موبایل"
        SOCIAL = "social", "شبکه‌های اجتماعی"

    label = models.CharField(
        max_length=120,
        verbose_name="عنوان لینک",
    )

    url = models.CharField(
        max_length=500,
        verbose_name="آدرس یا مسیر لینک",
        help_text="مثال: /products یا https://example.com",
    )

    placement = models.CharField(
        max_length=20,
        choices=Placement.choices,
        default=Placement.HEADER,
        db_index=True,
        verbose_name="محل نمایش",
    )

    icon = models.CharField(
        max_length=80,
        blank=True,
        verbose_name="شناسه آیکون",
    )

    open_in_new_tab = models.BooleanField(
        default=False,
        verbose_name="باز شدن در زبانه جدید",
    )

    is_enabled = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="فعال",
    )

    sort_order = models.PositiveIntegerField(
        default=0,
        verbose_name="ترتیب نمایش",
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="آخرین تغییر",
    )

    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="site_navigation_updates",
        verbose_name="ویرایش‌کننده",
    )

    class Meta:
        verbose_name = "لینک سایت"
        verbose_name_plural = "لینک‌های سایت"
        ordering = ["placement", "sort_order", "id"]

    def __str__(self):
        return self.label
