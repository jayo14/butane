"""Request logging middleware with correlation IDs."""
from __future__ import annotations

import logging
import time
import uuid

from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger("butane.request")


class RequestLoggingMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request._correlation_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        request._start_time = time.monotonic()

    def process_response(self, request, response):
        correlation_id = getattr(request, "_correlation_id", None)
        if correlation_id:
            response["X-Correlation-ID"] = correlation_id
        duration = time.monotonic() - getattr(request, "_start_time", time.monotonic())
        logger.info(
            "%s %s %s %s",
            request.method,
            request.path,
            response.status_code,
            f"{duration:.3f}s",
            extra={"correlation_id": correlation_id, "duration_ms": duration * 1000},
        )
        return response