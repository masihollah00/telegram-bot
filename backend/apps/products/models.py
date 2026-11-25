import uuid

from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.utils.text import slugify


class ProductCategory(models.Model):
    name = models.CharField(
        max_length=150,
        unique=True,
        verbose_name="نام دسته‌بندی"
    )
    slug = models.SlugField(
        max_length=180,
        unique=True,
        allow_unicode=True,
        verbose_name="شناسه آدرس"
    )
    description = models.TextField(
        blank=True,
        verbose_name="توضیحات"
    )
    image = models.ImageField(
        upload_to="products/categories/",
        blank=True,
        null=True,
        verbose_name="تصویر دسته‌بندی"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="فعال"
    )
    sort_order = models.PositiveIntegerField(
        default=0,
        verbose_name="ترتیب نمایش"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="تاریخ ایجاد"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="آخرین بروزرسانی"
    )

    class Meta:
        verbose_name = "دسته‌بندی محصول"
        verbose_name_plural = "دسته‌بندی‌های محصولات"
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name


class ProductBrand(models.Model):
    name = models.CharField(
        max_length=150,
        unique=True,
        verbose_name="نام برند"
    )
    slug = models.SlugField(
        max_length=180,
        unique=True,
        allow_unicode=True,
        verbose_name="شناسه آدرس"
    )
    description = models.TextField(
        blank=True,
        verbose_name="توضیحات برند"
    )
    logo = models.ImageField(
        upload_to="products/brands/",
        blank=True,
        null=True,
        verbose_name="لوگوی برند"
    )
    website = models.URLField(
        blank=True,
        verbose_name="وب‌سایت رسمی"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="فعال"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="تاریخ ایجاد"
    )

    class Meta:
        verbose_name = "برند محصول"
        verbose_name_plural = "برندهای محصولات"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Product(models.Model):
    class Availability(models.TextChoices):
        IN_STOCK = "in_stock", "موجود"
        OUT_OF_STOCK = "out_of_stock", "ناموجود"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    name = models.CharField(
        max_length=220,
        verbose_name="نام محصول"
    )
    slug = models.SlugField(
        max_length=240,
        unique=True,
        allow_unicode=True,
        verbose_name="شناسه آدرس"
    )
    sku = models.CharField(
        max_length=80,
        unique=True,
        db_index=True,
        verbose_name="کد محصول"
    )
    barcode = models.CharField(
        max_length=100,
        blank=True,
        db_index=True,
        verbose_name="بارکد"
    )
    category = models.ForeignKey(
        ProductCategory,
        on_delete=models.PROTECT,
        related_name="products",
        verbose_name="دسته‌بندی"
    )
    brand = models.ForeignKey(
        ProductBrand,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
        verbose_name="برند"
    )
    short_description = models.CharField(
        max_length=350,
        blank=True,
        verbose_name="توضیح کوتاه"
    )
    description = models.TextField(
        blank=True,
        verbose_name="توضیحات کامل"
    )
    image = models.ImageField(
        upload_to="products/main/",
        blank=True,
        null=True,
        verbose_name="تصویر اصلی"
    )
    public_price = models.PositiveBigIntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name="قیمت عمومی به تومان"
    )
    cost_price = models.PositiveBigIntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name="قیمت خرید به تومان"
    )
    stock_quantity = models.PositiveIntegerField(
        default=0,
        verbose_name="موجودی واقعی انبار"
    )
    minimum_order_quantity = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        verbose_name="حداقل تعداد سفارش"
    )
    units_per_carton = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        verbose_name="تعداد در هر کارتن"
    )
    availability = models.CharField(
        max_length=20,
        choices=Availability.choices,
        default=Availability.OUT_OF_STOCK,
        verbose_name="وضعیت موجودی"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="فعال در فروشگاه"
    )
    is_featured = models.BooleanField(
        default=False,
        verbose_name="محصول ویژه"
    )
    weight_grams = models.PositiveIntegerField(
        default=0,
        verbose_name="وزن به گرم"
    )
    seo_title = models.CharField(
        max_length=220,
        blank=True,
        verbose_name="عنوان سئو"
    )
    seo_description = models.CharField(
        max_length=320,
        blank=True,
        verbose_name="توضیحات سئو"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="تاریخ ایجاد"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="آخرین بروزرسانی"
    )

    class Meta:
        verbose_name = "محصول"
        verbose_name_plural = "محصولات"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["sku"]),
            models.Index(fields=["is_active", "availability"]),
            models.Index(fields=["category", "is_active"]),
            models.Index(fields=["brand", "is_active"]),
        ]

    def save(self, *args, **kwargs):
        self.availability = (
            self.Availability.IN_STOCK
            if self.stock_quantity > 0
            else self.Availability.OUT_OF_STOCK
        )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.sku})"


class ProductImage(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="gallery",
        verbose_name="محصول"
    )
    image = models.ImageField(
        upload_to="products/gallery/",
        verbose_name="تصویر"
    )
    alt_text = models.CharField(
        max_length=220,
        blank=True,
        verbose_name="متن جایگزین تصویر"
    )
    sort_order = models.PositiveIntegerField(
        default=0,
        verbose_name="ترتیب نمایش"
    )
    is_primary = models.BooleanField(
        default=False,
        verbose_name="تصویر اصلی"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="تاریخ ثبت"
    )

    class Meta:
        verbose_name = "تصویر محصول"
        verbose_name_plural = "گالری تصاویر محصولات"
        ordering = ["sort_order", "id"]

    def __str__(self):
        return f"تصویر {self.product.name}"


class ProductPriceTier(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="price_tiers",
        verbose_name="محصول"
    )
    minimum_quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        verbose_name="حداقل تعداد"
    )
    unit_price = models.PositiveBigIntegerField(
        validators=[MinValueValidator(0)],
        verbose_name="قیمت هر واحد به تومان"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="فعال"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="تاریخ ایجاد"
    )

    class Meta:
        verbose_name = "قیمت پلکانی محصول"
        verbose_name_plural = "قیمت‌های پلکانی محصولات"
        ordering = ["minimum_quantity"]
        constraints = [
            models.UniqueConstraint(
                fields=["product", "minimum_quantity"],
                name="unique_product_price_quantity"
            )
        ]

    def __str__(self):
        return (
            f"{self.product.name} - "
            f"{self.minimum_quantity} عدد"
  )
