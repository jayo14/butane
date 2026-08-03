"""Grant can_approve_report_cards to principal and proprietor roles."""
from django.db import migrations


def grant_approval_cap(apps, schema_editor):
    Role = apps.get_model("accounts", "Role")
    Role.objects.filter(slug__in=["principal", "proprietor"]).update(
        can_approve_report_cards=True,
    )


def revoke_approval_cap(apps, schema_editor):
    Role = apps.get_model("accounts", "Role")
    Role.objects.filter(slug__in=["principal", "proprietor"]).update(
        can_approve_report_cards=False,
    )


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0011_add_can_approve_report_cards"),
    ]

    operations = [
        migrations.RunPython(grant_approval_cap, revoke_approval_cap),
    ]
