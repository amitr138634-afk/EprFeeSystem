from rest_framework import serializers
from .models import Vehicle, Route, Stop, StudentTransport, TransportAttendance, VehiclePart, VehicleMake, VehicleModel


class VehicleMakeSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleMake
        fields = '__all__'


class VehicleModelSerializer(serializers.ModelSerializer):
    make_name = serializers.CharField(source='make.name', read_only=True)

    class Meta:
        model = VehicleModel
        fields = '__all__'


class VehicleSerializer(serializers.ModelSerializer):
    make_name = serializers.CharField(source='vehicle_make.name', read_only=True)
    model_name = serializers.CharField(source='vehicle_model.name', read_only=True)

    class Meta:
        model = Vehicle
        fields = '__all__'


class StopSerializer(serializers.ModelSerializer):
    route_name = serializers.CharField(source='route.name', read_only=True)

    class Meta:
        model = Stop
        fields = '__all__'


class RouteSerializer(serializers.ModelSerializer):
    stops = StopSerializer(many=True, read_only=True)
    vehicle_no = serializers.CharField(source='vehicle.bus_no', read_only=True)

    class Meta:
        model = Route
        fields = '__all__'


class StudentTransportSerializer(serializers.ModelSerializer):
    route_name = serializers.CharField(source='route.name', read_only=True)
    stop_name = serializers.CharField(source='stop.name', read_only=True)

    class Meta:
        model = StudentTransport
        fields = '__all__'


class TransportAttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransportAttendance
        fields = '__all__'


class VehiclePartSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehiclePart
        fields = '__all__'
