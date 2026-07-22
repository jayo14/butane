from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0005_backfill_school"),
        ("schools", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="teacher",
            name="school",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="teachers", to="schools.school"),
        ),
        migrations.AlterField(
            model_name="student",
            name="school",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="students", to="schools.school"),
        ),
    ]
