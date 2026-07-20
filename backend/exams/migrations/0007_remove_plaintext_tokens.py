"""Remove plaintext token fields, rename hash fields, update indexes."""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("exams", "0006_add_missing_indexes"),
    ]

    operations = [
        # Drop the old meta-index on public_token before removing the field.
        migrations.RemoveIndex(
            model_name="exam",
            name="exams_exam_public__d4793a_idx",
        ),
        migrations.RenameField(
            model_name="exam",
            old_name="_public_token_hash",
            new_name="public_token_hash",
        ),
        migrations.RenameField(
            model_name="attempt",
            old_name="_access_token_hash",
            new_name="access_token_hash",
        ),
        migrations.RemoveField(
            model_name="exam",
            name="public_token",
        ),
        migrations.RemoveField(
            model_name="attempt",
            name="access_token",
        ),
        migrations.AlterField(
            model_name="exam",
            name="public_token_hash",
            field=models.CharField(
                blank=True, db_index=True, max_length=64, null=True, unique=True
            ),
        ),
        migrations.AlterField(
            model_name="attempt",
            name="access_token_hash",
            field=models.CharField(
                blank=True, db_index=True, max_length=64, null=True, unique=True
            ),
        ),
    ]
