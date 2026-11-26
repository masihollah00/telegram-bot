
from django.conf import settings
from django.db import transaction
from django.db.models import Max
from django.shortcuts import get_object_or_404

from rest_framework import status, filters, viewsets
from rest_framework.parsers import (
    JSONParser,
    FormParser,
    MultiPartParser,
)
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    StoreConfiguration,
    SiteTheme,
    SiteAsset,
    SitePageSection,
    SiteNavigationLink,
)

from .serializers import (
    StoreConfigurationSerializer,
    StoreConfigurationAdminSerializer,
    SiteThemeSerializer,
    SiteThemeAdminSerializer,
    SiteAssetSerializer,
    SiteAssetAdminSerializer,
    SitePageSectionSerializer,
    SitePageSectionAdminSerializer,
    SiteNavigationLinkSerializer,
    SiteNavigationLinkAdminSerializer,
)

from apps.products.models import (
    Product,
    ProductImage,
    ProductCategory,
    ProductBrand,
)


def get_store_configuration():
    """دریافت تنظیمات اصلی فروشگاه."""

    defaults = {
        "store_name": getattr(
            settings,
            "STORE_NAME",
            "JALALI COSMETICS",
        ),
        "slogan": getattr(
            settings,
            "STORE_SLOGAN",
            "BEAUTY. BUSINESS. TRUST.",
        ),
        "currency": "IRR",
        "display_currency": "تومان",
    }

    configuration, created = (
        StoreConfiguration.objects.get_or_create(
            pk=1,
            defaults=defaults,
        )
    )

    return configuration


class StoreConfigurationPublicView(APIView):
    """اطلاعات عمومی فروشگاه."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        configuration = get_store_configuration()

        serializer = StoreConfigurationSerializer(
            configuration,
        )

        return Response({
            "success": True,
            "data": serializer.data,
        })


class StoreConfigurationAdminView(APIView):
    """مدیریت تنظیمات فروشگاه."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        configuration = get_store_configuration()

        serializer = StoreConfigurationAdminSerializer(
            configuration,
        )

        return Response({
            "success": True,
            "data": serializer.data,
        })

    def patch(self, request):
        configuration = get_store_configuration()

        serializer = StoreConfigurationAdminSerializer(
            configuration,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)

        configuration = serializer.save(
            updated_by=request.user,
        )

        return Response({
            "success": True,
            "message": "تنظیمات فروشگاه ذخیره شد.",
            "data": StoreConfigurationAdminSerializer(
                configuration,
            ).data,
        })

    def put(self, request):
        configuration = get_store_configuration()

        serializer = StoreConfigurationAdminSerializer(
            configuration,
            data=request.data,
        )

        serializer.is_valid(raise_exception=True)

        configuration = serializer.save(
            updated_by=request.user,
        )

        return Response({
            "success": True,
            "message": "تنظیمات فروشگاه به‌روزرسانی شد.",
            "data": StoreConfigurationAdminSerializer(
                configuration,
            ).data,
        })


class ActiveSiteThemeView(APIView):
    """دریافت تم فعال سایت برای نمایش عمومی."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        theme = SiteTheme.objects.filter(
            is_active=True,
        ).first()

        if not theme:
            return Response({
                "success": True,
                "data": None,
                "message": "هنوز تم فعالی ثبت نشده است.",
            })

        return Response({
            "success": True,
            "data": SiteThemeSerializer(
                theme,
                context={"request": request},
            ).data,
        })


class PublicSiteSectionsView(APIView):
    """دریافت بخش‌های فعال یک صفحه."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        page_key = request.query_params.get("page")

        if not page_key:
            return Response({
                "success": False,
                "message": "شناسه صفحه الزامی است.",
            }, status=status.HTTP_400_BAD_REQUEST)

        sections = SitePageSection.objects.filter(
            page_key=page_key,
            is_enabled=True,
        ).order_by("sort_order", "id")

        serializer = SitePageSectionSerializer(
            sections,
            many=True,
        )

        return Response({
            "success": True,
            "page": page_key,
            "data": serializer.data,
        })


class PublicNavigationView(APIView):
    """دریافت لینک‌های فعال منو و پاورقی."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        placement = request.query_params.get("placement")

        links = SiteNavigationLink.objects.filter(
            is_enabled=True,
        )

        if placement:
            links = links.filter(
                placement=placement,
            )

        serializer = SiteNavigationLinkSerializer(
            links,
            many=True,
        )

        return Response({
            "success": True,
            "data": serializer.data,
        })


class AdminBaseViewSet(viewsets.ModelViewSet):
    """پایه مشترک مدیریت با دسترسی مدیر."""

    permission_classes = [IsAdminUser]

    parser_classes = [
        JSONParser,
        FormParser,
        MultiPartParser,
    ]

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    ordering = ["-pk"]


class AdminSiteThemeViewSet(AdminBaseViewSet):
    """مدیریت تم‌های سایت."""

    queryset = SiteTheme.objects.all()

    serializer_class = SiteThemeAdminSerializer

    search_fields = ["name"]

    ordering_fields = [
        "name",
        "updated_at",
    ]

    def perform_create(self, serializer):
        serializer.save(
            updated_by=self.request.user,
        )

    def perform_update(self, serializer):
        serializer.save(
            updated_by=self.request.user,
        )


class AdminSiteAssetViewSet(AdminBaseViewSet):
    """مدیریت گالری مرکزی تصاویر و فایل‌ها."""

    queryset = SiteAsset.objects.all()

    serializer_class = SiteAssetAdminSerializer

    search_fields = [
        "title",
        "alt_text",
        "description",
    ]

    ordering_fields = [
        "uploaded_at",
        "title",
        "asset_type",
    ]

    def get_queryset(self):
        queryset = super().get_queryset()

        asset_type = self.request.query_params.get(
            "type",
        )

        active = self.request.query_params.get(
            "active",
        )

        if asset_type:
            queryset = queryset.filter(
                asset_type=asset_type,
            )

        if active in ("true", "1"):
            queryset = queryset.filter(
                is_active=True,
            )

        elif active in ("false", "0"):
            queryset = queryset.filter(
                is_active=False,
            )

        return queryset

    def perform_create(self, serializer):
        serializer.save(
            uploaded_by=self.request.user,
        )


class AdminSitePageSectionViewSet(AdminBaseViewSet):
    """مدیریت بخش‌های قابل ویرایش صفحات."""

    queryset = SitePageSection.objects.all()

    serializer_class = SitePageSectionAdminSerializer

    search_fields = [
        "page_key",
        "section_key",
        "title",
        "section_type",
    ]

    ordering_fields = [
        "page_key",
        "sort_order",
        "updated_at",
    ]

    def get_queryset(self):
        queryset = super().get_queryset()

        page = self.request.query_params.get("page")

        if page:
            queryset = queryset.filter(
                page_key=page,
            )

        return queryset

    def perform_create(self, serializer):
        serializer.save(
            updated_by=self.request.user,
        )

    def perform_update(self, serializer):
        serializer.save(
            updated_by=self.request.user,
        )


class AdminSiteNavigationViewSet(AdminBaseViewSet):
    """مدیریت لینک‌های هدر، فوتر و موبایل."""

    queryset = SiteNavigationLink.objects.all()

    serializer_class = SiteNavigationLinkAdminSerializer

    search_fields = [
        "label",
        "url",
        "placement",
    ]

    ordering_fields = [
        "label",
        "placement",
        "sort_order",
        "updated_at",
    ]

    def get_queryset(self):
        queryset = super().get_queryset()

        placement = self.request.query_params.get(
            "placement",
        )

        if placement:
            queryset = queryset.filter(
                placement=placement,
            )

        return queryset

    def perform_create(self, serializer):
        serializer.save(
            updated_by=self.request.user,
        )

    def perform_update(self, serializer):
        serializer.save(
            updated_by=self.request.user,
        )


class AssignGalleryAssetView(APIView):
    """
    اتصال یک تصویر ذخیره‌شده در گالری به بخش‌های مختلف فروشگاه.

    target_type:
        product_main
        product_gallery
        category
        brand
    """

    permission_classes = [IsAdminUser]

    TARGET_TYPES = {
        "product_main",
        "product_gallery",
        "category",
        "brand",
    }

    def post(self, request):
        asset_id = request.data.get("asset_id")
        target_type = request.data.get("target_type")
        target_id = request.data.get("target_id")

        if not asset_id or not target_type or not target_id:
            return Response({
                "success": False,
                "message": (
                    "تصویر، نوع مقصد و شناسه مقصد الزامی هستند."
                ),
            }, status=status.HTTP_400_BAD_REQUEST)

        if target_type not in self.TARGET_TYPES:
            return Response({
                "success": False,
                "message": "نوع مقصد معتبر نیست.",
            }, status=status.HTTP_400_BAD_REQUEST)

        asset = get_object_or_404(
            SiteAsset,
            pk=asset_id,
            is_active=True,
        )

        if not asset.file:
            return Response({
                "success": False,
                "message": "فایل انتخاب‌شده وجود ندارد.",
            }, status=status.HTTP_400_BAD_REQUEST)

        if asset.asset_type not in (
            SiteAsset.AssetType.IMAGE,
            SiteAsset.AssetType.BANNER,
            SiteAsset.AssetType.LOGO,
        ):
            return Response({
                "success": False,
                "message": (
                    "این نوع فایل برای تصویر محصول یا دسته‌بندی "
                    "قابل استفاده نیست."
                ),
            }, status=status.HTTP_400_BAD_REQUEST)

        file_name = asset.file.name

        with transaction.atomic():

            if target_type == "product_main":
                product = get_object_or_404(
                    Product.objects.select_for_update(),
                    pk=target_id,
                )

                product.image = file_name
                product.save(update_fields=[
                    "image",
                    "updated_at",
                ])

                result = {
                    "target": "product_main",
                    "product_id": str(product.pk),
                }

            elif target_type == "product_gallery":
                product = get_object_or_404(
                    Product.objects.select_for_update(),
                    pk=target_id,
                )

                gallery = ProductImage.objects.filter(
                    product=product,
                )

                next_order = (
                    gallery.aggregate(
                        maximum=Max("sort_order"),
                    )["maximum"] or 0
                ) + 1

                set_primary = str(
                    request.data.get("set_primary", "false")
                ).lower() in ("true", "1", "yes")

                if set_primary:
                    gallery.update(is_primary=False)

                image = ProductImage.objects.create(
                    product=product,
                    image=file_name,
                    alt_text=(
                        request.data.get("alt_text")
                        or asset.alt_text
                        or product.name
                    ),
                    sort_order=next_order,
                    is_primary=set_primary,
                )

                result = {
                    "target": "product_gallery",
                    "product_id": str(product.pk),
                    "image_id": image.pk,
                    "is_primary": image.is_primary,
                }

            elif target_type == "category":
                category = get_object_or_404(
                    ProductCategory.objects.select_for_update(),
                    pk=target_id,
                )

                category.image = file_name
                category.save(update_fields=[
                    "image",
                    "updated_at",
                ])

                result = {
                    "target": "category",
                    "category_id": category.pk,
                }

            else:
                brand = get_object_or_404(
                    ProductBrand.objects.select_for_update(),
                    pk=target_id,
                )

                brand.logo = file_name
                brand.save(update_fields=["logo"])

                result = {
                    "target": "brand",
                    "brand_id": brand.pk,
                }

        return Response({
            "success": True,
            "message": "تصویر گالری با موفقیت متصل شد.",
            "data": {
                **result,
                "asset_id": asset.pk,
                "file_url": request.build_absolute_uri(
                    asset.file.url,
                ),
            },
        }, status=status.HTTP_200_OK)
