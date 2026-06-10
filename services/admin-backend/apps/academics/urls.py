from django.urls import path
from . import views

urlpatterns = [
    path('exam-types/', views.ExamTypeListCreateView.as_view(), name='exam-type-list'),
    path('exam-types/<int:pk>/', views.ExamTypeDetailView.as_view(), name='exam-type-detail'),
    path('subject-allocations/', views.SubjectAllocationListCreateView.as_view(), name='subject-allocation-list'),
    path('subject-allocations/<int:pk>/', views.SubjectAllocationDetailView.as_view(), name='subject-allocation-detail'),
    path('marks/', views.MarksListCreateView.as_view(), name='marks-list'),
    path('marks/bulk/', views.BulkMarksView.as_view(), name='marks-bulk'),
    path('remarks/', views.RemarkMasterListCreateView.as_view(), name='remark-list'),
    path('remarks/<int:pk>/', views.RemarkMasterDetailView.as_view(), name='remark-detail'),
    path('signatures/', views.SignatureMasterListCreateView.as_view(), name='signature-list'),
    path('student-subjects/', views.StudentSubjectView.as_view(), name='student-subjects'),
]
