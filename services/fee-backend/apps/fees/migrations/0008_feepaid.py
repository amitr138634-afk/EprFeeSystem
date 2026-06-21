from django.db import migrations, models


def copy_registration_payments(apps, schema_editor):
    """Carry over existing registration_fee_paid rows into the new fee_paid
    table. stu_id holds the admission_query's id (type='EXTRA'), matching how
    PayRegistrationFeeView now writes new rows."""
    RegistrationFeePaid = apps.get_model('fees', 'RegistrationFeePaid')
    FeePaid = apps.get_model('fees', 'FeePaid')
    for old in RegistrationFeePaid.objects.all():
        FeePaid.objects.create(
            stu_id=old.admission_query_id,
            type='EXTRA',
            session=old.admission_query.session,
            amount=old.amount,
            mode=old.payment_mode,
            rec_no=old.receipt_no,
            trans_id=old.transaction_id or '',
            date=old.payment_date,
        )


def noop(apps, schema_editor):
    pass


def _head_field():
    return models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)


class Migration(migrations.Migration):

    dependencies = [
        ('fees', '0007_alter_feehead_session'),
    ]

    operations = [
        migrations.CreateModel(
            name='FeePaid',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('stu_id', models.IntegerField()),
                ('type', models.CharField(choices=[('EXTRA', 'Extra/Registration')], default='EXTRA', max_length=20)),
                ('session', models.CharField(max_length=20)),
                ('month', models.CharField(blank=True, max_length=20, null=True)),
                ('head1', _head_field()),
                ('head2', _head_field()),
                ('head3', _head_field()),
                ('head4', _head_field()),
                ('head5', _head_field()),
                ('head6', _head_field()),
                ('head7', _head_field()),
                ('head8', _head_field()),
                ('head9', _head_field()),
                ('head10', _head_field()),
                ('head11', _head_field()),
                ('head12', _head_field()),
                ('head13', _head_field()),
                ('head14', _head_field()),
                ('head15', _head_field()),
                ('head16', _head_field()),
                ('head17', _head_field()),
                ('head18', _head_field()),
                ('head19', _head_field()),
                ('head20', _head_field()),
                ('amount', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('mode', models.CharField(choices=[('cash', 'Cash'), ('upi', 'UPI'), ('paytm', 'Paytm'), ('online', 'Online'), ('cheque', 'Cheque'), ('card', 'Card')], max_length=20)),
                ('rec_no', models.CharField(max_length=50, unique=True)),
                ('trans_id', models.CharField(blank=True, max_length=100, null=True)),
                ('date', models.DateField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'fee_paid',
                'ordering': ['-created_at'],
            },
        ),
        migrations.RunPython(copy_registration_payments, noop),
        migrations.DeleteModel(name='RegistrationFeePaid'),
    ]
