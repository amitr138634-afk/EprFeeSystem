import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Plus, Trash2, Percent } from 'lucide-react'
import { feeApi } from '../../services/api'

const MONTHS = [
  { v: 'apr', l: 'April' }, { v: 'may', l: 'May' }, { v: 'jun', l: 'June' }, { v: 'jul', l: 'July' },
  { v: 'aug', l: 'August' }, { v: 'sep', l: 'September' }, { v: 'oct', l: 'October' }, { v: 'nov', l: 'November' },
  { v: 'dec', l: 'December' }, { v: 'jan', l: 'January' }, { v: 'feb', l: 'February' }, { v: 'mar', l: 'March' },
]

let rowKeySeq = 0

export default function ApplyDiscountPage() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const backTo = () => navigate(`/feemgmt/student-profile/${studentId}`)

  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])

  useEffect(() => {
    setLoading(true)
    feeApi.getStudentProfile(studentId)
      .then(res => {
        setStudent(res.data)
        setRows(res.data.fee_structure.map(h => ({
          key: rowKeySeq++,
          head_number: h.head_number,
          month: '',
          discount_amount: '',
          remarks: '',
        })))
      })
      .catch(err => setError(err.response?.data?.detail || 'Error loading student profile'))
      .finally(() => setLoading(false))
  }, [studentId])

  const balanceLookup = useMemo(() => {
    const map = {}
    if (!student) return map
    for (const head of student.fee_structure) {
      for (const m of head.months) map[`${head.head_number}_${m.month}`] = m
    }
    return map
  }, [student])

  const headName = (n) => student?.fee_structure.find(h => h.head_number === n)?.head_name || `Head ${n}`

  const updateRow = (key, field, value) =>
    setRows(prev => prev.map(r => (r.key === key ? { ...r, [field]: value } : r)))

  const addRow = () =>
    setRows(prev => [...prev, { key: rowKeySeq++, head_number: student.fee_structure[0]?.head_number, month: '', discount_amount: '', remarks: '' }])

  const removeRow = (key) => setRows(prev => prev.filter(r => r.key !== key))

  const saveMutation = useMutation({
    mutationFn: (discounts) => feeApi.saveMonthlyDiscounts(studentId, discounts),
    onSuccess: () => {
      toast.success('Discount(s) saved!')
      backTo()
    },
    onError: (err) => {
      const errors = err.response?.data?.errors
      toast.error(errors ? errors.join(', ') : (err.response?.data?.detail || 'Failed to save discount'))
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const valid = rows.filter(r => r.month && parseFloat(r.discount_amount) > 0)
    if (valid.length === 0) {
      toast.error('Add at least one month + discount amount')
      return
    }
    for (const r of valid) {
      const info = balanceLookup[`${r.head_number}_${r.month}`]
      const due = info?.due ?? 0
      const amt = parseFloat(r.discount_amount)
      if (amt > due + 0.01) {
        toast.error(`${headName(r.head_number)} (${MONTHS.find(m => m.v === r.month)?.l}): discount ₹${amt.toLocaleString('en-IN')} exceeds fee amount ₹${due.toLocaleString('en-IN')}`)
        return
      }
    }
    saveMutation.mutate(valid.map(r => ({
      head_number: r.head_number, month: r.month,
      discount_amount: parseFloat(r.discount_amount), remarks: r.remarks,
    })))
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button onClick={backTo} className="btn-secondary"><ArrowLeft size={16} /> Back to Profile</button>

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600"><Percent size={20} /></div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Apply Discount</h1>
            <p className="text-sm text-gray-500">{student.student_name} - {student.admission_no}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {rows.map(row => {
            const info = row.month ? balanceLookup[`${row.head_number}_${row.month}`] : null
            return (
              <div key={row.key} className="grid grid-cols-12 gap-2 items-end border-b border-gray-100 pb-3">
                <div className="col-span-4">
                  <label className="form-label">Fee Head</label>
                  <select
                    className="form-select"
                    value={row.head_number}
                    onChange={e => updateRow(row.key, 'head_number', Number(e.target.value))}
                  >
                    {student.fee_structure.map(h => <option key={h.head_number} value={h.head_number}>{h.head_name}</option>)}
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="form-label">Month</label>
                  <select className="form-select" value={row.month} onChange={e => updateRow(row.key, 'month', e.target.value)}>
                    <option value="">Select Month</option>
                    {MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="form-label">Discount Amount {info ? `(due ₹${info.due.toLocaleString('en-IN')})` : ''}</label>
                  <input
                    type="number" min="0" max={info?.due ?? undefined} step="0.01"
                    className="form-input"
                    value={row.discount_amount}
                    onChange={e => updateRow(row.key, 'discount_amount', e.target.value)}
                  />
                </div>
                <div className="col-span-2 flex justify-end">
                  <button type="button" onClick={() => removeRow(row.key)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
            )
          })}

          <button type="button" onClick={addRow} className="btn-secondary btn-sm flex items-center gap-1">
            <Plus size={14} /> Add Another
          </button>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button type="button" onClick={backTo} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saveMutation.isPending} className="btn-primary">
              {saveMutation.isPending ? 'Saving...' : <><Save size={16} /> Save Discounts</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
