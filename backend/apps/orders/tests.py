
import uuid

from django.test import SimpleTestCase

from rest_framework.exceptions import ValidationError

from .serializers import (
    OrderCreateSerializer,
    OrderCreateItemSerializer,
)


class OrderCreateSerializerTests(SimpleTestCase):

    def get_valid_payload(self):
        return {
            "customer_name": "مشتری آزمایشی",
            "customer_phone": "09123456789",
            "customer_email": "test@example.com",
            "province": "تهران",
            "city": "تهران",
            "postal_code": "1234567890",
            "shipping_address": "نشانی آزمایشی",
            "customer_note": "",
            "items": [
                {
                    "product_id": str(uuid.uuid4()),
                    "quantity": 2,
                }
            ],
        }

    def test_valid_phone_is_accepted(self):
        serializer = OrderCreateSerializer(
            data=self.get_valid_payload()
        )

        self.assertTrue(
            serializer.is_valid(),
            serializer.errors,
        )

    def test_phone_with_letters_is_rejected(self):
        payload = self.get_valid_payload()
        payload["customer_phone"] = "09123ABC789"

        serializer = OrderCreateSerializer(data=payload)

        self.assertFalse(serializer.is_valid())
        self.assertIn(
            "customer_phone",
            serializer.errors,
        )

    def test_phone_with_invalid_length_is_rejected(self):
        payload = self.get_valid_payload()
        payload["customer_phone"] = "123"

        serializer = OrderCreateSerializer(data=payload)

        self.assertFalse(serializer.is_valid())
        self.assertIn(
            "customer_phone",
            serializer.errors,
        )

    def test_duplicate_products_are_rejected(self):
        product_id = str(uuid.uuid4())

        payload = self.get_valid_payload()
        payload["items"] = [
            {
                "product_id": product_id,
                "quantity": 2,
            },
            {
                "product_id": product_id,
                "quantity": 4,
            },
        ]

        serializer = OrderCreateSerializer(data=payload)

        self.assertFalse(serializer.is_valid())
        self.assertIn(
            "items",
            serializer.errors,
        )

    def test_empty_items_are_rejected(self):
        payload = self.get_valid_payload()
        payload["items"] = []

        serializer = OrderCreateSerializer(data=payload)

        self.assertFalse(serializer.is_valid())
        self.assertIn(
            "items",
            serializer.errors,
        )


class OrderCreateItemSerializerTests(SimpleTestCase):

    def test_zero_quantity_is_rejected(self):
        serializer = OrderCreateItemSerializer(
            data={
                "product_id": str(uuid.uuid4()),
                "quantity": 0,
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn(
            "quantity",
            serializer.errors,
        )

    def test_positive_quantity_is_accepted(self):
        serializer = OrderCreateItemSerializer(
            data={
                "product_id": str(uuid.uuid4()),
                "quantity": 3,
            }
        )

        self.assertTrue(
            serializer.is_valid(),
            serializer.errors,
        )
