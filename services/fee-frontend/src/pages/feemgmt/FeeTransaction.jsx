import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { feeApi } from '../../services/api'
import useAuthStore from '../../store/authStore'

const today = () => new Date().toISOString().split('T')[0]
const firstOfMonth = () => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0] }

export default function FeeTransaction() {
  const activeSession = useAuthStore(s => s.currentSession?.session_year) || ''
  const [fromDate, setFromDate] = useState(firstOfMonth())
  const [toDate, setToDate] = useState(today())
  const [mode, setMode] = useState('')
  const [search, setSearch] = useState('')

  const params = {
    session: activeSession, from_date: fromDate, to_date: toDate,
    ...(mode && { mode }), ...(search && { search }),
  }

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['fee-transactions', params],
    queryFn: () => feeApi.feeTransactions(params).then(r => r.data),
  })

  const totalAmount = rows.reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Fee Transaction</h1>
        <p className="text-sm text-gray-500 mt-1">Daily fee transactions — student, amount, heads, mode of payment</p>
      </div>

      <div className="card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div><label className="form-label">From Date</label><input type="date" className="form-input" value={fromDate} onChange={e => setFromDate(e.target.value)} /></div>
          <div><label className="form-label">To Date</label><input type="date" className="form-input" value={toDate} onChange={e => setToDate(e.target.value)} /></div>
          <div>
            <label className="form-label">Mode</label>
            <select className="form-select" value={mode} onChange={e => setMode(e.target.value)}>
              <option value="">All Modes</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="paytm">Paytm</option>
              <option value="online">Online</option>
              <option value="cheque">Cheque</option>
              <option value="card">Card</option>
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
        <p className="stat-label">Total Collected</p>
        <p className="stat-value text-green-600">₹{totalAmount.toLocaleString('en-IN')}</p>
        <p className="text-xs text-gray-400 mt-1">{rows.length} transaction(s)</p>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Receipt No</th><th>Date</th><th>Student</th><th>Admission No</th>
              <th>Class</th><th>Fee Heads</th><th className="text-right">Amount</th><th>Mode</th><th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={9} className="text-center py-8 text-gray-400">Loading...</td></tr>}
            {!isLoading && rows.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-gray-400">No transactions found</td></tr>}
            {rows.map(r => (
              <tr key={r.id}>
                <td className="font-medium text-gray-900">{r.rec_no}</td>
                <td>{new Date(r.date).toLocaleDateString('en-IN')}</td>
                <td>{r.student_name}</td>
                <td>{r.admission_no}</td>
                <td>{r.class_name}{r.section ? `-${r.section}` : ''}</td>
                <td className="text-xs text-gray-500">{r.heads.length} head(s)</td>
                <td className="text-right font-semibold text-green-600">₹{r.amount.toLocaleString('en-IN')}</td>
                <td><span className="badge-gray uppercase">{r.mode}</span></td>
                <td className="text-gray-500 text-xs max-w-xs truncate">{r.remarks || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
