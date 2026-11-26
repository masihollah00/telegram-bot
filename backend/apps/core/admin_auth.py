
import json

from django.contrib.auth import authenticate, login, logout
from django.core.cache import cache
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST


LOGIN_LIMIT = 10
LOGIN_WINDOW = 60 * 60


def json_error(message, status=400):
    return JsonResponse(
        {
            "success": False,
            "message": message,
        },
        status=status,
    )


def get_client_ip(request):
    # از هدرهای قابل جعل برای تشخیص IP استفاده نمی‌کنیم.
    return request.META.get("REMOTE_ADDR", "unknown")


@require_GET
@ensure_csrf_cookie
def admin_csrf(request):
    """
    دریافت CSRF token برای درخواست‌های مدیریتی.
    """
    return JsonResponse({
        "success": True,
        "csrfToken": get_token(request),
    })


@require_POST
@csrf_protect
def admin_login(request):
    """
    ورود مدیر با حساب کاربری واقعی Django.
    فقط کاربران فعال و دارای دسترسی staff پذیرفته می‌شوند.
    """

    ip = get_client_ip(request)
    cache_key = f"jalali_admin_login:{ip}"

    attempts = cache.get(cache_key, 0)

    if attempts >= LOGIN_LIMIT:
        return json_error(
            "تعداد تلاش‌های ورود بیش از حد مجاز است. بعداً دوباره تلاش کن.",
            429,
        )

    try:
        data = json.loads(request.body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return json_error("اطلاعات ارسالی معتبر نیست.")

    username = str(data.get("username", "")).strip()
    password = data.get("password", "")

    if not username or not isinstance(password, str) or not password:
        return json_error("نام کاربری و رمز عبور الزامی هستند.")

    user = authenticate(
        request,
        username=username,
        password=password,
    )

    if user is None or not user.is_active or not user.is_staff:
        if attempts == 0:
            cache.set(cache_key, 1, LOGIN_WINDOW)
        else:
            cache.incr(cache_key)

        return json_error(
            "اطلاعات ورود معتبر نیست یا حساب دسترسی مدیریتی ندارد.",
            401,
        )

    # نشست قبلی را تعویض می‌کنیم تا نشست تازه ایجاد شود.
    login(request, user)

    cache.delete(cache_key)

    return JsonResponse({
        "success": True,
        "message": "ورود مدیر با موفقیت انجام شد.",
        "user": {
            "id": user.pk,
            "username": user.get_username(),
            "isStaff": user.is_staff,
            "isSuperuser": user.is_superuser,
        },
    })


@require_GET
def admin_me(request):
    """
    بررسی نشست فعلی مدیر.
    """

    user = request.user

    if not user.is_authenticated:
        return json_error("نشست مدیریتی فعال نیست.", 401)

    if not user.is_active or not user.is_staff:
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
    """
    خروج امن از حساب مدیر.
    """

    if not request.user.is_authenticated:
        return json_error("نشست فعالی وجود ندارد.", 401)

    logout(request)

    return JsonResponse({
        "success": True,
        "message": "از پنل مدیریت خارج شدی.",
    })
