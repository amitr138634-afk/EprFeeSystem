from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import ExamType, StudentSubject, Marks, RemarkMaster, SignatureMaster, GradeScale
from .serializers import (
    ExamTypeSerializer, StudentSubjectSerializer,
    MarksSerializer, RemarkMasterSerializer, SignatureMasterSerializer, GradeScaleSerializer
)
from utils.permissions import IsSchoolStaff, IsSchoolAdmin
from apps.students.models import Student
from apps.timetable.models import Subject


class ExamTypeListCreateView(generics.ListCreateAPIView):
    serializer_class = ExamTypeSerializer
    permission_classes = [IsSchoolAdmin]

    def get_queryset(self):
        qs = ExamType.objects.all()
        if self.request.query_params.get('session_year'):
            qs = qs.filter(session_year=self.request.query_params['session_year'])
        return qs


# NOTE: SubjectAllocation views temporarily disabled - needs redesign
# class SubjectAllocationListCreateView(generics.ListCreateAPIView):
#     serializer_class = SubjectAllocationSerializer
#     permission_classes = [IsSchoolStaff]
#
#     def get_queryset(self):
#         qs = SubjectAllocation.objects.select_related('class_ref', 'section', 'subject', 'teacher')
#         params = self.request.query_params
#         if params.get('class_id'):
#             qs = qs.filter(class_ref_id=params['class_id'])
#         if params.get('section_id'):
#             qs = qs.filter(section_id=params['section_id'])
#         if params.get('session_year'):
#             qs = qs.filter(session_year=params['session_year'])
#         return qs


# class SubjectAllocationDetailView(generics.RetrieveUpdateDestroyAPIView):
#     serializer_class = SubjectAllocationSerializer
#     permission_classes = [IsSchoolAdmin]
#     queryset = SubjectAllocation.objects.all()


class MarksListCreateView(generics.ListCreateAPIView):
    serializer_class = MarksSerializer
    permission_classes = [IsSchoolStaff]

    def get_queryset(self):
        qs = Marks.objects.select_related('student', 'subject', 'exam_type')
        params = self.request.query_params
        if params.get('exam_type_id'):
            qs = qs.filter(exam_type_id=params['exam_type_id'])
        if params.get('class_id'):
            qs = qs.filter(student__class_ref_id=params['class_id'])
        if params.get('section_id'):
            qs = qs.filter(student__section_id=params['section_id'])
        if params.get('student_id'):
            qs = qs.filter(student_id=params['student_id'])
        return qs


class BulkMarksView(APIView):
    permission_classes = [IsSchoolStaff]

    def post(self, request):
        marks_data = request.data.get('marks', [])
        results = []
        for item in marks_data:
            obj, _ = Marks.objects.update_or_create(
                student_id=item['student_id'],
                subject_id=item['subject_id'],
                exam_type_id=item['exam_type_id'],
                defaults={
                    'marks_obtained': item.get('marks_obtained'),
                    'grade': item.get('grade', ''),
                    'remarks': item.get('remarks', ''),
                    'is_absent': item.get('is_absent', False),
                    'entered_by': request.user.id,
                }
            )
            results.append(obj)
        return Response({'detail': f'{len(results)} marks records saved.'})


class RemarkMasterListCreateView(generics.ListCreateAPIView):
    serializer_class = RemarkMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = RemarkMaster.objects.all()


class SignatureMasterListCreateView(generics.ListCreateAPIView):
    serializer_class = SignatureMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = SignatureMaster.objects.all()


class ExamTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ExamTypeSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = ExamType.objects.all()


# NOTE: SubjectAllocationDetailView temporarily disabled
# class SubjectAllocationDetailView(generics.RetrieveUpdateDestroyAPIView):
#     serializer_class = SubjectAllocationSerializer
#     permission_classes = [IsSchoolAdmin]
#     queryset = SubjectAllocation.objects.all()


class RemarkMasterDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RemarkMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = RemarkMaster.objects.all()


class StudentSubjectView(generics.ListCreateAPIView):
    serializer_class = StudentSubjectSerializer
    permission_classes = [IsSchoolStaff]

    def get_queryset(self):
        qs = StudentSubject.objects.select_related('subject')
        params = self.request.query_params
        if params.get('student_id'):
            qs = qs.filter(student_id=params['student_id'])
        if params.get('session_year'):
            qs = qs.filter(session_year=params['session_year'])
        return qs


# ─────────────────────────────────────────────────────────────────────────────
# Academics — Grade Scale (grade bands for report cards)
# ─────────────────────────────────────────────────────────────────────────────
class GradeScaleListCreateView(generics.ListCreateAPIView):
    serializer_class = GradeScaleSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = GradeScale.objects.all()


class GradeScaleDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = GradeScaleSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = GradeScale.objects.all()


# ─────────────────────────────────────────────────────────────────────────────
# Academics — Calculation Master (final-result weightage per exam type)
# ─────────────────────────────────────────────────────────────────────────────
class CalculationMasterView(APIView):
    permission_classes = [IsSchoolAdmin]

    def get(self, request):
        qs = ExamType.objects.all()
        sy = request.query_params.get('session_year')
        if sy:
            qs = qs.filter(session_year=sy)
        data = [
            {'id': e.id, 'name': e.name, 'code': e.code,
             'weightage': float(e.weightage), 'session_year': e.session_year}
            for e in qs
        ]
        return Response({
            'exam_types': data,
            'total_weightage': round(sum(d['weightage'] for d in data), 2),
        })

    def patch(self, request):
        items = request.data.get('weightages', [])
        for item in items:
            ExamType.objects.filter(id=item.get('id')).update(weightage=item.get('weightage', 0))
        return Response({'detail': f'{len(items)} weightage(s) updated.'})


# ─────────────────────────────────────────────────────────────────────────────
# Report Card — result computation helpers + endpoints
# ─────────────────────────────────────────────────────────────────────────────
def _grade_for(percentage, scales):
    for s in scales:
        if float(s.min_percent) <= percentage <= float(s.max_percent):
            return s.grade
    return ''


# NOTE: _subjects_for temporarily disabled - uses SubjectAllocation
# def _subjects_for(class_id, section_id, session_year, student_ids, exam_type_id):
#     sub_ids = list(
#         SubjectAllocation.objects
#         .filter(class_ref_id=class_id, section_id=section_id, session_year=session_year)
#         .values_list('subject_id', flat=True)
#     )
#     if not sub_ids:
#         sub_ids = list(
#             Marks.objects
#             .filter(student_id__in=student_ids, exam_type_id=exam_type_id)
#             .values_list('subject_id', flat=True).distinct()
#         )
#     return list(Subject.objects.filter(id__in=sub_ids).order_by('name'))


def _build_student_report(student, exam_type, subjects, marks_map, scales):
    max_marks = float(exam_type.max_marks)
    passing = float(exam_type.passing_marks)
    total_obtained, total_max, failed = 0.0, 0.0, False
    rows = []
    for subj in subjects:
        m = marks_map.get((student.id, subj.id))
        obtained, is_absent, grade = None, False, ''
        if m:
            is_absent = m.is_absent
            obtained = float(m.marks_obtained) if m.marks_obtained is not None else None
            grade = m.grade
        rows.append({
            'subject_id': subj.id,
            'subject': subj.name,
            'max_marks': max_marks,
            'obtained': obtained,
            'grade': grade,
            'is_absent': is_absent,
        })
        total_max += max_marks
        if is_absent:
            failed = True
        elif obtained is not None:
            total_obtained += obtained
            if obtained < passing:
                failed = True
    percentage = round(total_obtained / total_max * 100, 2) if total_max else 0
    return {
        'student_id': student.id,
        'name': student.full_name,
        'admission_no': student.admission_no,
        'roll_no': student.roll_no,
        'subjects': rows,
        'total_obtained': round(total_obtained, 2),
        'total_max': round(total_max, 2),
        'percentage': percentage,
        'grade': _grade_for(percentage, scales),
        'result': 'Fail' if failed else 'Pass',
    }


class ClassResultView(APIView):
    """Aggregated results for a whole class-section for one exam type."""
    permission_classes = [IsSchoolStaff]

    def get(self, request):
        p = request.query_params
        exam_type_id, class_id, section_id = p.get('exam_type_id'), p.get('class_id'), p.get('section_id')
        if not (exam_type_id and class_id and section_id):
            return Response({'detail': 'exam_type_id, class_id and section_id are required.'}, status=400)
        try:
            exam_type = ExamType.objects.get(id=exam_type_id)
        except ExamType.DoesNotExist:
            return Response({'detail': 'Exam type not found.'}, status=404)

        students = list(
            Student.objects.filter(class_ref_id=class_id, section_id=section_id, status='active')
            .order_by('roll_no', 'first_name')
        )
        student_ids = [s.id for s in students]
        subjects = _subjects_for(class_id, section_id, exam_type.session_year, student_ids, exam_type_id)
        marks_map = {
            (m.student_id, m.subject_id): m
            for m in Marks.objects.filter(student_id__in=student_ids, exam_type_id=exam_type_id)
        }
        scales = list(GradeScale.objects.all())
        rows = [_build_student_report(s, exam_type, subjects, marks_map, scales) for s in students]
        for rank, r in enumerate(sorted(rows, key=lambda x: x['total_obtained'], reverse=True), start=1):
            r['rank'] = rank

        return Response({
            'exam': {'id': exam_type.id, 'name': exam_type.name,
                     'max_marks': float(exam_type.max_marks), 'passing_marks': float(exam_type.passing_marks)},
            'subjects': [{'id': s.id, 'name': s.name} for s in subjects],
            'students': rows,
        })


class ReportCardView(APIView):
    """Full report card for a single student for one exam type."""
    permission_classes = [IsSchoolStaff]

    def get(self, request):
        p = request.query_params
        exam_type_id, student_id = p.get('exam_type_id'), p.get('student_id')
        if not (exam_type_id and student_id):
            return Response({'detail': 'exam_type_id and student_id are required.'}, status=400)
        try:
            exam_type = ExamType.objects.get(id=exam_type_id)
            student = Student.objects.select_related('class_ref', 'section').get(id=student_id)
        except (ExamType.DoesNotExist, Student.DoesNotExist):
            return Response({'detail': 'Not found.'}, status=404)

        subjects = _subjects_for(
            student.class_ref_id, student.section_id, exam_type.session_year, [student.id], exam_type_id
        )
        marks_map = {
            (m.student_id, m.subject_id): m
            for m in Marks.objects.filter(student_id=student.id, exam_type_id=exam_type_id)
        }
        scales = list(GradeScale.objects.all())
        report = _build_student_report(student, exam_type, subjects, marks_map, scales)
        report.update({
            'class_name': student.class_ref.name if student.class_ref else '',
            'section_name': student.section.name if student.section else '',
            'father_name': student.father_name,
            'mother_name': student.mother_name,
            'date_of_birth': student.date_of_birth,
        })

        return Response({
            'exam': {'id': exam_type.id, 'name': exam_type.name, 'session_year': exam_type.session_year,
                     'max_marks': float(exam_type.max_marks), 'passing_marks': float(exam_type.passing_marks)},
            'report': report,
            'grade_scale': GradeScaleSerializer(scales, many=True).data,
        })
