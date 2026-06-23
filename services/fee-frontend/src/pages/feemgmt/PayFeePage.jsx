import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Wallet } from 'lucide-react'
import { feeApi } from '../../services/api'

const MONTHS = [
  { v: 'apr', l: 'April' }, { v: 'may', l: 'May' }, { v: 'jun', l: 'June' }, { v: 'jul', l: 'July' },
  { v: 'aug', l: 'August' }, { v: 'sep', l: 'September' }, { v: 'oct', l: 'October' }, { v: 'nov', l: 'November' },
  { v: 'dec', l: 'December' }, { v: 'jan', l: 'January' }, { v: 'feb', l: 'February' }, { v: 'mar', l: 'March' },
]
const MONTH_INDEX = Object.fromEntries(MONTHS.map((m, i) => [m.v, i]))

export default function PayFeePage() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const backTo = () => navigate(`/feemgmt/student-profile/${studentId}`)

  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [fromMonth, setFromMonth] = useState(MONTHS[0].v)
  const [toMonth, setToMonth] = useState(MONTHS[0].v)
  const [cells, setCells] = useState({})
  const [mode, setMode] = useState('cash')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [transId, setTransId] = useState('')
  const [remarks, setRemarks] = useState('')

  useEffect(() => {
    setLoading(true)
    feeApi.getStudentProfile(studentId)
      .then(res => {
        setStudent(res.data)
        // Default From/To to the first month that actually has a fee structure
        // (e.g. mid-year admissions/transport shouldn't default to April).
        const monthsWithDue = new Set()
        for (const head of res.data.fee_structure) {
          for (const m of head.months) if (m.due > 0) monthsWithDue.add(m.month)
        }
        const avail = MONTHS.filter(m => monthsWithDue.has(m.v))
        if (avail.length > 0) {
          setFromMonth(avail[0].v)
          setToMonth(avail[0].v)
        }
      })
      .catch(err => setError(err.response?.data?.detail || 'Error loading student profile'))
      .finally(() => setLoading(false))
  }, [studentId])

  // Only months where at least one fee head actually has a due amount are
  // selectable — a student's structure may not span the full academic year
  // (mid-year admission, transport applied from a later month, etc.).
  const structureMonths = useMemo(() => {
    if (!student) return MONTHS
    const monthsWithDue = new Set()
    for (const head of student.fee_structure) {
      for (const m of head.months) if (m.due > 0) monthsWithDue.add(m.month)
    }
    const avail = MONTHS.filter(m => monthsWithDue.has(m.v))
    return avail.length > 0 ? avail : MONTHS
  }, [student])

  const monthRange = useMemo(() => {
    const i = MONTH_INDEX[fromMonth], j = MONTH_INDEX[toMonth]
    if (i > j) return []
    return MONTHS.slice(i, j + 1)
  }, [fromMonth, toMonth])

  const balanceLookup = useMemo(() => {
    const map = {}
    if (!student) return map
    for (const head of student.fee_structure) {
      for (const m of head.months) map[`${m.month}_${head.head_number}`] = m.balance
    }
    return map
  }, [student])

  // Clamps the edited field so amount + discount can never exceed the
  // month/head's due balance — typing 300 when only ₹100 is due gets capped
  // to 100 instead of silently accepting it until the submit-time error.
  const setCell = (month, headNumber, field, value) => {
    const balance = balanceLookup[`${month}_${headNumber}`] || 0
    setCells(prev => {
      const existing = prev[month]?.[headNumber] || {}
      const num = value === '' ? null : parseFloat(value)
      let amount = existing.amount
      let discount = existing.discount
      if (field === 'amount') {
        amount = num === null || isNaN(num) ? value : String(Math.min(num, balance))
      } else {
        const amtNum = parseFloat(amount) || 0
        const maxDiscount = Math.max(0, balance - amtNum)
        discount = num === null || isNaN(num) ? value : String(Math.min(num, maxDiscount))
      }
      return { ...prev, [month]: { ...prev[month], [headNumber]: { ...existing, amount, discount } } }
    })
  }

  let totalAmount = 0, totalDiscount = 0
  if (student) {
    for (const m of monthRange) {
      for (const head of student.fee_structure) {
        const cell = cells[m.v]?.[head.head_number]
        totalAmount += parseFloat(cell?.amount) || 0
        totalDiscount += parseFloat(cell?.discount) || 0
      }
    }
  }

  const payMutation = useMutation({
    mutationFn: (payload) => feeApi.payStudentFee(studentId, payload),
    onSuccess: (res) => {
      toast.success(res.data?.detail || 'Fee payment recorded successfully!')
      backTo()
    },
    onError: (error) => {
      const errors = error.response?.data?.errors
      toast.error(errors ? errors.join(', ') : (error.response?.data?.detail || 'Failed to record payment'))
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (monthRange.length === 0) {
      toast.error('From Month must come before or equal to To Month')
      return
    }
    for (const m of monthRange) {
      for (const head of student.fee_structure) {
        const cell = cells[m.v]?.[head.head_number]
        const amt = parseFloat(cell?.amount) || 0
        const disc = parseFloat(cell?.discount) || 0
        const balance = balanceLookup[`${m.v}_${head.head_number}`] || 0
        if (amt + disc > balance + 0.01) {
          toast.error(`${head.head_name} (${m.l}): amount + discount exceeds due ₹${balance.toLocaleString('en-IN')}`)
          return
        }
      }
    }
    if (totalAmount <= 0 && totalDiscount <= 0) {
      toast.error('Enter at least one amount or discount to save')
      return
    }

    const heads_by_month = {}
    const discounts_by_month = {}
    for (const m of monthRange) {
      for (const head of student.fee_structure) {
        const cell = cells[m.v]?.[head.head_number]
        const amt = parseFloat(cell?.amount) || 0
        const disc = parseFloat(cell?.discount) || 0
        if (amt > 0) (heads_by_month[m.v] ??= {})[head.head_number] = amt
        if (disc > 0) (discounts_by_month[m.v] ??= {})[head.head_number] = disc
      }
    }

    payMutation.mutate({
      from_month: fromMonth, to_month: toMonth,
      heads_by_month, discounts_by_month,
      mode, date, remarks, trans_id: transId,
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="space-y-4 max-w-xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error || 'Student not found'}</div>
        <button onClick={backTo} className="btn-secondary"><ArrowLeft size={16} /> Back</button>
      </div>
    )
  }

  const showTransactionField = ['upi', 'paytm', 'online'].includes(mode)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <button onClick={backTo} className="btn-secondary"><ArrowLeft size={16} /> Back to Profile</button>

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600"><Wallet size={20} /></div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Pay Fee</h1>
            <p className="text-sm text-gray-500">{student.student_name} - {student.admission_no}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div>
              <label className="form-label">From Month</label>
              <select value={fromMonth} onChange={e => setFromMonth(e.target.value)} className="form-select">
                {structureMonths.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">To Month</label>
              <select value={toMonth} onChange={e => setToMonth(e.target.value)} className="form-select">
                {structureMonths.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
              </select>
            </div>
          </div>

          {monthRange.length === 0 ? (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
              From Month must come before or equal to To Month (academic year: April → March).
            </div>
          ) : (
            <div className="table-container max-h-[28rem] overflow-y-auto">
              <table className="data-table text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-white z-10">Month</th>
                    {student.fee_structure.map(h => (
                      <th key={h.head_number} className="text-center min-w-[160px]">{h.head_name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthRange.map(m => (
                    <tr key={m.v}>
                      <td className="font-medium text-gray-900 sticky left-0 bg-white">{m.l}</td>
                      {student.fee_structure.map(head => {
                        const balance = balanceLookup[`${m.v}_${head.head_number}`] || 0
                        const cell = cells[m.v]?.[head.head_number] || {}
                        return (
                          <td key={head.head_number} className="text-center">
                            <input
                              type="number" min="0" max={balance} step="0.01"
                              value={cell.amount ?? ''}
                              onChange={e => setCell(m.v, head.head_number, 'amount', e.target.value)}
                              placeholder={`Due ₹${balance.toLocaleString('en-IN')}`}
                              className="form-input text-right w-full text-sm mb-1"
                              disabled={balance <= 0}
                            />
                            <input
                              type="number" min="0" max={balance} step="0.01"
                              value={cell.discount ?? ''}
                              onChange={e => setCell(m.v, head.head_number, 'discount', e.target.value)}
                              placeholder="Discount"
                              className="form-input text-right w-full text-xs py-1 border-dashed"
                              disabled={balance <= 0}
                            />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex gap-3">
            <div className="flex-1 bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-700">Total Amount</span>
              <span className="text-xl font-bold text-green-700">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex-1 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Total Discount</span>
                <span className="text-xl font-bold text-amber-700">₹{totalDiscount.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Payment Mode</label>
              <select value={mode} onChange={e => setMode(e.target.value)} className="form-select" required>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="paytm">Paytm</option>
                <option value="online">Online Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="card">Card</option>
              </select>
            </div>
            <div>
              <label className="form-label">Payment Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="form-input" required />
            </div>
            {showTransactionField && (
              <div className="sm:col-span-2">
                <label className="form-label">Transaction ID</label>
                <input type="text" value={transId} onChange={e => setTransId(e.target.value)} className="form-input" placeholder="Enter transaction ID" required />
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="form-label">Remarks</label>
              <textarea value={remarks} onChange={e => setRemarks(e.target.value)} className="form-input" rows={2} placeholder="Optional remarks" />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button type="button" onClick={backTo} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={payMutation.isPending || monthRange.length === 0} className="btn-primary">
              {payMutation.isPending ? 'Processing...' : <><Save size={16} /> Save ₹{totalAmount.toLocaleString('en-IN')}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
