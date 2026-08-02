from django.db import migrations


def backfill_school(apps, schema_editor):
    """Backfill null school values on Subject and GradeLevel.

    Infers school from related ClassRoom/Exam rows where possible,
    otherwise assigns to the default school.
    """
    School = apps.get_model("schools", "School")
    Subject = apps.get_model("exams", "Subject")
    GradeLevel = apps.get_model("exams", "GradeLevel")
    ClassRoom = apps.get_model("academics", "ClassRoom")
    Exam = apps.get_model("exams", "Exam")

    school, _ = School.objects.get_or_create(name="Dee Soar School", slug="dee-soar-school")

    # Backfill Subject.school from related ClassRoom or Exam
    for subject in Subject.objects.filter(school__isnull=True):
        # Try to infer from ClassRoom (via TeachingAssignment or direct subject link)
        classroom = ClassRoom.objects.filter(
            teaching_assignments__subject=subject,
            school__isnull=False,
        ).first()
        if classroom:
            subject.school = classroom.school
            subject.save(update_fields=["school"])
            continue
        # Try to infer from Exam subject name match
        exam = Exam.objects.filter(
            subject__iexact=subject.name,
            school__isnull=False,
        ).first()
        if exam:
            subject.school = exam.school
            subject.save(update_fields=["school"])
            continue
        # Fallback to default school
        subject.school = school
        subject.save(update_fields=["school"])

    # Backfill GradeLevel.school from related ClassRoom
    for grade_level in GradeLevel.objects.filter(school__isnull=True):
        classroom = ClassRoom.objects.filter(
            grade_level=grade_level,
            school__isnull=False,
        ).first()
        if classroom:
            grade_level.school = classroom.school
            grade_level.save(update_fields=["school"])
            continue
        # Fallback to default school
        grade_level.school = school
        grade_level.save(update_fields=["school"])


class Migration(migrations.Migration):
    dependencies = [
        ("exams", "0019_remove_global_unique_term_name"),
        ("academics", "0010_school_non_nullable"),
        ("schools", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(backfill_school, reverse_code=migrations.RunPython.noop),
    ]
