import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Sunrise, Sunset, Save, CheckCircle2, XCircle, Users } from 'lucide-react'
import { transportApi, masterApi } from '../../services/api'

const listOf = (r) => r.data.results || r.data
const today = () => new Date().toISOString().split('T')[0]

export default function TransportAttendance() {
  const qc = useQueryClient()
  const [routeId, setRouteId] = useState('')
  const [tripType, setTripType] = useState('morning')
  const [date, setDate] = useState(today())
  const [statusByStudent, setStatusByStudent] = useState({})

  const { data: routes = [] } = useQuery({
    queryKey: ['routes-attendance'],
    queryFn: () => transportApi.routes().then(listOf),
  })

  const { data: statusOptions = [] } = useQuery({
    queryKey: ['attendance-status-options'],
    queryFn: () => masterApi.getAttendanceMaster().then(r => listOf(r).filter(s => s.status)),
  })

  const defaultStatusId = statusOptions.find(s => s.status_name.toLowerCase() === 'present')?.id
    ?? statusOptions[0]?.id ?? ''

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['route-attendance', routeId, tripType, date],
    queryFn: () => transportApi.routeAttendance({ route_id: routeId, trip_type: tripType, date }).then(r => r.data),
    enabled: !!routeId,
  })

  const students = data?.students || []

  useEffect(() => {
    const map = {}
    for (const s of students) map[s.student_id] = s.status_id
    setStatusByStudent(map)
  }, [data])

  const setStatusFor = (studentId, value) => setStatusByStudent(prev => ({ ...prev, [studentId]: value }))
  const markAll = (statusId) => setStatusByStudent(Object.fromEntries(students.map(s => [s.student_id, statusId])))

  const saveMutation = useMutation({
    mutationFn: () => transportApi.saveRouteAttendance({
      route_id: routeId, trip_type: tripType, date,
      records: students.map(s => ({ student_id: s.student_id, status_id: statusByStudent[s.student_id] ?? defaultStatusId })),
    }),
    onSuccess: (res) => {
      toast.success(res.data?.detail || 'Attendance saved!')
      qc.invalidateQueries(['route-attendance', routeId, tripType, date])
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to save attendance'),
  })

  const statusNameById = Object.fromEntries(statusOptions.map(s => [s.id, s.status_name]))
  const presentOption = statusOptions.find(s => s.status_name.toLowerCase() === 'present')
  const absentOption = statusOptions.find(s => s.status_name.toLowerCase() === 'absent')

  // Tally per status so any admin-defined status (Leave, Half Day, etc.) shows up too.
  const counts = {}
  for (const v of Object.values(statusByStudent)) counts[v] = (counts[v] || 0) + 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Transport Attendance</h1>
        <p className="text-sm text-gray-500 mt-1">Route-wise morning/evening attendance for students using transport</p>
      </div>

      <div className="card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Route</label>
            <select className="form-select" value={routeId} onChange={e => setRouteId(e.target.value)}>
              <option value="">Select Route</option>
              {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Trip</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTripType('morning')}
                className={tripType === 'morning' ? 'btn-primary flex-1 justify-center' : 'btn-secondary flex-1 justify-center'}
              >
                <Sunrise size={16} /> Morning
              </button>
              <button
                type="button"
                onClick={() => setTripType('evening')}
                className={tripType === 'evening' ? 'btn-primary flex-1 justify-center' : 'btn-secondary flex-1 justify-center'}
              >
                <Sunset size={16} /> Evening
              </button>
            </div>
          </div>
          <div>
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
      </div>

      {!routeId ? (
        <div className="card p-10 text-center text-sm text-gray-400">Select a route to load its students.</div>
      ) : isLoading || isFetching ? (
        <div className="card p-10 text-center text-sm text-gray-400">Loading students...</div>
      ) : students.length === 0 ? (
        <div className="card p-10 text-center text-sm text-gray-400">No students are assigned to this route.</div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-3">
              <div className="stat-card">
                <p className="stat-label flex items-center gap-1"><Users size={12} /> Total</p>
                <p className="stat-value">{students.length}</p>
              </div>
              {Object.entries(counts).map(([statusId, n]) => (
                <div key={statusId} className="stat-card">
                  <p className="stat-label">{statusNameById[statusId] || 'Unknown'}</p>
                  <p className="stat-value">{n}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              {presentOption && (
                <button onClick={() => markAll(presentOption.id)} className="btn-secondary btn-sm"><CheckCircle2 size={14} className="text-green-600" /> Mark All {presentOption.status_name}</button>
              )}
              {absentOption && (
                <button onClick={() => markAll(absentOption.id)} className="btn-secondary btn-sm"><XCircle size={14} className="text-red-600" /> Mark All {absentOption.status_name}</button>
              )}
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Admission No</th><th>Student Name</th><th>Stop</th><th className="text-center">Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => {
                    const value = statusByStudent[s.student_id] ?? defaultStatusId
                    return (
                      <tr key={s.student_id}>
                        <td className="font-medium text-gray-900">{s.admission_no}</td>
                        <td>{s.student_name}</td>
                        <td className="text-gray-500">{s.stop_name}</td>
                        <td>
                          <div className="flex justify-center">
                            <select
                              className="form-select max-w-[140px]"
                              value={value}
                              onChange={e => setStatusFor(s.student_id, Number(e.target.value))}
                            >
                              {statusOptions.map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.status_name}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="btn-primary btn-lg">
              {saveMutation.isPending ? 'Saving...' : <><Save size={18} /> Save Attendance</>}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
