from django.db import migrations
from django.contrib.auth import get_user_model

def seed_admin_user(apps, schema_editor):
    User = get_user_model()
    email = "admin@deesoar.edu"

    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            "first_name": "Admin",
            "last_name": "User",
            "role": "admin",
            "is_active": True,
            "is_staff": True,
            "is_superuser": True,
        },
    )

    if created:
        user.set_password("test1234")
        user.save()
        print(f"Created admin user: {email}")
    else:
        changed = False
        if not user.is_active:
            user.is_active = True
            changed = True
        if not user.is_staff:
            user.is_staff = True
            changed = True
        if not user.is_superuser:
            user.is_superuser = True
            changed = True
        if changed:
            user.save()
            print(f"Reactivated admin user: {email}")


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_alter_student_student_id_alter_teacher_employee_id"),
    ]

    operations = [
        migrations.RunPython(seed_admin_user, migrations.RunPython.noop),
    ]
