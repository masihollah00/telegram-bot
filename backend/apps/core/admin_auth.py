
import json
import os
import hmac
import logging

from django.contrib.auth import login, logout, get_user_model
from django.core.cache import cache
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST


logger = logging.getLogger(__name__)

LOGIN_LIMIT = 5
LOGIN_WINDOW = 60 * 60


def json_error(message, status=400):
    return JsonResponse({
        "success": False,
        "message": message,
    }, status=status)


def get_client_ip(request):
    return request.META.get("REMOTE_ADDR", "unknown")


def get_login_cache_key(request):
    return f"jalali_owner_login:{get_client_ip(request)}"


def get_owner_user():
    User = get_user_model()

    owners = User.objects.filter(
        is_active=True,
        is_staff=True,
        is_superuser=True,
    ).order_by("pk")

    if owners.count() != 1:
        return None

    return owners.first()


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
    ورود اختصاصی مدیر اصلی JALALI.

    رمز عبور فقط از متغیر محیطی سرور خوانده می‌شود.
    رمز در کد فرانت‌اند یا مخزن GitHub قرار نمی‌گیرد.
    """

    cache_key = get_login_cache_key(request)
    attempts = cache.get(cache_key, 0)

    if attempts >= LOGIN_LIMIT:
        return json_error(
            "تعداد تلاش‌های ورود بیش از حد مجاز است. بعداً دوباره تلاش کنید.",
            429,
        )

    try:
        data = json.loads(request.body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return json_error(
            "اطلاعات ارسال‌شده معتبر نیست."
        )

    password = str(data.get("password", ""))

    if not password or len(password) > 256:
        return json_error(
            "رمز عبور را به‌درستی وارد کنید."
        )

    expected_password = os.environ.get(
        "JALALI_ADMIN_PASSWORD",
        "",
    )

    if not expected_password:
        logger.error(
            "JALALI_ADMIN_PASSWORD is not configured."
        )

        return json_error(
            "تنظیم امنیتی ورود مدیر هنوز در سرور انجام نشده است.",
            503,
        )

    if not hmac.compare_digest(
        password.encode("utf-8"),
        expected_password.encode("utf-8"),
    ):
        cache.set(
            cache_key,
            attempts + 1,
            LOGIN_WINDOW,
        )

        return json_error(
            "رمز عبور صحیح نیست.",
            401,
        )

    owner = get_owner_user()

    if owner is None:
        logger.error(
            "Exactly one active Django superuser is required."
        )

        return json_error(
            "حساب مدیر اصلی به‌درستی در سرور تنظیم نشده است.",
            503,
        )

    login(
        request,
        owner,
        backend="django.contrib.auth.backends.ModelBackend",
    )

    request.session.cycle_key()

    cache.delete(cache_key)

    return JsonResponse({
        "success": True,
        "message": "ورود مدیر اصلی تأیید شد.",
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
        return json_error(
            "نشست مدیریتی فعال نیست.",
            401,
        )

    if (
        not user.is_active
        or not user.is_staff
        or not user.is_superuser
    ):
        logout(request)

        return json_error(
            "دسترسی مدیریتی معتبر نیست.",
            403,
        )

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
        return json_error(
            "نشست فعالی وجود ندارد.",
            401,
        )

    logout(request)

    return JsonResponse({
        "success": True,
        "message": "از پنل مدیریت خارج شدید.",
    })
