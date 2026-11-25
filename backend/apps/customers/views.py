
from django.shortcuts import get_object_or_404

from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    CustomerProfile,
    CustomerAddress,
    PartnerApplication,
)

from .serializers import (
    CustomerProfileSerializer,
    CustomerAddressSerializer,
    PartnerApplicationSerializer,
)


class CustomerProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, created = CustomerProfile.objects.get_or_create(
            user=request.user,
        )

        serializer = CustomerProfileSerializer(profile)

        return Response({
            "success": True,
            "data": serializer.data,
        })


class CustomerAddressListCreateView(generics.ListCreateAPIView):
    serializer_class = CustomerAddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CustomerAddress.objects.filter(
            customer=self.request.user
        ).order_by("-is_default", "-created_at")

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)


class CustomerAddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CustomerAddressSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        return CustomerAddress.objects.filter(
            customer=self.request.user
        )


class PartnerApplicationListCreateView(generics.ListCreateAPIView):
    serializer_class = PartnerApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PartnerApplication.objects.filter(
            customer=self.request.user
        ).order_by("-created_at")
