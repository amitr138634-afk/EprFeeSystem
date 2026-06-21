from django.db import models
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import (
    ExamType, StudentSubject, Marks, RemarkMaster, SignatureMaster, GradeScale,
    Grade, Test, SubjectAssignment, SubjectTestMark, CoScholasticSubject,
    CoScholasticAssignment,
)
from .serializers import (
    ExamTypeSerializer, StudentSubjectSerializer,
    MarksSerializer, RemarkMasterSerializer, SignatureMasterSerializer, GradeScaleSerializer,
    GradeSerializer, TestSerializer, CoScholasticSubjectSerializer,
)
from utils.permissions import IsSchoolStaff, IsSchoolAdmin
from utils.session import SessionScopedMixin, current_session_year
from apps.students.models import Student
from apps.timetable.models import Subject, Timetable


class ExamTypeListCreateView(SessionScopedMixin, generics.ListCreateAPIView):
    serializer_class = ExamTypeSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = ExamType.objects.all()


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


class MarksFeedingTestsView(APIView):
    """Tests dropdown for Marks Feeding — only tests that actually have
    max marks configured (in Assign Subject & Test) for some scholastic
    subject in this class-section."""
    permission_classes = [IsSchoolStaff]

    def get(self, request):
        class_id = request.query_params.get('class_id')
        section_id = request.query_params.get('section_id')
        if not (class_id and section_id):
            return Response({'detail': 'class_id and section_id are required.'}, status=400)
        sy = current_session_year()

        tests = (
            Test.objects.filter(
                session=sy,
                subjecttestmark__assignment__class_ref_id=class_id,
                subjecttestmark__assignment__section_id=section_id,
                subjecttestmark__max_marks__isnull=False,
            )
            .order_by('display_order', 'id')
            .values('id', 'name', 'code')
            .distinct()
        )
        return Response(list(tests))


class MarksFeedingSubjectsView(APIView):
    """Subjects dropdown for Marks Feeding, scoped to class+section+test+type.

    Scholastic: timetable subjects assigned (not co-scholastic) that have a
    max_marks defined for this test.
    Co-Scholastic: timetable subjects moved to co-scholastic for this
    class-section, plus Co-Scholastic Subject Master activities assigned to
    it (see CoScholasticAssignment) — these aren't per-test, so they're the
    same list regardless of which test is selected.

    Each item is tagged 'kind': 'subject' or 'co_scholastic' so the grid
    endpoints know which Marks FK column it belongs in."""
    permission_classes = [IsSchoolStaff]

    def get(self, request):
        class_id = request.query_params.get('class_id')
        section_id = request.query_params.get('section_id')
        test_id = request.query_params.get('test_id')
        type_ = request.query_params.get('type')
        if not (class_id and section_id and test_id and type_ in ('scholastic', 'co_scholastic')):
            return Response({'detail': 'class_id, section_id, test_id and type (scholastic|co_scholastic) are required.'}, status=400)
        sy = current_session_year()

        result = []
        if type_ == 'scholastic':
            assignments = (
                SubjectAssignment.objects
                .filter(class_ref_id=class_id, section_id=section_id, session=sy, is_co_scholastic=False)
                .select_related('subject')
                .prefetch_related('test_marks')
            )
            for a in assignments:
                tm = next((t for t in a.test_marks.all() if t.test_id == int(test_id)), None)
                if tm is None or tm.max_marks is None:
                    continue
                result.append({
                    'id': a.subject_id, 'kind': 'subject', 'name': a.subject.name,
                    'evaluation_mode': a.evaluation_mode, 'max_marks': float(tm.max_marks),
                })
        else:
            moved = (
                SubjectAssignment.objects
                .filter(class_ref_id=class_id, section_id=section_id, session=sy, is_co_scholastic=True)
                .select_related('subject')
            )
            for a in moved:
                result.append({'id': a.subject_id, 'kind': 'subject', 'name': a.subject.name, 'evaluation_mode': 'direct'})

            master = (
                CoScholasticSubject.objects
                .filter(session=sy, is_active=True, assignments__class_ref_id=class_id, assignments__section_id=section_id)
                .distinct()
            )
            for m in master:
                result.append({'id': m.id, 'kind': 'co_scholastic', 'name': m.name, 'evaluation_mode': 'direct'})

        return Response(result)


def _student_marks_key(kind, ref_id):
    return f'{kind}_{ref_id}'


class MarksFeedingGridView(APIView):
    """The actual grid: students × selected subjects, with prefilled marks/
    grades.

    GET  ?class_id=&section_id=&test_id=&subject_ids=1,2&co_scholastic_ids=3
         → columns (with max_marks/evaluation_mode) + one row per student
         with a 'marks' dict keyed by '{kind}_{id}'.
    POST { class_id, section_id, test_id, entries: [{student_id, kind,
         ref_id, marks_obtained, grade}] }  → validates and upserts the
         whole grid in one call (partial save allowed; empty cells on an
         existing row are saved as null)."""
    permission_classes = [IsSchoolStaff]

    def _columns(self, class_id, section_id, test_id, subject_ids, co_ids, sy):
        columns = []
        if subject_ids:
            assignments = (
                SubjectAssignment.objects
                .filter(class_ref_id=class_id, section_id=section_id, session=sy, subject_id__in=subject_ids)
                .select_related('subject')
                .prefetch_related('test_marks')
            )
            for a in assignments:
                max_marks = None
                if not a.is_co_scholastic and a.evaluation_mode != 'direct':
                    tm = next((t for t in a.test_marks.all() if t.test_id == int(test_id)), None)
                    max_marks = float(tm.max_marks) if (tm and tm.max_marks is not None) else None
                columns.append({
                    'id': a.subject_id, 'kind': 'subject', 'name': a.subject.name,
                    'evaluation_mode': 'direct' if a.is_co_scholastic else a.evaluation_mode,
                    'max_marks': max_marks,
                })
        if co_ids:
            for m in CoScholasticSubject.objects.filter(id__in=co_ids, session=sy):
                columns.append({'id': m.id, 'kind': 'co_scholastic', 'name': m.name, 'evaluation_mode': 'direct', 'max_marks': None})
        return columns

    def get(self, request):
        p = request.query_params
        class_id, section_id, test_id = p.get('class_id'), p.get('section_id'), p.get('test_id')
        if not (class_id and section_id and test_id):
            return Response({'detail': 'class_id, section_id and test_id are required.'}, status=400)
        subject_ids = [int(x) for x in p.get('subject_ids', '').split(',') if x]
        co_ids = [int(x) for x in p.get('co_scholastic_ids', '').split(',') if x]
        if not (subject_ids or co_ids):
            return Response({'detail': 'Select at least one subject.'}, status=400)
        sy = current_session_year()

        columns = self._columns(class_id, section_id, test_id, subject_ids, co_ids, sy)

        from apps.students.models import ClassMaster, ClassSectionMaster
        class_master = ClassMaster.objects.filter(id=class_id).first()
        class_section = ClassSectionMaster.objects.filter(id=section_id).first()
        section_master_id = class_section.section_master_id if class_section else None
        section_name = class_section.section_name if class_section else None

        # Student.class_name stores the ClassMaster id, and Student.section
        # stores the generic SectionMaster id directly (not the
        # ClassSectionMaster id) — see ClassSectionMaster, which only maps
        # "which sections exist for which class", it doesn't itself identify
        # a student's section. Older rows may still hold literal text names,
        # so fall back to that for those.
        students = list(
            Student.objects.filter(session=sy, status='active')
            .filter(
                models.Q(class_name=str(class_id)) | models.Q(class_name=class_master.class_name if class_master else '__none__')
            )
            .filter(
                models.Q(section=str(section_master_id)) | models.Q(section=section_name or '__none__')
            )
            .order_by('roll_no', 'student_name')
        )

        existing = Marks.objects.filter(
            student_id__in=[s.id for s in students], test_id=test_id, session=sy,
        )
        marks_by_student = {}
        for m in existing:
            key = _student_marks_key('subject', m.subject_id) if m.subject_id else _student_marks_key('co_scholastic', m.co_scholastic_subject_id)
            marks_by_student.setdefault(m.student_id, {})[key] = {
                'marks_obtained': float(m.marks_obtained) if m.marks_obtained is not None else None,
                'grade': m.grade or None,
            }

        rows = [{
            'student_id': s.id, 'admission_no': s.admission_no, 'student_name': s.student_name,
            'class_name': class_master.class_name if class_master else s.class_name,
            'section_name': section_name or s.section,
            'roll_no': s.roll_no,
            'marks': marks_by_student.get(s.id, {}),
        } for s in students]

        grades_direct = list(Grade.objects.filter(session=sy, grade_type='direct').order_by('display_order').values('id', 'grade_label'))

        return Response({'columns': columns, 'students': rows, 'grades_direct': grades_direct})

    def post(self, request):
        data = request.data
        class_id, section_id, test_id = data.get('class_id'), data.get('section_id'), data.get('test_id')
        entries = data.get('entries', [])
        if not (class_id and section_id and test_id):
            return Response({'detail': 'class_id, section_id and test_id are required.'}, status=400)
        sy = current_session_year()

        # Build lookup: (kind, ref_id) -> {evaluation_mode, max_marks}
        subject_ids = [e['ref_id'] for e in entries if e.get('kind') == 'subject']
        co_ids = [e['ref_id'] for e in entries if e.get('kind') == 'co_scholastic']
        columns = self._columns(class_id, section_id, test_id, subject_ids, co_ids, sy)
        col_by_key = {(c['kind'], c['id']): c for c in columns}

        direct_labels = set(Grade.objects.filter(session=sy, grade_type='direct').values_list('grade_label', flat=True))
        marks_grades = list(Grade.objects.filter(session=sy, grade_type='marks_based').order_by('display_order'))

        errors = []
        for entry in entries:
            kind, ref_id = entry.get('kind'), entry.get('ref_id')
            col = col_by_key.get((kind, ref_id))
            if col is None:
                errors.append(f'{kind} {ref_id}: not configured for this class/section/test.')
                continue

            marks_obtained = entry.get('marks_obtained')
            grade = (entry.get('grade') or '').strip() or None

            if col['evaluation_mode'] == 'direct':
                if grade is not None and grade not in direct_labels:
                    errors.append(f"{col['name']}: \"{grade}\" is not a valid grade. Choose from Grade Master (Direct Grade).")
            else:
                if marks_obtained is not None:
                    try:
                        marks_obtained = float(marks_obtained)
                    except (TypeError, ValueError):
                        errors.append(f"{col['name']}: marks must be numeric.")
                        continue
                    if marks_obtained < 0:
                        errors.append(f"{col['name']}: marks cannot be negative.")
                        continue
                    if col.get('max_marks') is None:
                        errors.append(f"{col['name']}: max marks not defined in Assign Subject & Test — cannot save.")
                        continue
                    if marks_obtained > col['max_marks']:
                        errors.append(f"{col['name']}: marks ({marks_obtained}) exceed max marks ({col['max_marks']}).")
                        continue

        if errors:
            return Response({'detail': 'Validation failed', 'errors': errors}, status=400)

        warnings = []
        for entry in entries:
            kind, ref_id = entry['kind'], entry['ref_id']
            col = col_by_key[(kind, ref_id)]
            student_id = entry['student_id']
            marks_obtained = entry.get('marks_obtained')
            grade = (entry.get('grade') or '').strip() or None
            if marks_obtained is not None:
                marks_obtained = float(marks_obtained)

            if col['evaluation_mode'] == 'marks_grade' and marks_obtained is not None:
                match = next((g for g in marks_grades if g.min_marks is not None and g.max_marks is not None and g.min_marks <= marks_obtained <= g.max_marks), None)
                grade = match.grade_label if match else None
                if match is None:
                    warnings.append(f"{col['name']}: no Grade Master range covers {marks_obtained} marks — grade left blank.")

            subject_id = ref_id if kind == 'subject' else None
            co_id = ref_id if kind == 'co_scholastic' else None

            obj = Marks.objects.filter(
                student_id=student_id, subject_id=subject_id, co_scholastic_subject_id=co_id, test_id=test_id, session=sy,
            ).first()
            if obj:
                obj.marks_obtained = marks_obtained
                obj.grade = grade or ''
                obj.class_ref_id = class_id
                obj.section_id = section_id
                obj.entered_by = request.user.id
                obj.save()
            elif marks_obtained is not None or grade:
                Marks.objects.create(
                    student_id=student_id, subject_id=subject_id, co_scholastic_subject_id=co_id,
                    test_id=test_id, session=sy, class_ref_id=class_id, section_id=section_id,
                    marks_obtained=marks_obtained, grade=grade or '', entered_by=request.user.id,
                )

        return Response({'detail': 'Saved.', 'warnings': warnings})


class RemarkMasterListCreateView(generics.ListCreateAPIView):
    serializer_class = RemarkMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = RemarkMaster.objects.all()


class SignatureMasterListCreateView(generics.ListCreateAPIView):
    serializer_class = SignatureMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = SignatureMaster.objects.all()


class ExamTypeDetailView(SessionScopedMixin, generics.RetrieveUpdateDestroyAPIView):
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


class StudentSubjectView(SessionScopedMixin, generics.ListCreateAPIView):
    serializer_class = StudentSubjectSerializer
    permission_classes = [IsSchoolStaff]
    queryset = StudentSubject.objects.select_related('subject')

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        if params.get('student_id'):
            qs = qs.filter(student_id=params['student_id'])
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
        sy = request.query_params.get('session_year') or current_session_year()
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


# ─────────────────────────────────────────────────────────────────────────────
# CCE — Grade Master (marks-based bands + direct grades, session-scoped)
# ─────────────────────────────────────────────────────────────────────────────
class GradeListCreateView(SessionScopedMixin, generics.ListCreateAPIView):
    serializer_class = GradeSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = Grade.objects.all()

    def get_queryset(self):
        qs = super().get_queryset()
        grade_type = self.request.query_params.get('grade_type')
        if grade_type:
            qs = qs.filter(grade_type=grade_type)
        return qs


class GradeDetailView(SessionScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = GradeSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = Grade.objects.all()


# ─────────────────────────────────────────────────────────────────────────────
# CCE — Test Master (session-scoped)
# ─────────────────────────────────────────────────────────────────────────────
class TestListCreateView(SessionScopedMixin, generics.ListCreateAPIView):
    serializer_class = TestSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = Test.objects.all()


class TestDetailView(SessionScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TestSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = Test.objects.all()


# ─────────────────────────────────────────────────────────────────────────────
# CCE — Co-Scholastic Subject Master (session-scoped; each activity is
# explicitly assigned to one or more class-sections — see CoScholasticAssignmentView)
# ─────────────────────────────────────────────────────────────────────────────
class CoScholasticSubjectListCreateView(SessionScopedMixin, generics.ListCreateAPIView):
    serializer_class = CoScholasticSubjectSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = CoScholasticSubject.objects.all()

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get('is_active'):
            qs = qs.filter(is_active=self.request.query_params['is_active'] in ('1', 'true', 'True'))
        return qs


class CoScholasticSubjectDetailView(SessionScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CoScholasticSubjectSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = CoScholasticSubject.objects.all()


class CoScholasticAssignmentView(APIView):
    """One form to create (or reuse) an activity and assign it to a
    class's sections in a single action — editing an activity re-derives
    class_id/section_ids from its existing assignment, so unchecking a
    section here removes it.

    GET  (no params)  → every active master activity for the session, each
         with its current list of assigned class-sections (for display).
    POST { subject_id or name, class_id?, section_ids?: [...] }  →
         get-or-create the activity (by id or name), then — if class_id is
         given — replace that class's assigned sections with exactly
         section_ids (so [] unassigns the class entirely). Other classes'
         assignments and other activities are untouched."""
    permission_classes = [IsSchoolAdmin]

    def get(self, request):
        sy = current_session_year()
        # All activities (including inactive ones, so they can be re-activated
        # from the management list) — assignment filtering for the live
        # Assign Subject & Test grid is handled separately, in AssignSubjectTestView.
        activities = CoScholasticSubject.objects.filter(session=sy).order_by('display_order', 'id')
        result = []
        for a in activities:
            rows = (
                CoScholasticAssignment.objects.filter(co_scholastic_subject=a, session=sy)
                .select_related('class_ref', 'section', 'section__section_master')
                .values('class_ref_id', 'class_ref__class_name', 'section_id', 'section__section_master__section')
            )
            result.append({
                'id': a.id,
                'name': a.name,
                'display_order': a.display_order,
                'is_active': a.is_active,
                'assignments': [
                    {
                        'class_id': r['class_ref_id'], 'class_name': r['class_ref__class_name'],
                        'section_id': r['section_id'], 'section_name': r['section__section_master__section'],
                    } for r in rows
                ],
            })
        return Response(result)

    def post(self, request):
        subject_id = request.data.get('subject_id')
        name = (request.data.get('name') or '').strip()
        class_id = request.data.get('class_id')
        section_ids = request.data.get('section_ids', [])
        if not (subject_id or name):
            return Response({'detail': 'subject_id or name is required.'}, status=400)
        sy = current_session_year()

        if subject_id:
            activity = CoScholasticSubject.objects.filter(id=subject_id, session=sy).first()
            if activity is None:
                return Response({'detail': 'Activity not found.'}, status=404)
        else:
            activity = CoScholasticSubject.objects.filter(name__iexact=name, session=sy).first()
            if activity is None:
                activity = CoScholasticSubject.objects.create(name=name, session=sy, is_active=True)

        if class_id:
            # Replace semantics, scoped to this one class — unassigns sections
            # not in section_ids (e.g. [] clears the class entirely), creates
            # missing ones. This activity's assignments to other classes, and
            # other activities' assignments, are left untouched.
            existing = CoScholasticAssignment.objects.filter(
                co_scholastic_subject=activity, class_ref_id=class_id, session=sy
            )
            existing.exclude(section_id__in=section_ids).delete()
            already = set(existing.values_list('section_id', flat=True))
            for section_id in section_ids:
                if section_id not in already:
                    CoScholasticAssignment.objects.create(
                        co_scholastic_subject=activity, class_ref_id=class_id, section_id=section_id, session=sy,
                    )

        return Response({'detail': 'Saved.', 'id': activity.id, 'name': activity.name}, status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────────────────────────────────────
# CCE — Assign Subject & Test (grid: subjects × tests, mode per subject)
# ─────────────────────────────────────────────────────────────────────────────
class AssignSubjectTestView(APIView):
    """Grid configuration for one class-section.

    GET  ?class_id=&section_id=  → subjects (from timetable), tests (Test master),
                                   and saved assignments for the active session.
    POST { class_id, section_id, rows: [{subject_id, evaluation_mode,
           cells: [{test_id, max_marks}]}] }  → upserts the whole grid.
    """
    permission_classes = [IsSchoolAdmin]

    def get(self, request):
        p = request.query_params
        class_id, section_id = p.get('class_id'), p.get('section_id')
        if not (class_id and section_id):
            return Response({'detail': 'class_id and section_id are required.'}, status=400)
        sy = current_session_year()

        # Subjects actively used in the timetable for this class-section.
        subject_ids = (
            Timetable.objects
            .filter(class_ref_id=class_id, sections__id=section_id, session_year=sy, subject__isnull=False)
            .values_list('subject_id', flat=True)
            .distinct()
        )
        subjects = list(
            Subject.objects.filter(id__in=subject_ids, session=sy).order_by('name').values('id', 'name')
        )

        tests = list(
            Test.objects.filter(session=sy).order_by('display_order', 'id').values('id', 'name', 'code')
        )

        assignments = []
        qs = (
            SubjectAssignment.objects
            .filter(class_ref_id=class_id, section_id=section_id, session=sy)
            .prefetch_related('test_marks')
        )
        for a in qs:
            cells = {tm.test_id: (float(tm.max_marks) if tm.max_marks is not None else None) for tm in a.test_marks.all()}
            assignments.append({
                'subject_id': a.subject_id,
                'evaluation_mode': a.evaluation_mode,
                'is_co_scholastic': a.is_co_scholastic,
                'cells': cells,
            })

        # Master co-scholastic activities — only those assigned to this
        # class-section (see CoScholasticAssignmentView).
        co_scholastic_master = list(
            CoScholasticSubject.objects.filter(
                session=sy, is_active=True,
                assignments__class_ref_id=class_id, assignments__section_id=section_id,
            )
            .order_by('display_order', 'id')
            .values('id', 'name')
            .distinct()
        )

        return Response({
            'subjects': subjects,
            'tests': tests,
            'assignments': assignments,
            'co_scholastic_master': co_scholastic_master,
        })

    def post(self, request):
        data = request.data
        class_id, section_id = data.get('class_id'), data.get('section_id')
        rows = data.get('rows', [])
        if not (class_id and section_id):
            return Response({'detail': 'class_id and section_id are required.'}, status=400)
        sy = current_session_year()

        valid_modes = {'marks', 'marks_grade', 'direct'}
        saved = 0
        for row in rows:
            subject_id = row.get('subject_id')
            is_co = bool(row.get('is_co_scholastic'))
            # A subject moved to co-scholastic is always Direct Grade.
            mode = 'direct' if is_co else row.get('evaluation_mode', 'marks')
            if not subject_id or mode not in valid_modes:
                continue

            assignment, _ = SubjectAssignment.objects.update_or_create(
                class_ref_id=class_id, section_id=section_id,
                subject_id=subject_id, session=sy,
                defaults={'evaluation_mode': mode, 'is_co_scholastic': is_co},
            )

            if is_co or mode == 'direct':
                # No marks for co-scholastic / direct-grade subjects.
                assignment.test_marks.all().delete()
            else:
                for cell in row.get('cells', []):
                    test_id = cell.get('test_id')
                    if not test_id:
                        continue
                    mm = cell.get('max_marks')
                    SubjectTestMark.objects.update_or_create(
                        assignment=assignment, test_id=test_id,
                        defaults={'max_marks': mm if mm not in ('', None) else None},
                    )
            saved += 1

        return Response({'detail': f'{saved} subject assignment(s) saved.', 'count': saved})
