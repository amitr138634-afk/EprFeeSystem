import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Layers, Printer } from 'lucide-react'
import { academicsApi, studentApi } from '../../services/api'
import ReportCardDoc from './ReportCardDoc'

export default function BulkReportCards() {
  const [filters, setFilters] = useState({ class_id: '', section_id: '', exam_type_id: '' })
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

  const { data, isLoading } = useQuery({
    queryKey: ['bulk-results', filters],
    queryFn: () => academicsApi.classResults(filters).then(r => r.data),
    enabled: !!ready,
  })
  const { data: gradeScale = [] } = useQuery({
    queryKey: ['grade-scale'],
    queryFn: () => academicsApi.gradeScale().then(r => r.data.results ?? r.data),
  })

  const students = data?.students || []
  const exam = data?.exam
  const className = classes.find(c => String(c.id) === String(filters.class_id))?.name
  const sectionName = sections.find(s => String(s.id) === String(filters.section_id))?.name

  return (
    <div className="space-y-4">
      <div className="print:hidden">
        <h1 className="page-title">Bulk Report Cards</h1>
        <p className="page-sub">Generate report cards for an entire class-section and print them all at once.</p>
      </div>

      <div className="card p-5 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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
          <button onClick={() => window.print()} disabled={!students.length} className="btn-primary flex items-center justify-center gap-1.5">
            <Printer size={15} /> Print All
          </button>
        </div>
      </div>

      {!ready ? (
        <div className="card p-12 text-center print:hidden">
          <Layers size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Select class, section and exam type to generate report cards.</p>
        </div>
      ) : isLoading ? (
        <div className="card p-12 text-center text-sm text-gray-400 print:hidden">Generating report cards…</div>
      ) : students.length === 0 ? (
        <div className="card p-12 text-center text-sm text-gray-400 print:hidden">No active students found.</div>
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-gray-500 print:hidden">{students.length} report cards ready.</p>
          {students.map(st => (
            <div key={st.student_id} className="max-w-3xl mx-auto report-card-page">
              <ReportCardDoc report={st} exam={exam} className={className} sectionName={sectionName} gradeScale={gradeScale} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
