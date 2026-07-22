from django.db import migrations


def backfill_school(apps, schema_editor):
    School = apps.get_model("schools", "School")
    Subject = apps.get_model("exams", "Subject")
    GradeLevel = apps.get_model("exams", "GradeLevel")
    Exam = apps.get_model("exams", "Exam")
    school, _ = School.objects.get_or_create(name="Dee Soar School", slug="dee-soar-school")
    Subject.objects.filter(school__isnull=True).update(school=school)
    GradeLevel.objects.filter(school__isnull=True).update(school=school)
    Exam.objects.filter(school__isnull=True).update(school=school)


class Migration(migrations.Migration):
    dependencies = [
        ("exams", "0015_add_school"),
        ("schools", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(backfill_school, reverse_code=migrations.RunPython.noop),
    ]
