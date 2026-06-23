from django.db import models


class VehicleMake(models.Model):
    name = models.CharField(max_length=100)

    class Meta:
        db_table = 'vehicle_makes'


class VehicleModel(models.Model):
    name = models.CharField(max_length=100)
    make = models.ForeignKey(VehicleMake, on_delete=models.CASCADE, related_name='models')

    class Meta:
        db_table = 'vehicle_models'


class Vehicle(models.Model):
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive'), ('maintenance', 'In Maintenance')]

    bus_no = models.CharField(max_length=20)
    registration_no = models.CharField(max_length=20)
    vehicle_make = models.ForeignKey(VehicleMake, on_delete=models.SET_NULL, null=True)
    vehicle_model = models.ForeignKey(VehicleModel, on_delete=models.SET_NULL, null=True)
    capacity = models.IntegerField(default=40)
    driver_name = models.CharField(max_length=100)
    driver_phone = models.CharField(max_length=15)
    conductor_name = models.CharField(max_length=100, blank=True)
    conductor_phone = models.CharField(max_length=15, blank=True)
    fitness_expiry = models.DateField(null=True, blank=True)
    insurance_expiry = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='active')
    # Session-scoped (like ClassMaster/FeeHead) so each year's fleet/route
    # setup can be reviewed and cloned forward via Promote Student.
    session = models.CharField(max_length=20, blank=True)

    class Meta:
        db_table = 'vehicles'
        unique_together = [('bus_no', 'session'), ('registration_no', 'session')]

    def __str__(self):
        return f'Bus {self.bus_no} - {self.registration_no}'


class Route(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.SET_NULL, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    session = models.CharField(max_length=20, blank=True)

    class Meta:
        db_table = 'routes'
        unique_together = [('code', 'session')]

    def __str__(self):
        return self.name


class Stop(models.Model):
    """No own `session` column — a stop's session is implicit via its
    route (route.session), avoiding a redundant/derivable field."""
    name = models.CharField(max_length=100)
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='stops')
    order = models.IntegerField(default=0)
    monthly_fee = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    pickup_time = models.TimeField(null=True, blank=True)
    drop_time = models.TimeField(null=True, blank=True)

    class Meta:
        db_table = 'stops'
        ordering = ['order']

    def __str__(self):
        return f'{self.name} ({self.route.name})'


class StudentTransport(models.Model):
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive')]

    student_id = models.IntegerField()
    student_name = models.CharField(max_length=200)
    route = models.ForeignKey(Route, on_delete=models.CASCADE)
    stop = models.ForeignKey(Stop, on_delete=models.CASCADE)
    session_year = models.CharField(max_length=10)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')

    class Meta:
        db_table = 'student_transport'


class TransportAttendance(models.Model):
    """Route-wise, trip-wise (morning/evening) per-student attendance.
    `status_id` references masters.AttendanceMaster.id (Present, Absent,
    Leave, etc. — admin-defined; loose id reference, not a real FK, matching
    this project's cross-app convention e.g. stu_id/head_number)."""
    student_id = models.IntegerField()
    student_name = models.CharField(max_length=200, blank=True)
    date = models.DateField()
    trip_type = models.CharField(max_length=10, choices=[('morning', 'Morning'), ('evening', 'Evening')], default='morning')
    status_id = models.IntegerField()
    route = models.ForeignKey(Route, on_delete=models.CASCADE)
    marked_by = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'student_transport_attendance'
        unique_together = ['student_id', 'date', 'trip_type']


class VehiclePart(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='parts')
    part_name = models.CharField(max_length=100)
    last_replaced = models.DateField(null=True, blank=True)
    next_replacement = models.DateField(null=True, blank=True)
    cost = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'vehicle_parts'
