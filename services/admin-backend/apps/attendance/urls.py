from django.urls import path
from . import views

urlpatterns = [
    path('students/', views.StudentAttendanceListView.as_view(), name='student-attendance-list'),
    path('students/bulk/', views.BulkStudentAttendanceView.as_view(), name='student-attendance-bulk'),
    path('students/register/', views.AttendanceRegisterView.as_view(), name='attendance-register'),
    path('students/absent-log/', views.AbsentLogView.as_view(), name='absent-log'),
    path('students/summary/', views.AttendanceSummaryView.as_view(), name='attendance-summary'),
    path('staff/', views.StaffAttendanceListCreateView.as_view(), name='staff-attendance'),
    path('holidays/', views.HolidayListCreateView.as_view(), name='holiday-list'),
]
