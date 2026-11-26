
from rest_framework.throttling import SimpleRateThrottle


class AdminUserRateThrottle(SimpleRateThrottle):
    """
    Rate limit for authenticated staff users
    accessing administrative write operations.
    """

    scope = "admin_write"

    def get_cache_key(self, request, view):
        user = getattr(request, "user", None)

        if not user or not user.is_authenticated:
            return None

        if not user.is_staff:
            return None

        return self.cache_format % {
            "scope": self.scope,
            "ident": user.pk,
        }


class AdminUploadRateThrottle(SimpleRateThrottle):
    """
    Separate rate limit for administrative media uploads.
    """

    scope = "admin_upload"

    def get_cache_key(self, request, view):
        user = getattr(request, "user", None)

        if not user or not user.is_authenticated:
            return None

        if not user.is_staff:
            return None

        return self.cache_format % {
            "scope": self.scope,
            "ident": user.pk,
        }


class AdminLoginRateThrottle(SimpleRateThrottle):
    """
    Rate limit administrative login attempts by client IP.
    """

    scope = "admin_login"

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            return None

        ident = self.get_ident(request)

        return self.cache_format % {
            "scope": self.scope,
            "ident": ident,
        }
