from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('masters', '0009_housemaster_bloodgroupmaster_schoolmaster'),
    ]

    operations = [
        migrations.CreateModel(
            name='CategoryMaster',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('category_name', models.CharField(max_length=50, unique=True, verbose_name='Category Name')),
                ('status', models.BooleanField(default=True, help_text='1=Active, 0=Inactive')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'category_master',
                'ordering': ['category_name'],
            },
        ),
        migrations.CreateModel(
            name='ReligionMaster',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('religion_name', models.CharField(max_length=50, unique=True, verbose_name='Religion Name')),
                ('status', models.BooleanField(default=True, help_text='1=Active, 0=Inactive')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'religion_master',
                'ordering': ['religion_name'],
            },
        ),
        migrations.CreateModel(
            name='CasteMaster',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('caste_name', models.CharField(max_length=50, unique=True, verbose_name='Caste Name')),
                ('status', models.BooleanField(default=True, help_text='1=Active, 0=Inactive')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'caste_master',
                'ordering': ['caste_name'],
            },
        ),
    ]
