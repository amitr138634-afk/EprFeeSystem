from django.urls import path
from . import views

urlpatterns = [
    path('exam-types/', views.ExamTypeListCreateView.as_view(), name='exam-type-list'),
    path('exam-types/<int:pk>/', views.ExamTypeDetailView.as_view(), name='exam-type-detail'),
    # NOTE: SubjectAllocation URLs temporarily disabled
    # path('subject-allocations/', views.SubjectAllocationListCreateView.as_view(), name='subject-allocation-list'),
    # path('subject-allocations/<int:pk>/', views.SubjectAllocationDetailView.as_view(), name='subject-allocation-detail'),
    path('marks/', views.MarksListCreateView.as_view(), name='marks-list'),
    path('marks/bulk/', views.BulkMarksView.as_view(), name='marks-bulk'),
    path('remarks/', views.RemarkListCreateView.as_view(), name='remark-list'),
    path('remarks/<int:pk>/', views.RemarkDetailView.as_view(), name='remark-detail'),
    path('signatures/', views.SignatureMasterListCreateView.as_view(), name='signature-list'),
    path('signatures/<int:pk>/', views.SignatureMasterDetailView.as_view(), name='signature-detail'),
    path('signatures/class-teacher-lookup/', views.ClassTeacherLookupView.as_view(), name='signature-class-teacher-lookup'),
    path('student-subjects/', views.StudentSubjectView.as_view(), name='student-subjects'),
    # Academics
    path('grade-scale/', views.GradeScaleListCreateView.as_view(), name='grade-scale-list'),
    path('grade-scale/<int:pk>/', views.GradeScaleDetailView.as_view(), name='grade-scale-detail'),
    path('calculation/', views.CalculationMasterView.as_view(), name='calculation-master'),
    # CCE — Grade Master, Test Master, Assign Subject & Test
    path('grades/', views.GradeListCreateView.as_view(), name='grade-list'),
    path('grades/<int:pk>/', views.GradeDetailView.as_view(), name='grade-detail'),
    path('tests/', views.TestListCreateView.as_view(), name='test-list'),
    path('tests/<int:pk>/', views.TestDetailView.as_view(), name='test-detail'),
    path('co-scholastic-subjects/', views.CoScholasticSubjectListCreateView.as_view(), name='co-scholastic-list'),
    path('co-scholastic-subjects/<int:pk>/', views.CoScholasticSubjectDetailView.as_view(), name='co-scholastic-detail'),
    path('co-scholastic-assignments/', views.CoScholasticAssignmentView.as_view(), name='co-scholastic-assignments'),
    path('assign-subject-test/', views.AssignSubjectTestView.as_view(), name='assign-subject-test'),
    # CCE — Marks Feeding
    path('marks-feeding/tests/', views.MarksFeedingTestsView.as_view(), name='marks-feeding-tests'),
    path('marks-feeding/subjects/', views.MarksFeedingSubjectsView.as_view(), name='marks-feeding-subjects'),
    path('marks-feeding/grid/', views.MarksFeedingGridView.as_view(), name='marks-feeding-grid'),
    path('marks-feeding/remarks/', views.MarksFeedingRemarksView.as_view(), name='marks-feeding-remarks'),
    # NOTE: ClassResultView and ReportCardView temporarily disabled - use _subjects_for
    # path('results/', views.ClassResultView.as_view(), name='class-results'),
    # path('report-card/', views.ReportCardView.as_view(), name='report-card'),
]
