
import json
import re

from django.contrib.auth import login, logout
from django.core.cache import cache
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST

from django.contrib.auth import get_user_model

from .models import StoreConfiguration


LOGIN_LIMIT = 5
LOGIN_WINDOW = 60 * 60


def json_error(message, status=400):
    return JsonResponse({
        "success": False,
        "message": message,
    }, status=status)


def get_client_ip(request):
    return request.META.get("REMOTE_ADDR", "unknown")


def normalize_phone(value):
    value = str(value or "").strip()

    persian = "۰۱۲۳۴۵۶۷۸۹"
    arabic = "٠١٢٣٤٥٦٧٨٩"

    for index, digit in enumerate(persian):
        value = value.replace(digit, str(index))

    for index, digit in enumerate(arabic):
        value = value.replace(digit, str(index))

    value = re.sub(r"[\s\-()]", "", value)

    if value.startswith("+98"):
        value = "0" + value[3:]
    elif value.startswith("0098"):
        value = "0" + value[4:]

    return value


@require_GET
@ensure_csrf_cookie
def admin_csrf(request):
    return JsonResponse({
        "success": True,
        "csrfToken": get_token(request),
    })


@require_POST
@csrf_protect
def admin_login(request):
    """
    ورود مالک با شماره ثبت‌شده فروشنده.
    شماره فقط در سرور بررسی می‌شود.
    """

    ip = get_client_ip(request)
    cache_key = f"jalali_owner_login:{ip}"

    attempts = cache.get(cache_key, 0)

    if attempts >= LOGIN_LIMIT:
        return json_error(
            "تعداد تلاش‌ها بیش از حد مجاز است. بعداً دوباره تلاش کنید.",
            429,
        )

    try:
        data = json.loads(request.body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return json_error("اطلاعات واردشده معتبر نیست.")

    phone = normalize_phone(data.get("phone", ""))

    if not re.fullmatch(r"09\d{9}", phone):
        return json_error("شماره موبایل معتبر نیست.")

    try:
        configuration = StoreConfiguration.objects.get(pk=1)
    except StoreConfiguration.DoesNotExist:
        return json_error(
            "تنظیمات مالک فروشگاه هنوز ثبت نشده است.",
            503,
        )

    owner_phone = normalize_phone(configuration.seller_phone)

    if not owner_phone or phone != owner_phone:
        cache.set(
            cache_key,
            attempts + 1,
            LOGIN_WINDOW,
        )

        return json_error(
            "این شماره اجازه ورود به مدیریت را ندارد.",
            401,
        )

    User = get_user_model()

    owner_users = User.objects.filter(
        is_active=True,
        is_staff=True,
        is_superuser=True,
    ).order_by("pk")

    owner = owner_users.first()

    if owner is None:
        return json_error(
            "حساب مدیر اصلی هنوز در سامانه ایجاد نشده است.",
            503,
        )

    if owner_users.count() > 1:
        return json_error(
            "بیش از یک حساب مدیر اصلی وجود دارد؛ ابتدا حساب مالک را مشخص کنید.",
            503,
        )

    login(request, owner)

    cache.delete(cache_key)

    return JsonResponse({
        "success": True,
        "message": "ورود به پنل مدیریت انجام شد.",
        "user": {
            "id": owner.pk,
            "username": owner.get_username(),
            "isStaff": owner.is_staff,
            "isSuperuser": owner.is_superuser,
        },
    })


@require_GET
def admin_me(request):
    user = request.user

    if not user.is_authenticated:
        return json_error("نشست مدیریتی فعال نیست.", 401)

    if not user.is_active or not user.is_staff or not user.is_superuser:
        logout(request)
        return json_error("دسترسی مدیریتی معتبر نیست.", 403)

    return JsonResponse({
        "success": True,
        "user": {
            "id": user.pk,
            "username": user.get_username(),
            "isStaff": user.is_staff,
            "isSuperuser": user.is_superuser,
        },
    })


@require_POST
@csrf_protect
def admin_logout(request):
    if not request.user.is_authenticated:
        return json_error("نشست فعالی وجود ندارد.", 401)

    logout(request)

    return JsonResponse({
        "success": True,
        "message": "از پنل مدیریت خارج شدید.",
    })
