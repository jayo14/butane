import itertools

from django.db import migrations


def backfill_academic_structure(apps, schema_editor):
    AcademicSession = apps.get_model("academics", "AcademicSession")
    ClassRoom = apps.get_model("academics", "ClassRoom")
    Enrollment = apps.get_model("academics", "Enrollment")
    Term = apps.get_model("exams", "Term")
    GradeLevel = apps.get_model("exams", "GradeLevel")
    Student = apps.get_model("accounts", "Student")

    session = AcademicSession.objects.create(
        name="2025/2026",
        start_date="2025-09-01",
        end_date="2026-07-31",
        is_current=True,
    )

    Term.objects.filter(session__isnull=True).update(session=session)

    grade_values = sorted(
        {
            s.grade.strip()
            for s in Student.objects.all()
            if s.grade and s.grade.strip()
        }
    )

    existing_levels = {gl.name: gl for gl in GradeLevel.objects.all()}
    grade_to_classroom = {}
    for grade in grade_values:
        grade_level = existing_levels.get(grade)
        if grade_level is None:
            grade_level = GradeLevel.objects.create(name=grade, display_order=999)
        classroom = ClassRoom.objects.create(name=grade, grade_level=grade_level)
        grade_to_classroom[grade] = classroom

    enrollments = []
    for student in Student.objects.all():
        grade = (student.grade or "").strip()
        if grade and grade in grade_to_classroom:
            enrollments.append(
                Enrollment(student=student, classroom=grade_to_classroom[grade], session=session)
            )
    Enrollment.objects.bulk_create(enrollments, ignore_conflicts=True)


class Migration(migrations.Migration):
    dependencies = [
        ("academics", "0001_initial"),
        ("exams", "0014_term_session"),
    ]

    operations = [
        migrations.RunPython(backfill_academic_structure, reverse_code=migrations.RunPython.noop),
    ]
