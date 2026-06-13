from django.db import models


class FeeAmount(models.Model):
    FREQUENCY_CHOICES = [
        ('one_time', 'One Time'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    ]
    
    TYPE_CHOICES = [
        ('old', 'Old'),
        ('new', 'New'),
    ]
    
    # id auto-increment by default
    class_id = models.IntegerField()
    class_name = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    session = models.CharField(max_length=20)
    head_name = models.CharField(max_length=100)  # From FeeHead.head1 to head20
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    
    # Month-wise amounts (April to March)
    april = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    may = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    june = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    july = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    august = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    september = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    october = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    november = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    december = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    january = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    february = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    march = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'fee_amount'
        unique_together = ['class_id', 'type', 'session', 'head_name']

    def __str__(self):
        return f'{self.class_name} - {self.head_name} ({self.session})'
