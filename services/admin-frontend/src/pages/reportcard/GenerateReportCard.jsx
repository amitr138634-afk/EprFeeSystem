import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Printer, ArrowLeft, User } from 'lucide-react'
import { academicsApi, studentApi } from '../../services/api'
import ReportCardDoc from './ReportCardDoc'

export default function GenerateReportCard() {
  const [filters, setFilters] = useState({ class_id: '', section_id: '', exam_type_id: '' })
  const [selectedStudent, setSelectedStudent] = useState(null)

  const ready = filters.class_id && filters.section_id && filters.exam_type_id

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
  const { data: students = [] } = useQuery({
    queryKey: ['students', filters.class_id, filters.section_id],
    queryFn: () => studentApi.list({ class_id: filters.class_id, section_id: filters.section_id, status: 'active' }).then(r => r.data.results ?? r.data),
    enabled: !!(filters.class_id && filters.section_id),
  })

  const { data: card, isLoading: loadingCard } = useQuery({
    queryKey: ['report-card', selectedStudent?.id, filters.exam_type_id],
    queryFn: () => academicsApi.reportCard({ student_id: selectedStudent.id, exam_type_id: filters.exam_type_id }).then(r => r.data),
    enabled: !!(selectedStudent && filters.exam_type_id),
  })

  /* ── Report card view ─────────────────────────────────────────────────── */
  if (selectedStudent) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between print:hidden">
          <button onClick={() => setSelectedStudent(null)} className="btn-secondary flex items-center gap-1.5">
            <ArrowLeft size={15} /> Back to list
          </button>
          <button onClick={() => window.print()} disabled={!card} className="btn-primary flex items-center gap-1.5">
            <Printer size={15} /> Print
          </button>
        </div>
        {loadingCard ? (
          <div className="card p-12 text-center text-sm text-gray-400">Loading report card…</div>
        ) : card ? (
          <div className="max-w-3xl mx-auto">
            <ReportCardDoc report={card.report} exam={card.exam} gradeScale={card.grade_scale} />
          </div>
        ) : (
          <div className="card p-12 text-center text-sm text-gray-400">Could not load report card.</div>
        )}
      </div>
    )
  }

  /* ── Filter + student picker ──────────────────────────────────────────── */
  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Generate Report Card</h1>
        <p className="page-sub">Select a class, section and exam, then pick a student to view and print their report card.</p>
      </div>

      <div className="card p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Class</label>
            <select className="form-select" value={filters.class_id}
              onChange={e => setFilters(p => ({ ...p, class_id: e.target.value, section_id: '' }))}>
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Section</label>
            <select className="form-select" value={filters.section_id} disabled={!filters.class_id}
              onChange={e => setFilters(p => ({ ...p, section_id: e.target.value }))}>
              <option value="">Select Section</option>
              {sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Exam Type</label>
            <select className="form-select" value={filters.exam_type_id}
              onChange={e => setFilters(p => ({ ...p, exam_type_id: e.target.value }))}>
              <option value="">Select Exam Type</option>
              {examTypes.map(et => <option key={et.id} value={et.id}>{et.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {!ready ? (
        <div className="card p-12 text-center">
          <FileText size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Select all three filters to list students.</p>
        </div>
      ) : students.length === 0 ? (
        <div className="card p-12 text-center text-sm text-gray-400">No active students found.</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Roll</th><th>Student</th><th>Admission No</th><th className="text-right">Action</th></tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id}>
                  <td className="text-gray-500">{s.roll_no || '—'}</td>
                  <td className="font-medium text-gray-800">{s.full_name ?? `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim()}</td>
                  <td className="text-gray-500 font-mono">{s.admission_no ?? '—'}</td>
                  <td className="text-right">
                    <button onClick={() => setSelectedStudent(s)} className="btn-secondary btn-sm flex items-center gap-1.5 ml-auto">
                      <User size={13} /> Report Card
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
