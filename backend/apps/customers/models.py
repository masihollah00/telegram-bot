
import uuid

from django.conf import settings
from django.db import models


class CustomerProfile(models.Model):
    class AccountType(models.TextChoices):
        RETAIL = "retail", "مشتری عادی"
        WHOLESALE = "wholesale", "مشتری عمده"

    class PartnerStatus(models.TextChoices):
        NONE = "none", "درخواست نداده"
        PENDING = "pending", "در انتظار بررسی"
        APPROVED = "approved", "تأیید شده"
        REJECTED = "rejected", "رد شده"
        SUSPENDED = "suspended", "تعلیق شده"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="jalali_profile",
    )

    account_type = models.CharField(
        max_length=20,
        choices=AccountType.choices,
        default=AccountType.RETAIL,
    )

    partner_status = models.CharField(
        max_length=20,
        choices=PartnerStatus.choices,
        default=PartnerStatus.NONE,
        db_index=True,
    )

    national_id = models.CharField(
        max_length=20,
        blank=True,
    )

    business_name = models.CharField(
        max_length=200,
        blank=True,
    )

    business_license_number = models.CharField(
        max_length=100,
        blank=True,
    )

    business_phone = models.CharField(
        max_length=20,
        blank=True,
    )

    province = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)

    is_verified = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.user.get_username()


class CustomerAddress(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="jalali_addresses",
    )

    title = models.CharField(max_length=100)
    recipient_name = models.CharField(max_length=160)
    recipient_phone = models.CharField(max_length=20)

    province = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    address = models.TextField()

    is_default = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_default", "-created_at"]

    def save(self, *args, **kwargs):
        if self.is_default:
            CustomerAddress.objects.filter(
                customer=self.customer,
                is_default=True,
            ).exclude(pk=self.pk).update(is_default=False)

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} - {self.customer}"


class PartnerApplication(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "در انتظار بررسی"
        APPROVED = "approved", "تأیید شده"
        REJECTED = "rejected", "رد شده"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="jalali_partner_applications",
    )

    business_name = models.CharField(max_length=200)
    owner_name = models.CharField(max_length=160)
    phone = models.CharField(max_length=20)

    national_id = models.CharField(max_length=20)
    business_license_number = models.CharField(
        max_length=100,
        blank=True,
    )

    province = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    business_address = models.TextField()

    description = models.TextField(blank=True)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )

    review_note = models.TextField(blank=True)

    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_jalali_applications",
    )

    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["customer", "created_at"]),
        ]

    def __str__(self):
        return self.business_name
