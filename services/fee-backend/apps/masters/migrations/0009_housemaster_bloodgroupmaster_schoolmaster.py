from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('masters', '0008_classsectionmaster_section_master'),
    ]

    operations = [
        migrations.CreateModel(
            name='HouseMaster',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('house_name', models.CharField(max_length=50, unique=True, verbose_name='House Name')),
                ('color', models.CharField(blank=True, help_text='e.g. Red, #FF0000', max_length=30)),
                ('status', models.BooleanField(default=True, help_text='1=Active, 0=Inactive')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'house_master',
                'ordering': ['house_name'],
            },
        ),
        migrations.CreateModel(
            name='BloodGroupMaster',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=10, unique=True, verbose_name='Blood Group')),
                ('status', models.BooleanField(default=True, help_text='1=Active, 0=Inactive')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'blood_group_master',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='SchoolMaster',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('school_name', models.CharField(blank=True, max_length=200)),
                ('address', models.CharField(blank=True, max_length=255)),
                ('city', models.CharField(blank=True, max_length=100)),
                ('state', models.CharField(blank=True, max_length=100)),
                ('pincode', models.CharField(blank=True, max_length=10)),
                ('phone', models.CharField(blank=True, max_length=20)),
                ('email', models.EmailField(blank=True, max_length=254)),
                ('website', models.CharField(blank=True, max_length=200)),
                ('affiliation_board', models.CharField(blank=True, max_length=100)),
                ('registration_no', models.CharField(blank=True, max_length=100)),
                ('established_year', models.CharField(blank=True, max_length=4)),
                ('principal_name', models.CharField(blank=True, max_length=200)),
                ('logo', models.ImageField(blank=True, null=True, upload_to='school_logo/')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'school_master',
            },
        ),
    ]
