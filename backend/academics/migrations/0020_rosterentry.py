import uuid

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('academics', '0019_add_report_card_classroom_term_status_index'),
        ('accounts', '0001_initial'),
        ('schools', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='RosterEntry',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('full_name', models.CharField(help_text="Student's full name.", max_length=160)),
                ('guardian_phone', models.CharField(blank=True, max_length=32)),
                ('guardian_email', models.EmailField(blank=True, max_length=254)),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('invited', 'Invited'), ('claimed', 'Claimed')], default='draft', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('school', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='roster_entries', to='schools.school')),
                ('classroom', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='roster_entries', to='academics.classroom')),
                ('promoted_student', models.ForeignKey(blank=True, help_text='Linked student after claim.', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='roster_entries', to='accounts.student')),
            ],
            options={
                'db_table': 'academics_roster_entry',
                'ordering': ['full_name'],
                'indexes': [
                    models.Index(fields=['school', 'classroom'], name='roster_school_classroom_idx'),
                    models.Index(fields=['full_name'], name='roster_full_name_idx'),
                ],
            },
        ),
    ]
