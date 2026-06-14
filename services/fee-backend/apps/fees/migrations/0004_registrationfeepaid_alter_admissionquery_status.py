# Generated migration file

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('fees', '0003_merge_0002_admissionquery_0002_feeamount'),
    ]

    operations = [
        migrations.CreateModel(
            name='RegistrationFeePaid',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('student_name', models.CharField(max_length=200)),
                ('father_name', models.CharField(max_length=200)),
                ('class_name', models.CharField(max_length=50)),
                ('mobile', models.CharField(max_length=15)),
                ('amount', models.DecimalField(decimal_places=2, default=100.0, max_digits=10)),
                ('payment_mode', models.CharField(choices=[('cash', 'Cash'), ('upi', 'UPI'), ('paytm', 'Paytm'), ('online', 'Online'), ('cheque', 'Cheque'), ('card', 'Card')], max_length=20)),
                ('payment_date', models.DateField()),
                ('transaction_id', models.CharField(blank=True, max_length=100, null=True)),
                ('bank_name', models.CharField(blank=True, max_length=100, null=True)),
                ('receipt_no', models.CharField(max_length=50, unique=True)),
                ('collected_by', models.IntegerField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('remarks', models.TextField(blank=True)),
                ('admission_query', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='registration_payment', to='fees.admissionquery')),
            ],
            options={
                'db_table': 'registration_fee_paid',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AlterField(
            model_name='admissionquery',
            name='status',
            field=models.CharField(choices=[('enquiry', 'Enquiry'), ('contacted', 'Contacted'), ('visited', 'Visited'), ('admitted', 'Admitted'), ('rejected', 'Rejected')], db_column='status', default='enquiry', max_length=20),
        ),
    ]
