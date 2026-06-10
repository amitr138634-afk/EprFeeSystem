from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

schema_view = get_schema_view(
    openapi.Info(
        title="School ERP - Admin API",
        default_version='v1',
        description="Admin Panel API for Multi-Tenant School ERP System",
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),

    path('api/auth/', include('apps.accounts.urls')),
    path('api/schools/', include('apps.schools.urls')),
    path('api/students/', include('apps.students.urls')),
    path('api/staff/', include('apps.staff.urls')),
    path('api/attendance/', include('apps.attendance.urls')),
    path('api/timetable/', include('apps.timetable.urls')),
    path('api/academics/', include('apps.academics.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
