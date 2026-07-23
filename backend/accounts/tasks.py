"""Celery tasks for the accounts app."""
from __future__ import annotations

from celery import shared_task


@shared_task
def send_invitation_email(
    email: str,
    school_name: str,
    invite_url: str,
) -> None:
    from core.email import EmailService

    EmailService.send(
        subject=f"You've been invited to join {school_name}",
        body=f"Click the link to accept your invitation: {invite_url}",
        to=[email],
        html_message=f"<p>You've been invited to join <strong>{school_name}</strong>.</p>"
                     f"<p><a href='{invite_url}'>Click here to accept your invitation</a></p>",
    )
