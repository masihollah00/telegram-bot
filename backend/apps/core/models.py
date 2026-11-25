
from django.conf import settings
from django.core.validators import MinLengthValidator
from django.db import models


class StoreConfiguration(models.Model):
    """
    Central public configuration for JALALI COSMETICS.

    Sensitive credentials, payment secrets and API keys
    must never be stored in this public configuration model.
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
        # Keep one central configuration record.
        self.pk = 1
        super().save(*args, **kwargs)
