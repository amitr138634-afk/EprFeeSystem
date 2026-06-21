from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='School',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('code', models.CharField(max_length=20, unique=True)),
                ('email', models.EmailField(max_length=254, unique=True)),
                ('phone', models.CharField(max_length=15)),
                ('address', models.TextField()),
                ('city', models.CharField(max_length=100)),
                ('state', models.CharField(max_length=100)),
                ('pincode', models.CharField(max_length=10)),
                ('logo', models.ImageField(blank=True, null=True, upload_to='school_logos/')),
                ('status', models.CharField(choices=[('active', 'Active'), ('inactive', 'Inactive'), ('trial', 'Trial')], default='active', max_length=10)),
                ('db_name', models.CharField(max_length=100, unique=True)),
                ('subscription_start', models.DateField(blank=True, null=True)),
                ('subscription_end', models.DateField(blank=True, null=True)),
                ('max_students', models.IntegerField(default=1000)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'schools',
            },
        ),
        migrations.CreateModel(
            name='AcademicSession',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50)),
                ('start_date', models.DateField()),
                ('end_date', models.DateField()),
                ('is_current', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('school', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='sessions', to='schools.school')),
            ],
            options={
                'db_table': 'academic_sessions',
            },
        ),
    ]
