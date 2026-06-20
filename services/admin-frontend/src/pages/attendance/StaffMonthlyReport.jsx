import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Printer, Download, LayoutGrid, List } from 'lucide-react'
import { attendanceApi, staffApi } from '../../services/api'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
].map((label, i) => ({ value: i + 1, label }))

const listOf = (r) => r.data.results || r.data

const pctClass = (p) =>
  p == null ? 'text-gray-400'
    : p >= 90 ? 'text-green-600 font-semibold'
    : p >= 75 ? 'text-yellow-600 font-semibold'
    : 'text-red-600 font-semibold'

const CODE_COLOR = {
  P: 'text-green-600', A: 'text-red-600', L: 'text-yellow-600',
  H: 'text-orange-600', LE: 'text-blue-600', HO: 'text-gray-500',
}

export default function StaffMonthlyReport() {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())
  const [deptId, setDeptId] = useState('')
  const [desigId, setDesigId] = useState('')
  const [staffType, setStaffType] = useState('')
  const [view, setView] = useState('summary') // 'summary' | 'grid'

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => staffApi.departments().then(listOf),
  })
  const { data: designations = [] } = useQuery({
    queryKey: ['designations'],
    queryFn: () => staffApi.designations({ status: 'active' }).then(listOf),
  })

  const params = {
    month, year,
    ...(deptId && { department_id: deptId }),
    ...(desigId && { designation_id: desigId }),
    ...(staffType && { staff_type: staffType }),
  }

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['staffMonthly', params],
    queryFn: () => attendanceApi.staffMonthly(params).then(listOf),
  })

  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [month, year])
  const dayList = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth])

  const handlePrint = () => window.print()

  const handleExport = () => {
    const header = ['Emp ID', 'Staff Name', 'Designation', 'Department', 'Present', 'Absent', 'Late', 'Half', 'Leave', 'Holiday', 'Attendance %']
    const csv = [
      header.join(','),
      ...rows.map(r => [
        r.employee_id, `"${r.staff_name}"`, `"${r.designation}"`, `"${r.department}"`,
        r.present_days, r.absent_days, r.late_days, r.half_days, r.leave_days, r.holiday_days,
        r.attendance_percentage ?? '',
      ].join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `staff-monthly-${year}-${month}.csv`
    a.click()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Staff Monthly Report</h1>
          <p className="text-sm text-gray-500">Monthly attendance summary for staff</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView(view === 'summary' ? 'grid' : 'summary')} className="btn-secondary flex items-center gap-2">
            {view === 'summary' ? <><LayoutGrid size={15} /> Grid View</> : <><List size={15} /> Summary View</>}
          </button>
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2"><Printer size={15} /> Print</button>
          <button onClick={handleExport} className="btn-primary flex items-center gap-2"><Download size={15} /> Export</button>
        </div>
      </div>

      <div className="card p-4 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="form-label">Month</label>
            <select className="form-input" value={month} onChange={e => setMonth(Number(e.target.value))}>
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Year</label>
            <input type="number" className="form-input" value={year} onChange={e => setYear(Number(e.target.value))} min={2000} max={2100} />
          </div>
          <div>
            <label className="form-label">Department</label>
            <select className="form-input" value={deptId} onChange={e => setDeptId(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Designation</label>
            <select className="form-input" value={desigId} onChange={e => setDesigId(e.target.value)}>
              <option value="">All Designations</option>
              {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Staff Type</label>
            <select className="form-input" value={staffType} onChange={e => setStaffType(e.target.value)}>
              <option value="">All Types</option>
              <option value="teaching">Teaching</option>
              <option value="non_teaching">Non-Teaching</option>
            </select>
          </div>
        </div>
      </div>

      <div className="hidden print:block mb-2 text-center border-b-2 border-gray-300 pb-2">
        <h2 className="text-lg font-bold">Staff Monthly Attendance — {MONTHS[month - 1].label} {year}</h2>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {view === 'summary' ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Emp ID</th>
                  <th className="px-3 py-2 text-left">Staff Name</th>
                  <th className="px-3 py-2 text-left">Designation</th>
                  <th className="px-3 py-2 text-center">P</th>
                  <th className="px-3 py-2 text-center">A</th>
                  <th className="px-3 py-2 text-center">L</th>
                  <th className="px-3 py-2 text-center">HD</th>
                  <th className="px-3 py-2 text-center">Leave</th>
                  <th className="px-3 py-2 text-center">Holiday</th>
                  <th className="px-3 py-2 text-center">Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && <tr><td colSpan={11} className="text-center py-8 text-gray-400">Loading...</td></tr>}
                {!isLoading && rows.length === 0 && <tr><td colSpan={11} className="text-center py-8 text-gray-400">No records found</td></tr>}
                {rows.map((r, i) => (
                  <tr key={r.staff_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2 text-gray-600">{r.employee_id}</td>
                    <td className="px-3 py-2 font-medium text-gray-800">{r.staff_name}</td>
                    <td className="px-3 py-2 text-gray-600">{r.designation || '—'}</td>
                    <td className="px-3 py-2 text-center text-green-700">{r.present_days}</td>
                    <td className="px-3 py-2 text-center text-red-700">{r.absent_days}</td>
                    <td className="px-3 py-2 text-center text-yellow-700">{r.late_days}</td>
                    <td className="px-3 py-2 text-center text-orange-700">{r.half_days}</td>
                    <td className="px-3 py-2 text-center text-blue-700">{r.leave_days}</td>
                    <td className="px-3 py-2 text-center text-gray-500">{r.holiday_days}</td>
                    <td className={`px-3 py-2 text-center ${pctClass(r.attendance_percentage)}`}>
                      {r.attendance_percentage != null ? `${r.attendance_percentage}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                  <th className="px-2 py-2 text-left sticky left-0 bg-gray-50 z-10 min-w-[160px]">Staff</th>
                  {dayList.map(d => <th key={d} className="px-1.5 py-2 text-center w-7">{d}</th>)}
                  <th className="px-2 py-2 text-center">%</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && <tr><td colSpan={daysInMonth + 2} className="text-center py-8 text-gray-400">Loading...</td></tr>}
                {!isLoading && rows.length === 0 && <tr><td colSpan={daysInMonth + 2} className="text-center py-8 text-gray-400">No records found</td></tr>}
                {rows.map(r => (
                  <tr key={r.staff_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-2 py-2 font-medium text-gray-800 sticky left-0 bg-white z-10">{r.staff_name}</td>
                    {dayList.map(d => {
                      const code = r.days?.[d]
                      return (
                        <td key={d} className={`px-1.5 py-2 text-center font-semibold ${code ? CODE_COLOR[code] || 'text-gray-700' : 'text-gray-200'}`}>
                          {code || '·'}
                        </td>
                      )
                    })}
                    <td className={`px-2 py-2 text-center ${pctClass(r.attendance_percentage)}`}>
                      {r.attendance_percentage != null ? `${r.attendance_percentage}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <style>{`@media print { .print\\:hidden { display: none !important; } .print\\:block { display: block !important; } body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }`}</style>
    </div>
  )
}
