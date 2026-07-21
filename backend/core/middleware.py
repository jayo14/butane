"""Middleware: request logging, correlation IDs, and database retry."""
from __future__ import annotations

import logging
import time
import uuid

from django.db import connection
from django.db.utils import OperationalError
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger("butane.request")

# Maximum number of times to retry a request that fails with a transient
# database error (e.g. connection closed by pooler).  The first attempt
# counts as one, so a value of 2 means one retry.
_DB_RETRIES = 2


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


class DatabaseRetryMiddleware:
    """Retry the entire request once on transient database errors.

    Catches ``django.db.utils.OperationalError`` (closed / broken connections
    from poolers, timeouts, etc.), forces Django to open a fresh connection,
    and retries the request body one time.  Logs the retry so operators can
    spot persistent problems.
    """

    RETRYABLE_MESSAGES = (
        "server closed the connection unexpectedly",
        "connection was closed",
        "connection already closed",
        "terminating connection due to administrator command",
        "remaining connection slots are reserved",
        "failed to connect",
        "could not connect to server",
        "timeout expired",
        "SSL SYSCALL error: EOF detected",
    )

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self._process_with_retry(request, attempt=0)

    def _process_with_retry(self, request, attempt: int):
        try:
            return self.get_response(request)
        except OperationalError as exc:
            if attempt + 1 >= _DB_RETRIES:
                raise
            msg = str(exc).lower()
            if not any(pat in msg for pat in self.RETRYABLE_MESSAGES):
                raise
            logger.warning(
                "DB retry #%d for %s %s: %s",
                attempt + 1,
                request.method,
                request.path,
                exc,
            )
            connection.close()
            return self._process_with_retry(request, attempt=attempt + 1)