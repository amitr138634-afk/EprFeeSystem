import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, UserCheck, UserX, Clock, CalendarOff, Printer, Download } from 'lucide-react'
import { attendanceApi, staffApi } from '../../services/api'
import { format } from 'date-fns'

const listOf = (r) => r.data.results || r.data

const STATUS_META = {
  present:  { label: 'Present',   badge: 'badge badge-green' },
  absent:   { label: 'Absent',    badge: 'badge badge-red' },
  late:     { label: 'Late',      badge: 'badge badge-yellow' },
  half_day: { label: 'Half Day',  badge: 'bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-semibold' },
  leave:    { label: 'On Leave',  badge: 'bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold' },
  holiday:  { label: 'Holiday',   badge: 'badge badge-gray' },
}

export default function DateWiseStaffSummary() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [date, setDate] = useState(today)
  const [deptId, setDeptId] = useState('')

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => staffApi.departments().then(listOf),
  })

  const params = { date, ...(deptId && { department_id: deptId }) }

  const { data: roster = [], isLoading, isFetching } = useQuery({
    queryKey: ['staff-roster-summary', params],
    queryFn: () => attendanceApi.staffRoster(params).then(listOf),
    enabled: !!date,
  })

  const loading = isLoading || isFetching

  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, late: 0, half_day: 0, leave: 0, holiday: 0, unmarked: 0 }
    roster.forEach(r => {
      if (!r.marked || !r.status) c.unmarked++
      else if (c[r.status] !== undefined) c[r.status]++
    })
    return c
  }, [roster])

  const statCards = [
    { label: 'Total Staff', value: roster.length, icon: Users,      iconColor: 'text-gray-500',   bg: 'bg-gray-100' },
    { label: 'Present',     value: counts.present, icon: UserCheck,  iconColor: 'text-green-600',  bg: 'bg-green-50' },
    { label: 'Absent',      value: counts.absent,  icon: UserX,      iconColor: 'text-red-600',    bg: 'bg-red-50' },
    { label: 'Late',        value: counts.late,    icon: Clock,      iconColor: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'On Leave',    value: counts.leave,   icon: CalendarOff,iconColor: 'text-blue-600',   bg: 'bg-blue-50' },
  ]

  const handlePrint = () => window.print()
  const handleExport = () => {
    const csv = [
      ['Emp ID', 'Staff Name', 'Designation', 'Department', 'Status', 'Time In', 'Time Out', 'Remarks'].join(','),
      ...roster.map(r => [
        r.employee_id, `"${r.staff_name}"`, `"${r.designation}"`, `"${r.department}"`,
        r.marked ? (STATUS_META[r.status]?.label || r.status) : 'Not Marked',
        r.check_in || '', r.check_out || '', `"${r.remarks || ''}"`,
      ].join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `staff-attendance-${date}.csv`
    a.click()
  }

  const rate = roster.length
    ? (((counts.present + counts.late + counts.half_day * 0.5) / roster.length) * 100).toFixed(1)
    : '—'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Date-wise Staff Summary</h1>
          <p className="text-sm text-gray-500">View staff attendance for a specific date</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2"><Printer size={15} /> Print</button>
          <button onClick={handleExport} className="btn-primary flex items-center gap-2"><Download size={15} /> Export</button>
        </div>
      </div>

      <div className="card p-4 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="form-label">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">Department</label>
            <select className="form-input" value={deptId} onChange={e => setDeptId(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading && <div className="card p-10 text-center text-gray-400">Loading attendance...</div>}
      {!loading && roster.length === 0 && (
        <div className="card p-10 text-center text-gray-400">No active staff found for the selected filters</div>
      )}

      {!loading && roster.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 print:hidden">
            {statCards.map(({ label, value, icon: Icon, iconColor, bg }) => (
              <div key={label} className={`card p-4 flex items-center gap-3 ${bg}`}>
                <div className={`rounded-full p-2 bg-white shadow-sm ${iconColor}`}><Icon size={18} /></div>
                <div>
                  <div className="text-xl font-bold text-gray-800">{value}</div>
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden print:block mb-2 text-center border-b-2 border-gray-300 pb-2">
            <h2 className="text-lg font-bold">Staff Attendance — {new Date(date).toLocaleDateString()}</h2>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Emp ID</th>
                    <th className="px-3 py-2 text-left">Staff Name</th>
                    <th className="px-3 py-2 text-left">Designation</th>
                    <th className="px-3 py-2 text-left">Department</th>
                    <th className="px-3 py-2 text-center">Status</th>
                    <th className="px-3 py-2 text-center">Time In</th>
                    <th className="px-3 py-2 text-center">Time Out</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((r, idx) => {
                    const meta = r.marked && r.status ? STATUS_META[r.status] : null
                    return (
                      <tr key={r.staff_id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                        <td className="px-3 py-2.5 text-gray-600">{r.employee_id}</td>
                        <td className="px-3 py-2.5 font-medium text-gray-800">{r.staff_name}</td>
                        <td className="px-3 py-2.5 text-gray-600">{r.designation || '—'}</td>
                        <td className="px-3 py-2.5 text-gray-600">{r.department || '—'}</td>
                        <td className="px-3 py-2.5 text-center">
                          {meta
                            ? <span className={meta.badge}>{meta.label}</span>
                            : <span className="badge badge-gray">Not Marked</span>}
                        </td>
                        <td className="px-3 py-2.5 text-center text-gray-600">{r.check_in || <span className="text-gray-300">—</span>}</td>
                        <td className="px-3 py-2.5 text-center text-gray-600">{r.check_out || <span className="text-gray-300">—</span>}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500">
              <span className="font-medium text-gray-600">Summary for {date}:</span>
              <span className="text-green-700 font-semibold">Present: {counts.present}</span>
              <span className="text-red-700 font-semibold">Absent: {counts.absent}</span>
              <span className="text-yellow-700 font-semibold">Late: {counts.late}</span>
              <span className="text-orange-700 font-semibold">Half Day: {counts.half_day}</span>
              <span className="text-blue-700 font-semibold">Leave: {counts.leave}</span>
              <span className="text-gray-500 font-semibold">Not Marked: {counts.unmarked}</span>
              <span className="ml-auto">Attendance Rate: <span className="font-semibold text-gray-700">{rate}%</span></span>
            </div>
          </div>
        </>
      )}

      <style>{`@media print { .print\\:hidden { display: none !important; } .print\\:block { display: block !important; } body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }`}</style>
    </div>
  )
}
