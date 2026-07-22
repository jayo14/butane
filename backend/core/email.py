"""Thin wrapper around Django's email backend for transactional mail."""
from __future__ import annotations

from django.conf import settings
from django.core.mail import EmailMessage
from django.template.loader import render_to_string


class EmailService:
    """Send plain-text or HTML emails using Django's SMTP/console backend."""

    @staticmethod
    def send(
        subject: str,
        body: str,
        to: list[str],
        from_email: str | None = None,
        html_message: str | None = None,
    ) -> None:
        if from_email is None:
            from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@example.com")
        message = EmailMessage(
            subject=subject,
            body=body,
            from_email=from_email,
            to=to,
        )
        if html_message:
            message.content_subtype = "html"
            message.body = html_message
        message.send(fail_silently=False)
