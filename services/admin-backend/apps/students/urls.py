from django.urls import path
from . import views

urlpatterns = [
    path('classes/', views.ClassListCreateView.as_view(), name='class-list'),
    path('sections/', views.SectionListCreateView.as_view(), name='section-list'),
    path('', views.StudentListCreateView.as_view(), name='student-list-create'),
    path('<int:pk>/', views.StudentDetailView.as_view(), name='student-detail'),
    path('strength/', views.StudentStrengthView.as_view(), name='student-strength'),
    path('<int:pk>/change-section/', views.ChangeSectionView.as_view(), name='change-section'),
]
