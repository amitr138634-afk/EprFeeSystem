import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Save } from 'lucide-react'
import { attendanceApi, staffApi } from '../../services/api'
import { format } from 'date-fns'

const STATUS_OPTIONS = [
  { value: 'present', label: 'P',  color: 'bg-green-500' },
  { value: 'absent',  label: 'A',  color: 'bg-red-500' },
  { value: 'late',    label: 'L',  color: 'bg-yellow-500' },
  { value: 'leave',   label: 'LE', color: 'bg-blue-500' },
]

export default function StaffAttendance() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [date,       setDate]       = useState(today)
  const [attendance, setAttendance] = useState({})

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ['staff-active'],
    queryFn:  () =>
      staffApi.list({ status: 'active' }).then(r => {
        const list = r.data.results || r.data
        const initial = {}
        list.forEach(s => { initial[s.id] = 'present' })
        setAttendance(initial)
        return list
      }),
  })

  const saveMutation = useMutation({
    mutationFn: () =>
      attendanceApi.markStaff({
        date,
        attendances: staffList.map(s => ({
          staff_id: s.id,
          status:   attendance[s.id] || 'present',
        })),
      }),
    onSuccess: () => toast.success('Staff attendance saved successfully!'),
    onError:   () => toast.error('Failed to save attendance'),
  })

  const markAll = (status) => {
    const updated = {}
    staffList.forEach(s => { updated[s.id] = status })
    setAttendance(updated)
  }

  const setStatus = (staffId, status) => {
    setAttendance(prev => ({ ...prev, [staffId]: status }))
  }

  // Count summary
  const counts = { present: 0, absent: 0, late: 0, leave: 0 }
  staffList.forEach(s => {
    const st = attendance[s.id]
    if (st && counts[st] !== undefined) counts[st]++
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Staff Attendance</h1>
          <p className="text-sm text-gray-500">Mark daily attendance for all active staff</p>
        </div>
      </div>

      {/* Date & quick stats */}
      <div className="card p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="form-label">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="form-input"
            />
          </div>
          {staffList.length > 0 && (
            <div className="flex gap-3 text-sm pb-0.5">
              <span className="text-green-600 font-semibold">P: {counts.present}</span>
              <span className="text-red-600 font-semibold">A: {counts.absent}</span>
              <span className="text-yellow-600 font-semibold">L: {counts.late}</span>
              <span className="text-blue-600 font-semibold">LE: {counts.leave}</span>
            </div>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="card p-10 text-center text-gray-400">Loading staff list...</div>
      )}

      {!isLoading && staffList.length === 0 && (
        <div className="card p-10 text-center text-gray-400">No active staff found</div>
      )}

      {!isLoading && staffList.length > 0 && (
        <div className="card p-4">
          {/* Mark All + Legend */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm text-gray-600 font-medium">Mark All:</span>
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => markAll(opt.value)}
                className={`px-3 py-1 rounded text-white text-xs font-medium ${opt.color}`}
              >
                {opt.label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-3 text-xs text-gray-500">
              <span><span className="inline-block w-3 h-3 bg-green-500 rounded mr-1"></span>Present</span>
              <span><span className="inline-block w-3 h-3 bg-red-500 rounded mr-1"></span>Absent</span>
              <span><span className="inline-block w-3 h-3 bg-yellow-500 rounded mr-1"></span>Late</span>
              <span><span className="inline-block w-3 h-3 bg-blue-500 rounded mr-1"></span>Leave</span>
            </div>
          </div>

          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-3 py-2 text-left text-gray-600">#</th>
                <th className="px-3 py-2 text-left text-gray-600">Staff Name</th>
                <th className="px-3 py-2 text-left text-gray-600">Designation</th>
                <th className="px-3 py-2 text-left text-gray-600">Department</th>
                <th className="px-3 py-2 text-center text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((s, idx) => (
                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                  <td className="px-3 py-2.5 font-medium text-gray-800">
                    {s.full_name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.name}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600">{s.designation || '—'}</td>
                  <td className="px-3 py-2.5 text-gray-600">{s.department || '—'}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex justify-center gap-1">
                      {STATUS_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setStatus(s.id, opt.value)}
                          className={`w-9 h-8 rounded text-white text-xs font-bold transition-opacity ${opt.color} ${
                            attendance[s.id] === opt.value
                              ? 'opacity-100 ring-2 ring-offset-1 ring-gray-400'
                              : 'opacity-35'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isLoading}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={15} />
            {saveMutation.isLoading ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      )}
    </div>
  )
}
