"""Seed default academic session + 3 terms for one or all schools."""
from __future__ import annotations

from datetime import date

from django.core.management.base import BaseCommand

from academics.models import AcademicSession
from exams.models import _DEFAULT_TERMS, Term
from schools.models import School


class Command(BaseCommand):
    help = (
        "Create a default academic session and 3 terms (First, Second, Third) "
        "for schools that don't have one yet."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--school",
            type=str,
            help="Slug or ID of a specific school. Omit to seed all schools.",
        )
        parser.add_argument(
            "--session",
            type=str,
            default="2025/2026",
            help="Session name (default: 2025/2026).",
        )
        parser.add_argument(
            "--start",
            type=str,
            default=str(date.today().replace(month=9, day=1)),
            help="Session start date (ISO format, default: 2025-09-01 or Sep 1 this year).",
        )
        parser.add_argument(
            "--end",
            type=str,
            default=str(date.today().replace(month=8, day=31).replace(year=date.today().year + 1)),
            help="Session end date (ISO format, default: Aug 31 next year).",
        )

    def handle(self, *args, **options):  # noqa: ARG002
        schools = School.objects.filter(status="active")
        if options["school"]:
            schools = schools.filter(slug=options["school"])

        if not schools:
            self.stdout.write(self.style.WARNING("No active schools found."))
            return

        session_name = options["session"]
        start_date = date.fromisoformat(options["start"])
        end_date = date.fromisoformat(options["end"])

        for school in schools:
            session, created = AcademicSession.objects.get_or_create(
                name=session_name,
                school=school,
                defaults={
                    "start_date": start_date,
                    "end_date": end_date,
                    "is_current": True,
                },
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"  ✓ Created session {session_name} for {school.name}"))
            else:
                self.stdout.write(f"  - Session {session_name} already exists for {school.name}")

            for name, order in _DEFAULT_TERMS:
                _, term_created = Term.objects.get_or_create(
                    name=name,
                    session=session,
                    defaults={"display_order": order},
                )
                if term_created:
                    self.stdout.write(self.style.SUCCESS(f"    ✓ Created {name}"))
                else:
                    self.stdout.write(f"    - {name} already exists")

            if not school.onboarding_completed:
                school.onboarding_completed = True
                school.save(update_fields=["onboarding_completed"])
                self.stdout.write(self.style.SUCCESS(f"  ✓ Marked onboarding completed for {school.name}"))

        self.stdout.write(self.style.SUCCESS("\nDone."))