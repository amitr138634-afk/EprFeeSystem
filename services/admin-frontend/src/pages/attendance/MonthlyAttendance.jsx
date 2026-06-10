import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { attendanceApi, studentApi } from '../../services/api'

const MONTHS = [
  { value: 1,  label: 'January' },  { value: 2,  label: 'February' },
  { value: 3,  label: 'March' },    { value: 4,  label: 'April' },
  { value: 5,  label: 'May' },      { value: 6,  label: 'June' },
  { value: 7,  label: 'July' },     { value: 8,  label: 'August' },
  { value: 9,  label: 'September' },{ value: 10, label: 'October' },
  { value: 11, label: 'November' }, { value: 12, label: 'December' },
]

function PercentageBadge({ value }) {
  const pct = parseFloat(value) || 0
  if (pct >= 75) return <span className="badge badge-green">{pct.toFixed(1)}%</span>
  if (pct >= 50) return <span className="badge badge-yellow">{pct.toFixed(1)}%</span>
  return <span className="badge badge-red">{pct.toFixed(1)}%</span>
}

export default function MonthlyAttendance() {
  const now = new Date()
  const [classId,   setClassId]   = useState('')
  const [sectionId, setSectionId] = useState('')
  const [month,     setMonth]     = useState(now.getMonth() + 1)
  const [year,      setYear]      = useState(now.getFullYear())

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => studentApi.classes().then(r => r.data.results || r.data),
  })

  const { data: sections = [] } = useQuery({
    queryKey: ['sections', classId],
    queryFn: () => studentApi.sections({ class_id: classId }).then(r => r.data.results || r.data),
    enabled: !!classId,
  })

  const { data: summary = [], isLoading, isFetching } = useQuery({
    queryKey: ['attendance-summary', classId, sectionId, month, year],
    queryFn:  () =>
      attendanceApi.summary({ class_id: classId, section_id: sectionId, month, year })
        .then(r => r.data.results || r.data),
    enabled: !!classId && !!sectionId,
  })

  const loading = isLoading || isFetching

  // Aggregate totals for stat cards
  const totals = summary.reduce(
    (acc, row) => ({
      present:    acc.present    + (row.present    || 0),
      absent:     acc.absent     + (row.absent     || 0),
      late:       acc.late       + (row.late       || 0),
      leave:      acc.leave      + (row.leave      || 0),
      total_days: acc.total_days + (row.total_days || 0),
    }),
    { present: 0, absent: 0, late: 0, leave: 0, total_days: 0 }
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Monthly Attendance Summary</h1>
        <p className="text-sm text-gray-500">Student-wise monthly attendance overview</p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="form-label">Class</label>
            <select
              value={classId}
              onChange={e => { setClassId(e.target.value); setSectionId('') }}
              className="form-input"
            >
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Section</label>
            <select
              value={sectionId}
              onChange={e => setSectionId(e.target.value)}
              className="form-input"
              disabled={!classId}
            >
              <option value="">Select Section</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Month</label>
            <select value={month} onChange={e => setMonth(Number(e.target.value))} className="form-input">
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Year</label>
            <input
              type="number"
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="form-input"
              min="2000"
              max="2100"
            />
          </div>
        </div>
      </div>

      {/* Empty / loading states */}
      {(!classId || !sectionId) && (
        <div className="card p-10 text-center text-gray-400">
          Select class and section to view the monthly summary
        </div>
      )}

      {classId && sectionId && loading && (
        <div className="card p-10 text-center text-gray-400">Loading summary...</div>
      )}

      {classId && sectionId && !loading && summary.length === 0 && (
        <div className="card p-10 text-center text-gray-400">
          No attendance records found for the selected filters
        </div>
      )}

      {/* Stat cards */}
      {classId && sectionId && !loading && summary.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Working Days', value: totals.total_days, color: 'text-gray-700' },
              { label: 'Total Present', value: totals.present,    color: 'text-green-600' },
              { label: 'Total Absent',  value: totals.absent,     color: 'text-red-600' },
              { label: 'Total Late',    value: totals.late,       color: 'text-yellow-600' },
              { label: 'Total Leave',   value: totals.leave,      color: 'text-blue-600' },
            ].map(stat => (
              <div key={stat.label} className="card p-4 text-center">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="card p-0 overflow-hidden">
            <div className="table-container overflow-x-auto">
              <table className="data-table text-sm">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Adm. No.</th>
                    <th className="px-3 py-2 text-left">Student Name</th>
                    <th className="px-3 py-2 text-center">Working Days</th>
                    <th className="px-3 py-2 text-center text-green-700">Present</th>
                    <th className="px-3 py-2 text-center text-red-700">Absent</th>
                    <th className="px-3 py-2 text-center text-yellow-700">Late</th>
                    <th className="px-3 py-2 text-center text-blue-700">Leave</th>
                    <th className="px-3 py-2 text-center">Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((row, idx) => (
                    <tr key={row.student_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                      <td className="px-3 py-2.5">{row.admission_no}</td>
                      <td className="px-3 py-2.5 font-medium text-gray-800">{row.student_name}</td>
                      <td className="px-3 py-2.5 text-center">{row.total_days}</td>
                      <td className="px-3 py-2.5 text-center text-green-700 font-semibold">{row.present}</td>
                      <td className="px-3 py-2.5 text-center text-red-700 font-semibold">{row.absent}</td>
                      <td className="px-3 py-2.5 text-center text-yellow-700 font-semibold">{row.late}</td>
                      <td className="px-3 py-2.5 text-center text-blue-700 font-semibold">{row.leave}</td>
                      <td className="px-3 py-2.5 text-center">
                        <PercentageBadge value={row.percentage} />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-semibold border-t-2 border-gray-200 text-sm">
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-gray-700">Grand Total</td>
                    <td className="px-3 py-2 text-center">{totals.total_days}</td>
                    <td className="px-3 py-2 text-center text-green-700">{totals.present}</td>
                    <td className="px-3 py-2 text-center text-red-700">{totals.absent}</td>
                    <td className="px-3 py-2 text-center text-yellow-700">{totals.late}</td>
                    <td className="px-3 py-2 text-center text-blue-700">{totals.leave}</td>
                    <td className="px-3 py-2 text-center text-gray-500">
                      {totals.total_days > 0
                        ? `${((totals.present / totals.total_days) * 100).toFixed(1)}%`
                        : '—'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
