from django.db import migrations


def backfill_school(apps, schema_editor):
    School = apps.get_model("schools", "School")
    AcademicSession = apps.get_model("academics", "AcademicSession")
    ClassRoom = apps.get_model("academics", "ClassRoom")
    AssessmentComponent = apps.get_model("academics", "AssessmentComponent")
    ReportCard = apps.get_model("academics", "ReportCard")
    school, _ = School.objects.get_or_create(name="Dee Soar School", slug="dee-soar-school")
    AcademicSession.objects.filter(school__isnull=True).update(school=school)
    ClassRoom.objects.filter(school__isnull=True).update(school=school)
    AssessmentComponent.objects.filter(school__isnull=True).update(school=school)
    ReportCard.objects.filter(school__isnull=True).update(school=school)


class Migration(migrations.Migration):
    dependencies = [
        ("academics", "0008_link_school_profile"),
        ("schools", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(backfill_school, reverse_code=migrations.RunPython.noop),
    ]
