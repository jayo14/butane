"""Celery tasks for creating in-app notifications."""
from __future__ import annotations

from celery import shared_task


@shared_task
def create_notification(recipient_id: str, message: str, school_id: str, link: str = "") -> None:
    from .models import Notification

    Notification.objects.create(
        recipient_id=recipient_id,
        message=message,
        school_id=school_id,
        link=link,
    )


@shared_task
def notify_report_card_approved(report_card_id: str) -> None:
    from academics.models import ReportCard

    report = ReportCard.objects.select_related("student__user", "school").get(pk=report_card_id)
    student_user = report.student.user
    create_notification(
        recipient_id=str(student_user.id),
        message=f"Your report card for {report.term.name} has been approved.",
        school_id=str(report.school_id),
        link=f"/dashboard/report-cards/{report_card_id}",
    )


@shared_task
def notify_invitation_accepted(invitation_id: str) -> None:
    from accounts.models import Invitation

    invitation = Invitation.objects.select_related("school", "invited_by").get(pk=invitation_id)
    if invitation.invited_by:
        create_notification(
            recipient_id=str(invitation.invited_by.id),
            message=f"{invitation.email} has accepted their invitation to {invitation.school.name}.",
            school_id=str(invitation.school_id),
            link="/dashboard/settings",
        )
