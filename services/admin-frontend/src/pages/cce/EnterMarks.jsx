import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Save, Loader2, ClipboardList } from 'lucide-react'
import toast from 'react-hot-toast'
import { academicsApi, studentApi, timetableApi } from '../../services/api'

export default function EnterMarks() {
  const [filters, setFilters] = useState({ class_id: '', section_id: '', exam_type_id: '', subject_id: '' })
  const [marksMap, setMarksMap] = useState({}) // student_id -> { marks_obtained, grade, remarks }

  const allSelected = filters.class_id && filters.section_id && filters.exam_type_id && filters.subject_id

  /* ── Lookups ──────────────────────────────────────────────────────────── */
  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => studentApi.classes().then(r => r.data.results ?? r.data),
  })

  const { data: sections = [] } = useQuery({
    queryKey: ['sections', filters.class_id],
    queryFn: () => studentApi.sections({ class_id: filters.class_id }).then(r => r.data.results ?? r.data),
    enabled: !!filters.class_id,
  })

  const { data: examTypes = [] } = useQuery({
    queryKey: ['exam-types'],
    queryFn: () => academicsApi.examTypes().then(r => r.data.results ?? r.data),
  })

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => timetableApi.subjects().then(r => r.data.results ?? r.data),
  })

  /* ── Students + existing marks ────────────────────────────────────────── */
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students', filters.class_id, filters.section_id],
    queryFn: () => studentApi.list({ class_id: filters.class_id, section_id: filters.section_id, status: 'active' }).then(r => r.data.results ?? r.data),
    enabled: !!(filters.class_id && filters.section_id),
  })

  const { data: existingMarks = [], isLoading: loadingMarks } = useQuery({
    queryKey: ['marks', filters],
    queryFn: () => academicsApi.marks(filters).then(r => r.data.results ?? r.data),
    enabled: !!allSelected,
  })

  /* ── Pre-fill marks map from existing marks ───────────────────────────── */
  useEffect(() => {
    if (!allSelected) return
    const map = {}
    students.forEach(s => {
      map[s.id] = { marks_obtained: '', grade: '', remarks: '' }
    })
    existingMarks.forEach(m => {
      map[m.student_id ?? m.student] = {
        marks_obtained: m.marks_obtained ?? '',
        grade: m.grade ?? '',
        remarks: m.remarks ?? '',
      }
    })
    setMarksMap(map)
  }, [existingMarks, students, allSelected])

  /* ── Save ─────────────────────────────────────────────────────────────── */
  const saveMut = useMutation({
    mutationFn: () => {
      const marks = students.map(s => ({
        student_id: s.id,
        marks_obtained: marksMap[s.id]?.marks_obtained !== '' ? Number(marksMap[s.id]?.marks_obtained) : null,
        grade: marksMap[s.id]?.grade || '',
        remarks: marksMap[s.id]?.remarks || '',
      })).filter(m => m.marks_obtained !== null)
      return academicsApi.bulkMarks({
        exam_type_id: Number(filters.exam_type_id),
        subject_id: Number(filters.subject_id),
        class_id: Number(filters.class_id),
        section_id: Number(filters.section_id),
        marks,
      })
    },
    onSuccess: () => toast.success('Marks saved successfully'),
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to save marks'),
  })

  const selectedExamType = examTypes.find(e => String(e.id) === String(filters.exam_type_id))
  const maxMarks = selectedExamType?.max_marks ?? null
  const isGraded = selectedExamType?.is_graded ?? false

  function setField(studentId, field, value) {
    setMarksMap(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [field]: value },
    }))
  }

  const loading = loadingStudents || loadingMarks

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Enter Marks</h1>
        <p className="page-sub">Select class, section, exam type and subject to enter student marks.</p>
      </div>

      {/* Filters */}
      <div className="card p-5">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <label className="form-label">Class</label>
            <select
              className="form-select"
              value={filters.class_id}
              onChange={e => setFilters(p => ({ ...p, class_id: e.target.value, section_id: '' }))}
            >
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Section</label>
            <select
              className="form-select"
              value={filters.section_id}
              onChange={e => setFilters(p => ({ ...p, section_id: e.target.value }))}
              disabled={!filters.class_id}
            >
              <option value="">Select Section</option>
              {sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Exam Type</label>
            <select
              className="form-select"
              value={filters.exam_type_id}
              onChange={e => setFilters(p => ({ ...p, exam_type_id: e.target.value }))}
            >
              <option value="">Select Exam Type</option>
              {examTypes.map(et => <option key={et.id} value={et.id}>{et.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Subject</label>
            <select
              className="form-select"
              value={filters.subject_id}
              onChange={e => setFilters(p => ({ ...p, subject_id: e.target.value }))}
            >
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        {selectedExamType && (
          <p className="text-xs text-gray-500 mt-3">
            Max Marks: <strong>{selectedExamType.max_marks}</strong> &nbsp;|&nbsp;
            Passing Marks: <strong>{selectedExamType.passing_marks}</strong> &nbsp;|&nbsp;
            Type: <strong>{isGraded ? 'Grade-based' : 'Marks-based'}</strong>
          </p>
        )}
      </div>

      {/* Marks table */}
      {!allSelected && (
        <div className="card p-12 text-center">
          <ClipboardList size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Select all four filters above to load the marks entry sheet.</p>
        </div>
      )}

      {allSelected && loading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      )}

      {allSelected && !loading && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-700">{students.length} Students</span>
            <button
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending || students.length === 0}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {saveMut.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> Save Marks</>}
            </button>
          </div>

          {students.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">No active students found for this class/section.</div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-10">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Student Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Admission No</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Marks {maxMarks !== null && <span className="text-gray-400 font-normal">(out of {maxMarks})</span>}
                    </th>
                    {isGraded && (
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Grade</th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((student, idx) => {
                    const entry = marksMap[student.id] || { marks_obtained: '', grade: '', remarks: '' }
                    const marksVal = Number(entry.marks_obtained)
                    const overMax = maxMarks !== null && entry.marks_obtained !== '' && marksVal > maxMarks
                    return (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-800">
                          {student.full_name ?? `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim()}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600 font-mono">{student.admission_no ?? student.admission_number ?? '—'}</td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min="0"
                            max={maxMarks ?? undefined}
                            className={`form-input py-1 w-24 text-sm ${overMax ? 'border-red-400 bg-red-50' : ''}`}
                            value={entry.marks_obtained}
                            onChange={e => setField(student.id, 'marks_obtained', e.target.value)}
                            placeholder="—"
                          />
                          {overMax && <p className="text-xs text-red-500 mt-0.5">Exceeds max ({maxMarks})</p>}
                        </td>
                        {isGraded && (
                          <td className="px-4 py-2">
                            <input
                              className="form-input py-1 w-20 text-sm uppercase"
                              value={entry.grade}
                              onChange={e => setField(student.id, 'grade', e.target.value.toUpperCase())}
                              placeholder="A+"
                            />
                          </td>
                        )}
                        <td className="px-4 py-2">
                          <input
                            className="form-input py-1 text-sm"
                            value={entry.remarks}
                            onChange={e => setField(student.id, 'remarks', e.target.value)}
                            placeholder="Optional remarks"
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
