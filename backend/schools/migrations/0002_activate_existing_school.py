from django.db import migrations


def activate_dee_soar_school(apps, schema_editor):
    School = apps.get_model("schools", "School")
    User = apps.get_model("accounts", "User")

    school = School.objects.filter(slug="dee-soar-school").first()
    if school and school.status == "pending_verification":
        school.status = "active"
        school.save(update_fields=["status"])

    admin = User.objects.filter(role="admin").first()
    if admin and not admin.is_active:
        admin.is_active = True
        admin.save(update_fields=["is_active"])


class Migration(migrations.Migration):
    dependencies = [
        ("schools", "0001_initial"),
        ("accounts", "0007_invitation"),
    ]

    operations = [
        migrations.RunPython(activate_dee_soar_school, reverse_code=migrations.RunPython.noop),
    ]
