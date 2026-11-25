
from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import StoreConfiguration
from .serializers import (
    StoreConfigurationSerializer,
    StoreConfigurationAdminSerializer,
)


def get_store_configuration():
    """
    Retrieve the single store configuration.
    Create the initial record when it does not exist.
    """
    defaults = {
        "store_name": getattr(
            settings, "STORE_NAME", "پخش جلالی"
        ),
        "slogan": getattr(
            settings, "STORE_SLOGAN",
            "BEAUTY. BUSINESS. TRUST."
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
    """
    Public read-only store configuration endpoint.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        configuration = get_store_configuration()

        serializer = StoreConfigurationSerializer(
            configuration
        )

        return Response(
            {
                "success": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class StoreConfigurationAdminView(APIView):
    """
    Administrative configuration endpoint.

    Only authenticated staff users can access this endpoint.
    """

    permission_classes = [IsAdminUser]

    def get(self, request):
        configuration = get_store_configuration()

        serializer = StoreConfigurationAdminSerializer(
            configuration
        )

        return Response(
            {
                "success": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request):
        configuration = get_store_configuration()

        serializer = StoreConfigurationAdminSerializer(
            configuration,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)

        updated_configuration = serializer.save(
            updated_by=request.user
        )

        response_serializer = (
            StoreConfigurationAdminSerializer(
                updated_configuration
            )
        )

        return Response(
            {
                "success": True,
                "message": "تنظیمات فروشگاه با موفقیت به‌روزرسانی شد.",
                "data": response_serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def put(self, request):
        configuration = get_store_configuration()

        serializer = StoreConfigurationAdminSerializer(
            configuration,
            data=request.data,
            partial=False,
        )

        serializer.is_valid(raise_exception=True)

        updated_configuration = serializer.save(
            updated_by=request.user
        )

        response_serializer = (
            StoreConfigurationAdminSerializer(
                updated_configuration
            )
        )

        return Response(
            {
                "success": True,
                "message": "تنظیمات فروشگاه جایگزین شد.",
                "data": response_serializer.data,
            },
            status=status.HTTP_200_OK,
        )
