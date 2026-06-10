import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, UserCheck, UserX, Clock, CalendarOff } from 'lucide-react'
import { attendanceApi } from '../../services/api'
import { format } from 'date-fns'

const STATUS_BADGE = {
  present: 'badge badge-green',
  absent:  'badge badge-red',
  late:    'badge badge-yellow',
  leave:   'bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold',
}

const STATUS_LABEL = {
  present: 'Present',
  absent:  'Absent',
  late:    'Late',
  leave:   'Leave',
}

export default function DateWiseStaffSummary() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [date, setDate] = useState(today)

  const { data: staffRecords = [], isLoading, isFetching } = useQuery({
    queryKey: ['staff-attendance-list', date],
    queryFn:  () =>
      attendanceApi.staffList({ date }).then(r => r.data.results || r.data),
    enabled: !!date,
  })

  const loading = isLoading || isFetching

  // Count by status
  const counts = staffRecords.reduce(
    (acc, row) => {
      const st = row.status?.toLowerCase()
      if (acc[st] !== undefined) acc[st]++
      return acc
    },
    { present: 0, absent: 0, late: 0, leave: 0 }
  )

  const statCards = [
    { label: 'Total Staff', value: staffRecords.length, icon: Users,       iconColor: 'text-gray-500',   bg: 'bg-gray-100' },
    { label: 'Present',     value: counts.present,       icon: UserCheck,   iconColor: 'text-green-600',  bg: 'bg-green-50' },
    { label: 'Absent',      value: counts.absent,        icon: UserX,       iconColor: 'text-red-600',    bg: 'bg-red-50' },
    { label: 'Late',        value: counts.late,          icon: Clock,       iconColor: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'On Leave',    value: counts.leave,         icon: CalendarOff, iconColor: 'text-blue-600',   bg: 'bg-blue-50' },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Date-wise Staff Summary</h1>
        <p className="text-sm text-gray-500">View staff attendance for a specific date</p>
      </div>

      {/* Date Filter */}
      <div className="card p-4">
        <div className="flex items-end gap-4">
          <div>
            <label className="form-label">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="form-input"
            />
          </div>
        </div>
      </div>

      {loading && (
        <div className="card p-10 text-center text-gray-400">Loading attendance...</div>
      )}

      {!loading && staffRecords.length === 0 && (
        <div className="card p-10 text-center text-gray-400">
          No staff attendance records found for{' '}
          <span className="font-medium text-gray-600">{date}</span>
        </div>
      )}

      {!loading && staffRecords.length > 0 && (
        <>
          {/* Summary stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {statCards.map(({ label, value, icon: Icon, iconColor, bg }) => (
              <div key={label} className={`card p-4 flex items-center gap-3 ${bg}`}>
                <div className={`rounded-full p-2 bg-white shadow-sm ${iconColor}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-800">{value}</div>
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Attendance table */}
          <div className="card p-0 overflow-hidden">
            <div className="table-container overflow-x-auto">
              <table className="data-table text-sm">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Staff Name</th>
                    <th className="px-3 py-2 text-left">Designation</th>
                    <th className="px-3 py-2 text-center">Status</th>
                    <th className="px-3 py-2 text-center">Time In</th>
                    <th className="px-3 py-2 text-center">Time Out</th>
                  </tr>
                </thead>
                <tbody>
                  {staffRecords.map((row, idx) => {
                    const st = row.status?.toLowerCase()
                    return (
                      <tr key={row.staff_id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                        <td className="px-3 py-2.5 font-medium text-gray-800">{row.staff_name}</td>
                        <td className="px-3 py-2.5 text-gray-600">{row.designation || '—'}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={STATUS_BADGE[st] || 'badge'}>
                            {STATUS_LABEL[st] || row.status || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center text-gray-600">
                          {row.time_in || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-3 py-2.5 text-center text-gray-600">
                          {row.time_out || <span className="text-gray-300">—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer summary bar */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500">
              <span className="font-medium text-gray-600">Summary for {date}:</span>
              <span className="text-green-700 font-semibold">Present: {counts.present}</span>
              <span className="text-red-700 font-semibold">Absent: {counts.absent}</span>
              <span className="text-yellow-700 font-semibold">Late: {counts.late}</span>
              <span className="text-blue-700 font-semibold">Leave: {counts.leave}</span>
              <span className="ml-auto">
                Attendance Rate:{' '}
                <span className="font-semibold text-gray-700">
                  {staffRecords.length > 0
                    ? `${(((counts.present + counts.late) / staffRecords.length) * 100).toFixed(1)}%`
                    : '—'}
                </span>
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
