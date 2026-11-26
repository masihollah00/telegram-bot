
from django.conf import settings
from django.core.validators import MinLengthValidator
from django.db import migrations, models
import django.db.models.deletion
import apps.core.models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="StoreConfiguration",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("store_name", models.CharField(default="JALALI COSMETICS", max_length=150, verbose_name="نام فروشگاه")),
                ("slogan", models.CharField(default="BEAUTY. BUSINESS. TRUST.", max_length=200, verbose_name="شعار فروشگاه")),
                ("support_phone", models.CharField(blank=True, max_length=20, verbose_name="شماره تماس پشتیبانی")),
                ("support_email", models.EmailField(blank=True, max_length=254, verbose_name="ایمیل پشتیبانی")),
                ("address", models.TextField(blank=True, verbose_name="نشانی فروشگاه")),
                ("postal_code", models.CharField(blank=True, max_length=20, verbose_name="کد پستی")),
                ("currency", models.CharField(default="IRR", max_length=10, validators=[MinLengthValidator(3)], verbose_name="واحد پول")),
                ("display_currency", models.CharField(default="تومان", max_length=20, verbose_name="واحد نمایش قیمت")),
                ("maintenance_mode", models.BooleanField(default=False, verbose_name="حالت تعمیر و نگهداری")),
                ("maintenance_message", models.TextField(blank=True, verbose_name="پیام تعمیر و نگهداری")),
                ("announcement_enabled", models.BooleanField(default=False, verbose_name="فعال بودن اطلاعیه سایت")),
                ("announcement_text", models.TextField(blank=True, verbose_name="متن اطلاعیه")),
                ("announcement_link", models.URLField(blank=True, max_length=200, verbose_name="لینک اطلاعیه")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="آخرین به‌روزرسانی")),
                ("updated_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="store_configuration_updates", to=settings.AUTH_USER_MODEL, verbose_name="آخرین ویرایش‌کننده")),
            ],
            options={
                "verbose_name": "تنظیمات فروشگاه",
                "verbose_name_plural": "تنظیمات فروشگاه",
                "ordering": ["-updated_at"],
            },
        ),

        migrations.CreateModel(
            name="SiteAsset",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=180, verbose_name="عنوان فایل")),
                ("asset_type", models.CharField(choices=[("image", "تصویر"), ("banner", "بنر"), ("logo", "لوگو"), ("icon", "آیکون"), ("document", "سند")], db_index=True, default="image", max_length=20, verbose_name="نوع فایل")),
                ("file", models.FileField(upload_to=apps.core.models.site_asset_upload_path, verbose_name="فایل")),
                ("alt_text", models.CharField(blank=True, max_length=250, verbose_name="متن جایگزین تصویر")),
                ("description", models.TextField(blank=True, verbose_name="توضیحات")),
                ("metadata", models.JSONField(blank=True, default=dict, verbose_name="اطلاعات تکمیلی")),
                ("is_active", models.BooleanField(db_index=True, default=True, verbose_name="فعال")),
                ("uploaded_at", models.DateTimeField(auto_now_add=True, verbose_name="زمان بارگذاری")),
                ("uploaded_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="site_assets", to=settings.AUTH_USER_MODEL, verbose_name="بارگذاری‌کننده")),
            ],
            options={
                "verbose_name": "دارایی رسانه‌ای سایت",
                "verbose_name_plural": "گالری رسانه‌ای سایت",
                "ordering": ["-uploaded_at"],
            },
        ),

        migrations.CreateModel(
            name="SiteNavigationLink",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("label", models.CharField(max_length=120, verbose_name="عنوان لینک")),
                ("url", models.CharField(help_text="مثال: /products یا https://example.com", max_length=500, verbose_name="آدرس یا مسیر لینک")),
                ("placement", models.CharField(choices=[("header", "منوی اصلی"), ("footer", "پاورقی"), ("mobile", "منوی موبایل"), ("social", "شبکه‌های اجتماعی")], db_index=True, default="header", max_length=20, verbose_name="محل نمایش")),
                ("icon", models.CharField(blank=True, max_length=80, verbose_name="شناسه آیکون")),
                ("open_in_new_tab", models.BooleanField(default=False, verbose_name="باز شدن در زبانه جدید")),
                ("is_enabled", models.BooleanField(db_index=True, default=True, verbose_name="فعال")),
                ("sort_order", models.PositiveIntegerField(default=0, verbose_name="ترتیب نمایش")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="آخرین تغییر")),
                ("updated_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="site_navigation_updates", to=settings.AUTH_USER_MODEL, verbose_name="ویرایش‌کننده")),
            ],
            options={
                "verbose_name": "لینک سایت",
                "verbose_name_plural": "لینک‌های سایت",
                "ordering": ["placement", "sort_order", "id"],
            },
        ),

        migrations.CreateModel(
            name="SitePageSection",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("page_key", models.SlugField(db_index=True, max_length=100, verbose_name="شناسه صفحه")),
                ("section_key", models.SlugField(max_length=120, verbose_name="شناسه بخش")),
                ("section_type", models.CharField(help_text="مانند hero، banner، text، gallery یا product_grid", max_length=80, verbose_name="نوع بخش")),
                ("title", models.CharField(blank=True, max_length=200, verbose_name="عنوان مدیریتی بخش")),
                ("content", models.JSONField(blank=True, default=dict, verbose_name="محتوای بخش")),
                ("settings", models.JSONField(blank=True, default=dict, verbose_name="تنظیمات نمایش بخش")),
                ("is_enabled", models.BooleanField(db_index=True, default=True, verbose_name="نمایش بخش")),
                ("sort_order", models.PositiveIntegerField(db_index=True, default=0, verbose_name="ترتیب نمایش")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="آخرین تغییر")),
                ("updated_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="site_section_updates", to=settings.AUTH_USER_MODEL, verbose_name="ویرایش‌کننده")),
            ],
            options={
                "verbose_name": "بخش صفحه",
                "verbose_name_plural": "بخش‌های صفحات سایت",
                "ordering": ["page_key", "sort_order", "id"],
            },
        ),

        migrations.CreateModel(
            name="SiteTheme",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(default="JALALI SIGNATURE", max_length=120, verbose_name="نام تم")),
                ("is_active", models.BooleanField(default=True, verbose_name="تم فعال")),
                ("colors", models.JSONField(blank=True, default=dict, help_text="رنگ‌های اصلی، پس‌زمینه، متن، مرزها و تأکیدها", verbose_name="پالت رنگ")),
                ("typography", models.JSONField(blank=True, default=dict, verbose_name="تنظیمات تایپوگرافی")),
                ("layout", models.JSONField(blank=True, default=dict, verbose_name="تنظیمات چیدمان")),
                ("motion", models.JSONField(blank=True, default=dict, verbose_name="تنظیمات حرکت و انیمیشن")),
                ("assets", models.JSONField(blank=True, default=dict, help_text="شناسه دارایی‌های ثبت‌شده در گالری سایت", verbose_name="تصاویر و دارایی‌های تم")),
                ("custom_css_variables", models.JSONField(blank=True, default=dict, verbose_name="متغیرهای CSS مجاز")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="آخرین تغییر")),
                ("updated_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="site_theme_updates", to=settings.AUTH_USER_MODEL, verbose_name="ویرایش‌کننده")),
            ],
            options={
                "verbose_name": "تم سایت",
                "verbose_name_plural": "تم‌های سایت",
                "ordering": ["-updated_at"],
            },
        ),

        migrations.AddConstraint(
            model_name="sitepagesection",
            constraint=models.UniqueConstraint(fields=("page_key", "section_key"), name="unique_site_page_section"),
        ),

        migrations.AddIndex(
            model_name="sitepagesection",
            index=models.Index(fields=["page_key", "is_enabled", "sort_order"], name="site_section_display_idx"),
        ),
    ]
