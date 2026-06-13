from django.urls import path
from . import views

urlpatterns = [
    path('classes/', views.ClassListCreateView.as_view(), name='class-list'),
    path('classes/<int:pk>/', views.ClassDetailView.as_view(), name='class-detail'),
    path('sections/', views.SectionListCreateView.as_view(), name='section-list'),
    path('sections/<int:pk>/', views.SectionDetailView.as_view(), name='section-detail'),
    
    # ClassMaster/ClassSectionMaster endpoints (from fee-backend tables)
    path('class-masters/', views.ClassMasterListView.as_view(), name='class-master-list'),
    path('section-masters/', views.ClassSectionMasterListView.as_view(), name='section-master-list'),
    
    path('', views.StudentListCreateView.as_view(), name='student-list-create'),
    path('<int:pk>/', views.StudentDetailView.as_view(), name='student-detail'),
    path('strength/', views.StudentStrengthView.as_view(), name='student-strength'),
    path('<int:pk>/change-section/', views.ChangeSectionView.as_view(), name='change-section'),
    path('import/', views.StudentBulkImportView.as_view(), name='student-bulk-import'),
    path('import/template/', views.StudentImportTemplateView.as_view(), name='student-import-template'),
]
