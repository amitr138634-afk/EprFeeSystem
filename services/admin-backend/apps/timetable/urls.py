from django.urls import path
from . import views

urlpatterns = [
    path('subjects/', views.SubjectListCreateView.as_view(), name='subject-list'),
    path('periods/', views.PeriodListCreateView.as_view(), name='period-list'),
    path('', views.TimetableListCreateView.as_view(), name='timetable-list-create'),
    path('<int:pk>/', views.TimetableDetailView.as_view(), name='timetable-detail'),
    path('teacher/<int:teacher_id>/', views.TeacherTimetableView.as_view(), name='teacher-timetable'),
    path('substitutes/', views.SubstituteTeacherListCreateView.as_view(), name='substitute-list'),
]
