import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, Trophy } from 'lucide-react'
import { academicsApi, studentApi } from '../../services/api'

export default function ClassResults() {
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
    queryKey: ['class-results', filters],
    queryFn: () => academicsApi.classResults(filters).then(r => r.data),
    enabled: !!ready,
  })

  const subjects = data?.subjects || []
  const students = data?.students || []

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Class Results</h1>
        <p className="page-sub">Consolidated subject-wise results, totals, percentage, grade and rank for a class.</p>
      </div>

      {/* Filters */}
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
          <BarChart3 size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Select class, section and exam type to view results.</p>
        </div>
      ) : isLoading ? (
        <div className="card p-12 text-center text-sm text-gray-400">Loading results…</div>
      ) : students.length === 0 ? (
        <div className="card p-12 text-center text-sm text-gray-400">No active students found for this class/section.</div>
      ) : (
        <div className="table-container overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="text-center">Rank</th>
                <th>Roll</th>
                <th>Student</th>
                {subjects.map(s => <th key={s.id} className="text-center">{s.name}</th>)}
                <th className="text-center">Total</th>
                <th className="text-center">%</th>
                <th className="text-center">Grade</th>
                <th className="text-center">Result</th>
              </tr>
            </thead>
            <tbody>
              {students.map(st => {
                const bySubj = Object.fromEntries(st.subjects.map(x => [x.subject_id, x]))
                return (
                  <tr key={st.student_id}>
                    <td className="text-center font-semibold text-gray-700">
                      {st.rank === 1 ? <span className="inline-flex items-center gap-1 text-amber-500"><Trophy size={13} />1</span> : st.rank}
                    </td>
                    <td className="text-gray-500">{st.roll_no || '—'}</td>
                    <td className="font-medium text-gray-800 whitespace-nowrap">{st.name}</td>
                    {subjects.map(s => {
                      const m = bySubj[s.id]
                      return (
                        <td key={s.id} className="text-center">
                          {m?.is_absent ? <span className="text-red-400 text-xs">AB</span>
                            : m?.obtained != null ? m.obtained
                            : <span className="text-gray-300">—</span>}
                        </td>
                      )
                    })}
                    <td className="text-center font-semibold text-gray-800">{st.total_obtained}/{st.total_max}</td>
                    <td className="text-center">{st.percentage}%</td>
                    <td className="text-center"><span className="badge badge-blue">{st.grade || '—'}</span></td>
                    <td className="text-center">
                      <span className={`badge ${st.result === 'Pass' ? 'badge-green' : 'badge-red'}`}>{st.result}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
