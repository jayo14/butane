"""Centralized DRF exception handler returning a consistent error envelope."""
from __future__ import annotations

from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    """Wrap DRF errors in a uniform JSON envelope.

    Success bodies are plain data; failures return::

        {
            "error": {
                "code": "validation_error" | "not_found" | ...,
                "message": "Human readable summary",
                "details": { ...field/detail specific... }
            }
        }
    """
    response = exception_handler(exc, context)

    if response is None:
        return response

    detail = response.data

    if isinstance(detail, dict):
        messages = []
        for value in detail.values():
            if isinstance(value, (list, tuple)):
                messages.extend(str(v) for v in value)
            else:
                messages.append(str(value))
        message = messages[0] if messages else response.status_text
    elif isinstance(detail, (list, tuple)):
        message = "; ".join(str(v) for v in detail)
    else:
        message = str(detail)

    code = getattr(exc, "default_code", "error")
    response.data = {
        "error": {
            "code": code,
            "message": message,
            "details": detail,
        }
    }
    return response
