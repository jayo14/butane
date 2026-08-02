"""Seed default academic setup for one or all schools."""
from __future__ import annotations

from django.core.management.base import BaseCommand

from academics.services import seed_default_academic_setup
from schools.models import School


class Command(BaseCommand):
    help = (
        "Create a default academic session, 3 terms, and 6 grade levels "
        "(JSS1–SSS3) for schools that don't have them yet."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--school",
            type=str,
            help="Slug or ID of a specific school. Omit to seed all schools.",
        )

    def handle(self, *args, **options):  # noqa: ARG002
        schools = School.objects.filter(status="active")
        if options["school"]:
            schools = schools.filter(slug=options["school"])

        if not schools:
            self.stdout.write(self.style.WARNING("No active schools found."))
            return

        for school in schools:
            result = seed_default_academic_setup(school)
            self.stdout.write(self.style.SUCCESS(
                f"  Seeded {school.name}: session {result['session'].name}, "
                f"{len(result['terms'])} terms, {len(result['grade_levels'])} grade levels"
            ))

            if not school.onboarding_completed:
                school.onboarding_completed = True
                school.save(update_fields=["onboarding_completed"])
                self.stdout.write(self.style.SUCCESS(f"  Marked onboarding completed for {school.name}"))

        self.stdout.write(self.style.SUCCESS("\nDone."))
