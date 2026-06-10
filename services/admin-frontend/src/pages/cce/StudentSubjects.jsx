import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { User, BookOpen } from 'lucide-react'
import { academicsApi, studentApi } from '../../services/api'

export default function StudentSubjects() {
  const [filters, setFilters] = useState({ class_id: '', section_id: '', student_id: '' })

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

  const { data: students = [] } = useQuery({
    queryKey: ['students', filters.class_id, filters.section_id],
    queryFn: () => studentApi.list({ class_id: filters.class_id, section_id: filters.section_id, status: 'active' }).then(r => r.data.results ?? r.data),
    enabled: !!(filters.class_id && filters.section_id),
  })

  /* ── Student subjects ─────────────────────────────────────────────────── */
  const { data: studentSubjects = [], isLoading } = useQuery({
    queryKey: ['student-subjects', filters.student_id],
    queryFn: () => academicsApi.studentSubjects({ student_id: filters.student_id }).then(r => r.data.results ?? r.data),
    enabled: !!filters.student_id,
  })

  const selectedStudent = students.find(s => String(s.id) === String(filters.student_id))

  function getStudentName(s) {
    return s.full_name || `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() || `Student #${s.id}`
  }

  function getTeacherName(entry) {
    if (entry.teacher_name) return entry.teacher_name
    if (entry.teacher_detail) {
      return `${entry.teacher_detail.first_name ?? ''} ${entry.teacher_detail.last_name ?? ''}`.trim()
    }
    return '—'
  }

  function getSubjectName(entry) {
    return entry.subject_name ?? entry.subject_detail?.name ?? `Subject #${entry.subject_id ?? entry.subject}`
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Student Subjects</h1>
        <p className="page-sub">View subjects and assigned teachers for an individual student.</p>
      </div>

      {/* Filters */}
      <div className="card p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="form-label">Class</label>
            <select
              className="form-select"
              value={filters.class_id}
              onChange={e => setFilters({ class_id: e.target.value, section_id: '', student_id: '' })}
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
              onChange={e => setFilters(p => ({ ...p, section_id: e.target.value, student_id: '' }))}
              disabled={!filters.class_id}
            >
              <option value="">Select Section</option>
              {sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Student</label>
            <select
              className="form-select"
              value={filters.student_id}
              onChange={e => setFilters(p => ({ ...p, student_id: e.target.value }))}
              disabled={!filters.section_id}
            >
              <option value="">Select Student</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {getStudentName(s)} {s.admission_no ? `(${s.admission_no})` : s.admission_number ? `(${s.admission_number})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Student info + subjects */}
      {!filters.student_id ? (
        <div className="card p-12 text-center">
          <User size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Select a class, section, and student to view their subjects.</p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Student info banner */}
          {selectedStudent && (
            <div className="card px-5 py-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <User size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{getStudentName(selectedStudent)}</p>
                <p className="text-xs text-gray-500">
                  {selectedStudent.admission_no ?? selectedStudent.admission_number ?? ''}
                  {(selectedStudent.admission_no || selectedStudent.admission_number) ? ' · ' : ''}
                  {classes.find(c => String(c.id) === String(filters.class_id))?.name} — Section {sections.find(s => String(s.id) === String(filters.section_id))?.name}
                </p>
              </div>
              <div className="ml-auto">
                <span className="badge badge-blue text-xs">{studentSubjects.length} Subject{studentSubjects.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )}

          {/* Subjects list */}
          <div className="card overflow-hidden">
            {studentSubjects.length === 0 ? (
              <div className="p-10 text-center">
                <BookOpen size={36} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No subjects found for this student.</p>
                <p className="text-xs text-gray-400 mt-1">Subjects are assigned at the class-section level via <strong>Assign Subjects</strong>.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Teacher</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {studentSubjects.map((entry, idx) => (
                      <tr key={entry.id ?? idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{getSubjectName(entry)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{getTeacherName(entry)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
