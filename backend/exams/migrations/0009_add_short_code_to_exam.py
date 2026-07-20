# Generated manually — adds short_code field to Exam for quick code-based lookup.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("exams", "0008_fix_token_hash_index"),
    ]

    operations = [
        migrations.AddField(
            model_name="exam",
            name="short_code",
            field=models.CharField(
                blank=True,
                db_index=True,
                help_text="Short 8-char code for quick exam lookup.",
                max_length=8,
                null=True,
                unique=True,
            ),
        ),
    ]
