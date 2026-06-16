from django.urls import path
from . import views
from . import views_session

urlpatterns = [
    # ClassMaster/ClassSectionMaster endpoints (from fee-backend tables)
    path('class-masters/', views.ClassMasterListView.as_view(), name='class-master-list'),
    path('section-masters/', views.ClassSectionMasterListView.as_view(), name='section-master-list'),
    
    # Session Master endpoints
    path('sessions/', views_session.SessionMasterListCreateView.as_view(), name='session-list-create'),
    path('sessions/<int:pk>/', views_session.SessionMasterDetailView.as_view(), name='session-detail'),
    
    # Student endpoints
    path('', views.StudentListCreateView.as_view(), name='student-list-create'),
    path('<int:pk>/', views.StudentDetailView.as_view(), name='student-detail'),
    path('strength/', views.StudentStrengthView.as_view(), name='student-strength'),
]
