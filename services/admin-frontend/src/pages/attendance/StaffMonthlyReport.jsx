import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { attendanceApi } from '../../services/api'

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

export default function StaffMonthlyReport() {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['staffMonthlyReport', month, year],
    queryFn: () => attendanceApi.staffList({ month, year }).then(r => r.data.results || r.data),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Staff Monthly Report</h1><p className="page-sub">Monthly attendance summary for all staff</p></div>
      </div>

      <div className="card p-4">
        <div className="flex gap-4 items-end">
          <div>
            <label className="form-label">Month</label>
            <select className="form-input" value={month} onChange={e => setMonth(Number(e.target.value))}>
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Year</label>
            <input
              type="number"
              className="form-input"
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              min={2000}
              max={2100}
              style={{ width: 100 }}
            />
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Staff Name</th>
              <th>Designation</th>
              <th>Present Days</th>
              <th>Absent Days</th>
              <th>Late Days</th>
              <th>Attendance %</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td></tr>}
            {!isLoading && records.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">No records found</td></tr>}
            {records.map((d, i) => (
              <tr key={d.id || i}>
                <td className="text-gray-500">{i+1}</td>
                <td className="font-medium">{d.staff_name}</td>
                <td>{d.designation}</td>
                <td>{d.present_days}</td>
                <td>{d.absent_days}</td>
                <td>{d.late_days}</td>
                <td>
                  <span className={
                    (d.attendance_percentage ?? 0) >= 90
                      ? 'text-green-600 font-medium'
                      : (d.attendance_percentage ?? 0) >= 75
                        ? 'text-yellow-600 font-medium'
                        : 'text-red-600 font-medium'
                  }>
                    {d.attendance_percentage != null ? `${d.attendance_percentage}%` : '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
