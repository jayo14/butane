from django.db import migrations


def backfill_school(apps, schema_editor):
    School = apps.get_model("schools", "School")
    Teacher = apps.get_model("accounts", "Teacher")
    Student = apps.get_model("accounts", "Student")
    school, _ = School.objects.get_or_create(name="Dee Soar School", slug="dee-soar-school")
    Teacher.objects.filter(school__isnull=True).update(school=school)
    Student.objects.filter(school__isnull=True).update(school=school)


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0004_add_school"),
        ("schools", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(backfill_school, reverse_code=migrations.RunPython.noop),
    ]
