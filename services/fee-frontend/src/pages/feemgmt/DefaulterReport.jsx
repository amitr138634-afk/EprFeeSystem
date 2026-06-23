import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { feeApi, masterApi } from '../../services/api'
import useAuthStore from '../../store/authStore'

const MONTHS = [
  { v: 'apr', l: 'April' }, { v: 'may', l: 'May' }, { v: 'jun', l: 'June' }, { v: 'jul', l: 'July' },
  { v: 'aug', l: 'August' }, { v: 'sep', l: 'September' }, { v: 'oct', l: 'October' }, { v: 'nov', l: 'November' },
  { v: 'dec', l: 'December' }, { v: 'jan', l: 'January' }, { v: 'feb', l: 'February' }, { v: 'mar', l: 'March' },
]

const listOf = (r) => r.data.results || r.data

export default function DefaulterReport() {
  const navigate = useNavigate()
  const activeSession = useAuthStore(s => s.currentSession?.session_year) || ''
  const [fromMonth, setFromMonth] = useState('')
  const [toMonth, setToMonth] = useState('')
  const [className, setClassName] = useState('')
  const [section, setSection] = useState('')

  const { data: classes = [] } = useQuery({
    queryKey: ['classes-period-defaulters'],
    queryFn: () => masterApi.classes().then(listOf),
  })
  const { data: sections = [] } = useQuery({
    queryKey: ['sections-period-defaulters'],
    queryFn: () => masterApi.getSectionMaster().then(listOf),
  })

  const params = {
    session: activeSession,
    ...(fromMonth && { from_month: fromMonth }),
    ...(toMonth && { to_month: toMonth }),
    ...(className && { class_name: className }),
    ...(section && { section }),
  }

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['period-defaulters', params],
    queryFn: () => feeApi.periodDefaulters(params).then(r => r.data),
  })

  const totals = rows.reduce((acc, r) => ({
    due: acc.due + r.total_due, paid: acc.paid + r.total_paid, balance: acc.balance + r.total_balance,
  }), { due: 0, paid: 0, balance: 0 })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Defaulter Report</h1>
        <p className="text-sm text-gray-500 mt-1">Students who haven't fully paid for the selected period — filter by month range, class, and section</p>
      </div>

      <div className="card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="form-label">From Month</label>
            <select className="form-select" value={fromMonth} onChange={e => setFromMonth(e.target.value)}>
              <option value="">Full Year</option>
              {MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">To Month</label>
            <select className="form-select" value={toMonth} onChange={e => setToMonth(e.target.value)}>
              <option value="">Full Year</option>
              {MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
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
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="stat-card"><p className="stat-label">Due ({fromMonth && toMonth ? 'Selected Period' : 'Full Year'})</p><p className="stat-value">₹{totals.due.toLocaleString('en-IN')}</p></div>
        <div className="stat-card"><p className="stat-label">Paid</p><p className="stat-value text-green-600">₹{totals.paid.toLocaleString('en-IN')}</p></div>
        <div className="stat-card"><p className="stat-label">Outstanding Balance</p><p className="stat-value text-red-600">₹{totals.balance.toLocaleString('en-IN')}</p></div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Admission No</th><th>Student Name</th><th>Class</th><th>Section</th><th>Father Mobile</th>
              <th className="text-right">Due</th><th className="text-right">Paid</th><th className="text-right">Balance</th><th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={9} className="text-center py-8 text-gray-400">Loading...</td></tr>}
            {!isLoading && rows.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-gray-400">No defaulters found for this period — everyone's paid up!</td></tr>}
            {rows.map(r => (
              <tr key={r.student_id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/feemgmt/student-profile/${r.student_id}`)}>
                <td className="font-medium text-gray-900">{r.admission_no}</td>
                <td>{r.student_name}</td>
                <td>{r.class_name}</td>
                <td>{r.section}</td>
                <td>{r.father_mobile}</td>
                <td className="text-right">₹{r.total_due.toLocaleString('en-IN')}</td>
                <td className="text-right text-green-600">₹{r.total_paid.toLocaleString('en-IN')}</td>
                <td className="text-right font-semibold text-red-600">₹{r.total_balance.toLocaleString('en-IN')}</td>
                <td className="text-blue-600 text-xs">View →</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
