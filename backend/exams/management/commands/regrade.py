"""Re-grade all submitted/graded attempts, fixing stored scores.

Usage:
  python manage.py regrade                          # all exams
  python manage.py regrade --exam <exam-uuid>       # single exam
  python manage.py regrade --exam <uuid> --dry-run  # preview only
"""
from __future__ import annotations

from django.core.management.base import BaseCommand
from ...models import Attempt
from ...grading import grade_attempt


class Command(BaseCommand):
    help = "Re-grade submitted attempts to fix stored scores (total_marks, percentage, etc.)."

    def add_arguments(self, parser):
        parser.add_argument("--exam", type=str, help="UUID of a specific exam to regrade")
        parser.add_argument("--dry-run", action="store_true", help="Print what would be done without saving")

    def handle(self, *args, **options):
        qs = Attempt.objects.filter(
            status__in=("submitted", "graded"),
            is_deleted=False,
        ).select_related("exam")

        if options["exam"]:
            qs = qs.filter(exam_id=options["exam"])

        total = qs.count()
        if total == 0:
            self.stdout.write("No attempts to regrade.")
            return

        self.stdout.write(f"Found {total} attempt(s) to re-grade.")

        if options["dry_run"]:
            for a in qs.iterator():
                self.stdout.write(f"  Would regrade: {a} (exam={a.exam.title!r})")
            return

        done = 0
        for attempt in qs.iterator():
            grade_attempt(attempt)
            done += 1
            if done % 10 == 0:
                self.stdout.write(f"  Progress: {done}/{total}")

        self.stdout.write(self.style.SUCCESS(f"Done. Regraded {done} attempt(s)."))
