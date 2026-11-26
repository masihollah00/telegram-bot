
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase

from .models import (
    StoreConfiguration,
    SiteTheme,
    SitePageSection,
    SiteNavigationLink,
)
from .serializers import (
    StoreConfigurationSerializer,
    SiteThemeAdminSerializer,
    SitePageSectionAdminSerializer,
    SiteNavigationLinkAdminSerializer,
)


User = get_user_model()


class StoreConfigurationTests(TestCase):

    def test_configuration_uses_singleton_primary_key(self):
        first = StoreConfiguration.objects.create(
            store_name="JALALI COSMETICS",
        )

        second = StoreConfiguration.objects.create(
            store_name="JALALI COSMETICS UPDATED",
        )

        self.assertEqual(first.pk, 1)
        self.assertEqual(second.pk, 1)
        self.assertEqual(StoreConfiguration.objects.count(), 1)

        self.assertEqual(
            StoreConfiguration.objects.get(pk=1).store_name,
            "JALALI COSMETICS UPDATED",
        )

    def test_public_serializer_exposes_only_public_fields(self):
        configuration = StoreConfiguration.objects.create(
            store_name="JALALI COSMETICS",
        )

        serializer = StoreConfigurationSerializer(configuration)
        data = serializer.data

        self.assertNotIn("updated_by", data)
        self.assertNotIn("id", data)

        # این فیلدها طبق طراحی فعلی در خروجی عمومی وجود دارند.
        self.assertIn("maintenance_mode", data)
        self.assertIn("maintenance_message", data)

    def test_public_serializer_fields_are_read_only(self):
        serializer = StoreConfigurationSerializer()

        self.assertEqual(
            set(serializer.Meta.read_only_fields),
            set(serializer.Meta.fields),
        )


class SiteThemeTests(TestCase):

    def test_only_one_theme_remains_active(self):
        first = SiteTheme.objects.create(
            name="تم اول",
            is_active=True,
        )

        second = SiteTheme.objects.create(
            name="تم دوم",
            is_active=True,
        )

        first.refresh_from_db()
        second.refresh_from_db()

        self.assertFalse(first.is_active)
        self.assertTrue(second.is_active)

        self.assertEqual(
            SiteTheme.objects.filter(is_active=True).count(),
            1,
        )

    def test_valid_color_palette_is_accepted(self):
        serializer = SiteThemeAdminSerializer(
            data={
                "name": "JALALI SIGNATURE",
                "colors": {
                    "primary": "#C99A86",
                    "background": "#0B0B0D",
                    "text": "#F5F1EE",
                },
                "custom_css_variables": {},
                "assets": {},
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_unknown_color_key_is_rejected(self):
        serializer = SiteThemeAdminSerializer(
            data={
                "name": "تم آزمایشی",
                "colors": {
                    "unknownColor": "#FFFFFF",
                },
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("colors", serializer.errors)

    def test_unknown_css_variable_is_rejected(self):
        serializer = SiteThemeAdminSerializer(
            data={
                "name": "تم آزمایشی",
                "custom_css_variables": {
                    "--unsafe-variable": "100px",
                },
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("custom_css_variables", serializer.errors)


class SitePageSectionTests(TestCase):

    def test_supported_section_type_is_accepted(self):
        serializer = SitePageSectionAdminSerializer(
            data={
                "page_key": "home",
                "section_key": "main-hero",
                "section_type": "hero",
                "title": "بخش اصلی صفحه",
                "content": {
                    "heading": "JALALI COSMETICS",
                    "description": "BEAUTY. BUSINESS. TRUST.",
                },
                "settings": {
                    "visible": True,
                },
                "sort_order": 1,
                "is_enabled": True,
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_unsupported_section_type_is_rejected(self):
        serializer = SitePageSectionAdminSerializer(
            data={
                "page_key": "home",
                "section_key": "unknown-section",
                "section_type": "unsupported_widget",
                "content": {},
                "settings": {},
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("section_type", serializer.errors)

    def test_duplicate_page_section_key_is_rejected_by_database(self):
        SitePageSection.objects.create(
            page_key="home",
            section_key="hero",
            section_type="hero",
        )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                SitePageSection.objects.create(
                    page_key="home",
                    section_key="hero",
                    section_type="banner",
                )


class SiteNavigationTests(TestCase):

    def test_internal_navigation_path_is_accepted(self):
        serializer = SiteNavigationLinkAdminSerializer(
            data={
                "label": "محصولات",
                "url": "/products",
                "placement": "header",
                "is_enabled": True,
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_https_navigation_url_is_accepted(self):
        serializer = SiteNavigationLinkAdminSerializer(
            data={
                "label": "وب‌سایت رسمی",
                "url": "https://example.com",
                "placement": "footer",
                "is_enabled": True,
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_javascript_navigation_url_is_rejected(self):
        serializer = SiteNavigationLinkAdminSerializer(
            data={
                "label": "لینک نامعتبر",
                "url": "javascript:alert(1)",
                "placement": "header",
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("url", serializer.errors)

    def test_protocol_relative_url_is_rejected(self):
        serializer = SiteNavigationLinkAdminSerializer(
            data={
                "label": "لینک نامعتبر",
                "url": "//example.com",
                "placement": "header",
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("url", serializer.errors)


class SiteManagementAdminTests(TestCase):

    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            username="jalali_test_admin",
            email="admin@example.com",
            password="Test-Only-Password-9381",
        )

    def test_admin_user_is_created(self):
        self.assertTrue(self.admin_user.is_staff)
        self.assertTrue(self.admin_user.is_superuser)

    def test_theme_update_tracks_admin_user(self):
        theme = SiteTheme.objects.create(
            name="JALALI ADMIN THEME",
            is_active=False,
        )

        theme.updated_by = self.admin_user
        theme.save()
        theme.refresh_from_db()

        self.assertEqual(
            theme.updated_by_id,
            self.admin_user.pk,
        )

    def test_navigation_update_tracks_admin_user(self):
        link = SiteNavigationLink.objects.create(
            label="محصولات",
            url="/products",
            placement=SiteNavigationLink.Placement.HEADER,
            updated_by=self.admin_user,
        )

        link.refresh_from_db()

        self.assertEqual(
            link.updated_by_id,
            self.admin_user.pk,
        )
