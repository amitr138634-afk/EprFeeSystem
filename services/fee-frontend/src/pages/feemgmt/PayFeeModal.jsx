import { useState, useMemo } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { X, Save } from 'lucide-react'
import { feeApi } from '../../services/api'

const MONTHS = [
  { v: 'apr', l: 'April' }, { v: 'may', l: 'May' }, { v: 'jun', l: 'June' }, { v: 'jul', l: 'July' },
  { v: 'aug', l: 'August' }, { v: 'sep', l: 'September' }, { v: 'oct', l: 'October' }, { v: 'nov', l: 'November' },
  { v: 'dec', l: 'December' }, { v: 'jan', l: 'January' }, { v: 'feb', l: 'February' }, { v: 'mar', l: 'March' },
]
const MONTH_INDEX = Object.fromEntries(MONTHS.map((m, i) => [m.v, i]))

export default function PayFeeModal({ student, onClose, onSuccess }) {
  const [fromMonth, setFromMonth] = useState(MONTHS[0].v)
  const [toMonth, setToMonth] = useState(MONTHS[0].v)
  const [cells, setCells] = useState({}) // { [month]: { [head_number]: { amount, discount } } }
  const [mode, setMode] = useState('cash')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [transId, setTransId] = useState('')
  const [remarks, setRemarks] = useState('')

  const monthRange = useMemo(() => {
    const i = MONTH_INDEX[fromMonth], j = MONTH_INDEX[toMonth]
    if (i > j) return []
    return MONTHS.slice(i, j + 1)
  }, [fromMonth, toMonth])

  // Balance lookup per (month, head_number), sourced from the profile's already-loaded yearly breakdown.
  const balanceLookup = useMemo(() => {
    const map = {}
    for (const head of student.fee_structure) {
      for (const m of head.months) {
        map[`${m.month}_${head.head_number}`] = m.balance
      }
    }
    return map
  }, [student.fee_structure])

  const setCell = (month, headNumber, field, value) => {
    setCells(prev => ({
      ...prev,
      [month]: {
        ...prev[month],
        [headNumber]: { ...prev[month]?.[headNumber], [field]: value },
      },
    }))
  }

  let totalAmount = 0, totalDiscount = 0
  for (const m of monthRange) {
    for (const head of student.fee_structure) {
      const cell = cells[m.v]?.[head.head_number]
      totalAmount += parseFloat(cell?.amount) || 0
      totalDiscount += parseFloat(cell?.discount) || 0
    }
  }

  const payMutation = useMutation({
    mutationFn: (payload) => feeApi.payStudentFee(student.id, payload),
    onSuccess: (res) => {
      toast.success(res.data?.detail || 'Fee payment recorded successfully!')
      onSuccess()
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

    // Client-side guard mirroring the server validation: amount + discount can't exceed balance.
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

  const showTransactionField = ['upi', 'paytm', 'online'].includes(mode)

  return (
    <div className="modal-overlay">
      <div className="modal-box max-w-5xl">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Pay Fee</h2>
            <p className="text-xs text-gray-500 mt-0.5">{student.student_name} - {student.admission_no}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">From Month</label>
                <select value={fromMonth} onChange={e => setFromMonth(e.target.value)} className="form-select">
                  {MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">To Month</label>
                <select value={toMonth} onChange={e => setToMonth(e.target.value)} className="form-select">
                  {MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                </select>
              </div>
            </div>

            {monthRange.length === 0 ? (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
                From Month must come before or equal to To Month (academic year: April → March).
              </div>
            ) : (
              <div className="table-container max-h-96 overflow-y-auto">
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
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={payMutation.isPending || monthRange.length === 0} className="btn-primary">
              {payMutation.isPending ? 'Processing...' : <><Save size={16} /> Save ₹{totalAmount.toLocaleString('en-IN')}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
