from django.db import migrations


def create_school_profile(apps, schema_editor):
    SchoolProfile = apps.get_model("academics", "SchoolProfile")
    SchoolProfile.objects.create(
        pk=1,
        name="Dee Soar School",
        motto="",
        address="123 Education Lane, Learning City",
        principal_name="",
        vice_principal_name="",
        primary_color="#006c49",
        secondary_color="#3c4a42",
    )


class Migration(migrations.Migration):
    dependencies = [
        ("academics", "0005_school_profile"),
    ]

    operations = [
        migrations.RunPython(create_school_profile, reverse_code=migrations.RunPython.noop),
    ]
