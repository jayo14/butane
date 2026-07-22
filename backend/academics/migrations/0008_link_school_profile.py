from django.db import migrations


def link_school_profile(apps, schema_editor):
    School = apps.get_model("schools", "School")
    SchoolProfile = apps.get_model("academics", "SchoolProfile")
    school = School.objects.filter(slug="dee-soar-school").first()
    if not school:
        school = School.objects.create(name="Dee Soar School", slug="dee-soar-school")
    profile = SchoolProfile.objects.first()
    if profile:
        profile.school = school
        profile.save(update_fields=["school"])


class Migration(migrations.Migration):
    dependencies = [
        ("academics", "0007_add_school"),
        ("schools", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(link_school_profile, reverse_code=migrations.RunPython.noop),
    ]
