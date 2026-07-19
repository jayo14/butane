"""Rate limiting utilities for the API."""
from __future__ import annotations

import hashlib
import time
from collections import defaultdict

from django.core.cache import cache
from rest_framework.exceptions import Throttled


class AttemptRateThrottle:
    """Simple rate limiter based on client IP + action."""

    cache_format = "throttle_%(scope)s_%(ident)s"
    max_attempts = 5
    window = 60

    def __init__(self, scope: str = "default", max_attempts: int | None = None, window: int | None = None):
        self.scope = scope
        self.max_attempts = max_attempts or self.max_attempts
        self.window = window or self.window

    def get_cache_key(self, request, view) -> str:
        ident = hashlib.md5(
            f"{self.scope}:{self._get_client_ip(request)}".encode("utf-8")
        ).hexdigest()
        return self.cache_format % {"scope": self.scope, "ident": ident}

    def _get_client_ip(self, request) -> str:
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR", "")

    def allow_request(self, request, view) -> bool:
        cache_key = self.get_cache_key(request, view)
        history = cache.get(cache_key, [])
        now = time.time()
        history = [ts for ts in history if now - ts < self.window]
        if len(history) >= self.max_attempts:
            return False
        history.append(now)
        cache.set(cache_key, history, self.window)
        return True

    def wait(self) -> float:
        return self.window


class LoginRateThrottle(AttemptRateThrottle):
    scope = "login"
    max_attempts = 10
    window = 60