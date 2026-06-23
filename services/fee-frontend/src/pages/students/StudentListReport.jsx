import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, User } from 'lucide-react'
import { feeApi, masterApi } from '../../services/api'
import useAuthStore from '../../store/authStore'

const listOf = (r) => r.data.results || r.data

export default function StudentListReport() {
  const navigate = useNavigate()
  const activeSession = useAuthStore(s => s.currentSession?.session_year) || ''
  const [session, setSession] = useState(activeSession)
  const [className, setClassName] = useState('')
  const [section, setSection] = useState('')
  const [search, setSearch] = useState('')

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions-student-list'],
    queryFn: () => masterApi.sessions().then(listOf),
  })
  const { data: classes = [] } = useQuery({
    queryKey: ['classes-student-list'],
    queryFn: () => masterApi.classes().then(listOf),
  })
  const { data: sections = [] } = useQuery({
    queryKey: ['sections-student-list'],
    queryFn: () => masterApi.getSectionMaster().then(listOf),
  })

  const params = {
    ...(session && { session }),
    ...(className && { class_name: className }),
    ...(section && { section }),
    ...(search && { search }),
  }

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['student-list-report', params],
    queryFn: () => feeApi.studentListReport(params).then(r => r.data),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Student List</h1>
        <p className="text-sm text-gray-500 mt-1">Active students — filter by class, section, and session</p>
      </div>

      <div className="card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="form-label">Session</label>
            <select className="form-select" value={session} onChange={e => setSession(e.target.value)}>
              <option value="">All Sessions</option>
              {sessions.map(s => <option key={s.id} value={s.session_year}>{s.session_year}</option>)}
            </select>
          </div>
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
          <div>
            <label className="form-label">Search</label>
            <div className="relative">
              <Search size={15} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input className="form-input pl-8" value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or admission no." />
            </div>
          </div>
        </div>
      </div>

      <div className="stat-card max-w-xs">
        <p className="stat-label">Students Found</p>
        <p className="stat-value">{rows.length}</p>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th></th><th>Admission No</th><th>Roll No</th><th>Student Name</th>
              <th>Class</th><th>Section</th><th>Session</th><th>Type</th>
              <th>Father Name</th><th>Father Mobile</th><th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={11} className="text-center py-8 text-gray-400">Loading...</td></tr>}
            {!isLoading && rows.length === 0 && <tr><td colSpan={11} className="text-center py-8 text-gray-400">No students found</td></tr>}
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/feemgmt/student-profile/${r.id}`)}>
                <td>
                  {r.photo ? (
                    <img src={r.photo} alt={r.student_name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500"><User size={14} /></div>
                  )}
                </td>
                <td className="font-medium text-gray-900">{r.admission_no}</td>
                <td>{r.roll_no || '—'}</td>
                <td>{r.student_name}</td>
                <td>{r.class_name}</td>
                <td>{r.section}</td>
                <td>{r.session}</td>
                <td><span className={r.type === 'old' ? 'badge-gray' : 'badge-blue'}>{r.type === 'old' ? 'Old' : 'New'}</span></td>
                <td>{r.father_name}</td>
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
