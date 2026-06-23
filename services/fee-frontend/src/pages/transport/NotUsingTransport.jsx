import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { transportApi, masterApi } from '../../services/api'

const listOf = (r) => r.data.results || r.data

export default function NotUsingTransport() {
  const navigate = useNavigate()
  const [className, setClassName] = useState('')
  const [section, setSection] = useState('')

  const { data: classes = [] } = useQuery({
    queryKey: ['classes-not-using-transport'],
    queryFn: () => masterApi.classes().then(listOf),
  })

  const { data: sections = [] } = useQuery({
    queryKey: ['sections-not-using-transport'],
    queryFn: () => masterApi.getSectionMaster().then(listOf),
  })

  const params = {
    ...(className && { class_name: className }),
    ...(section && { section }),
  }

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['transport-not-using-report', params],
    queryFn: () => transportApi.notUsingTransportReport(params).then(r => r.data),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Not Using Transport</h1>
        <p className="text-sm text-gray-500 mt-1">Active students with no transport assigned — filter by class or section</p>
      </div>

      <div className="card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Class</label>
            <select className="form-select" value={className} onChange={e => setClassName(e.target.value)}>
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Section</label>
            <select className="form-select" value={section} onChange={e => setSection(e.target.value)}>
              <option value="">All Sections</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.section}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="stat-card max-w-xs">
        <p className="stat-label">Students Not Using Transport</p>
        <p className="stat-value">{rows.length}</p>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Admission No</th><th>Student Name</th><th>Class</th><th>Section</th><th>Father Mobile</th><th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td></tr>}
            {!isLoading && rows.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">No students found</td></tr>}
            {rows.map(r => (
              <tr key={r.student_id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/feemgmt/student-profile/${r.student_id}`)}>
                <td className="font-medium text-gray-900">{r.admission_no}</td>
                <td>{r.student_name}</td>
                <td>{r.class_name}</td>
                <td>{r.section}</td>
                <td>{r.father_mobile}</td>
                <td className="text-blue-600 text-xs">View →</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
