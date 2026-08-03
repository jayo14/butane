"""
Data migration: best-effort backfill of Exam FK fields from string values.

For each Exam row:
  - subject    → Subject.name  (case-insensitive, strip)
  - class_group → GradeLevel.name → ClassRoom (first match in school)
                 or ClassRoom.name directly
  - term       → Term.name     (normalize via normalize_term_name, then match)

Unmatched rows are logged to stderr for manual review.  No rows are deleted
or modified beyond setting the three new FK columns.
"""

import logging
from django.db import migrations

logger = logging.getLogger(__name__)


def normalize(s):
    """Strip and lowercase for comparison."""
    return (s or "").strip().lower()


def backfill_exam_fks(apps, schema_editor):
    Exam = apps.get_model("exams", "Exam")
    Subject = apps.get_model("exams", "Subject")
    GradeLevel = apps.get_model("exams", "GradeLevel")
    ClassRoom = apps.get_model("academics", "ClassRoom")
    Term = apps.get_model("exams", "Term")

    # Build lookup dicts (school-scoped where possible).
    subjects_by_name = {}
    for s in Subject.objects.all():
        subjects_by_name[normalize(s.name)] = s

    grade_levels_by_name = {}
    for g in GradeLevel.objects.all():
        grade_levels_by_name[normalize(g.name)] = g

    classrooms_by_name = {}
    for c in ClassRoom.objects.select_related("grade_level").all():
        classrooms_by_name[normalize(c.name)] = c

    terms_by_name = {}
    for t in Term.objects.all():
        terms_by_name[normalize(t.name)] = t

    matched = {"subject": 0, "classroom": 0, "term": 0}
    unmatched = {"subject": [], "classroom": [], "term": []}

    for exam in Exam.objects.filter(is_deleted=False):
        updates = {}

        # --- subject_fk ---
        subj_key = normalize(exam.subject)
        if subj_key and subj_key in subjects_by_name:
            updates["subject_fk"] = subjects_by_name[subj_key]
            matched["subject"] += 1
        elif subj_key:
            unmatched["subject"].append(
                f"Exam {exam.id} ({exam.title!r}): subject={exam.subject!r}"
            )

        # --- classroom_fk ---
        cg_key = normalize(exam.class_group)
        if cg_key:
            # Try direct ClassRoom name match first
            if cg_key in classrooms_by_name:
                updates["classroom_fk"] = classrooms_by_name[cg_key]
                matched["classroom"] += 1
            elif cg_key in grade_levels_by_name:
                # Match via GradeLevel → first classroom in that level
                gl = grade_levels_by_name[cg_key]
                first_classroom = ClassRoom.objects.filter(
                    grade_level=gl
                ).first()
                if first_classroom:
                    updates["classroom_fk"] = first_classroom
                    matched["classroom"] += 1
                else:
                    unmatched["classroom"].append(
                        f"Exam {exam.id} ({exam.title!r}): class_group={exam.class_group!r} "
                        f"(GradeLevel found but no classroom)"
                    )
            else:
                unmatched["classroom"].append(
                    f"Exam {exam.id} ({exam.title!r}): class_group={exam.class_group!r}"
                )

        # --- term_fk ---
        term_key = normalize(exam.term)
        if term_key and term_key in terms_by_name:
            updates["term_fk"] = terms_by_name[term_key]
            matched["term"] += 1
        elif term_key:
            unmatched["term"].append(
                f"Exam {exam.id} ({exam.title!r}): term={exam.term!r}"
            )

        if updates:
            Exam.objects.filter(pk=exam.pk).update(**updates)

    # Report results
    total_exams = Exam.objects.filter(is_deleted=False).count()
    report_lines = [
        f"\n{'='*60}",
        f"Exam FK backfill report ({total_exams} active exams)",
        f"{'='*60}",
        f"Matched:   subject={matched['subject']}, classroom={matched['classroom']}, term={matched['term']}",
    ]
    for field, items in unmatched.items():
        if items:
            report_lines.append(f"\nUnmatched {field} ({len(items)}):")
            for line in items[:50]:  # cap at 50 per field
                report_lines.append(f"  - {line}")
            if len(items) > 50:
                report_lines.append(f"  ... and {len(items) - 50} more")

    report = "\n".join(report_lines)
    logger.info(report)
    # Also print to stderr so `migrate` output captures it
    print(report)


def reverse_backfill(apps, schema_editor):
    """Clear the FK fields (string fields are preserved)."""
    Exam = apps.get_model("exams", "Exam")
    Exam.objects.all().update(subject_fk=None, classroom_fk=None, term_fk=None)


class Migration(migrations.Migration):

    dependencies = [
        ("exams", "0022_add_fk_fields_to_exam"),
    ]

    operations = [
        migrations.RunPython(backfill_exam_fks, reverse_code=reverse_backfill),
    ]
