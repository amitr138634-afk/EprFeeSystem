import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Search, Plus, Trash2 } from 'lucide-react'
import { feeApi } from '../../services/api'

export default function PayFee() {
  const [items, setItems] = useState([])
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const { register, handleSubmit, watch, reset } = useForm({
    defaultValues: { payment_mode: 'cash', payment_date: new Date().toISOString().split('T')[0] }
  })

  const { data: feeHeads = [] } = useQuery({
    queryKey: ['fee-heads'],
    queryFn: () => feeApi.heads().then(r => r.data.results || r.data),
  })

  const payMutation = useMutation({
    mutationFn: (data) => feeApi.payFee(data),
    onSuccess: (res) => {
      toast.success(`Receipt #${res.data.receipt_no} generated!`)
      reset()
      setItems([])
      setSelectedStudent(null)
    },
    onError: () => toast.error('Failed to process payment'),
  })

  const addItem = (feeHead) => {
    if (!items.find(i => i.fee_head_id === feeHead.id)) {
      setItems(prev => [...prev, { fee_head_id: feeHead.id, fee_head_name: feeHead.name, amount: 0, discount: 0 }])
    }
  }

  const removeItem = (feeHeadId) => {
    setItems(prev => prev.filter(i => i.fee_head_id !== feeHeadId))
  }

  const updateItem = (feeHeadId, field, value) => {
    setItems(prev => prev.map(i => i.fee_head_id === feeHeadId ? { ...i, [field]: Number(value) } : i))
  }

  const total = items.reduce((a, i) => a + (i.amount - i.discount), 0)

  const onSubmit = (data) => {
    if (!selectedStudent) { toast.error('Please select a student'); return }
    if (items.length === 0) { toast.error('Add at least one fee head'); return }
    payMutation.mutate({
      ...selectedStudent,
      payment_mode: data.payment_mode,
      payment_date: data.payment_date,
      cheque_no: data.cheque_no,
      bank_name: data.bank_name,
      transaction_id: data.transaction_id,
      remarks: data.remarks,
      items,
    })
  }

  const paymentMode = watch('payment_mode')

  return (
    <div className="space-y-4 max-w-4xl">
      <h1 className="text-xl font-bold text-gray-800">Pay Fee</h1>

      <div className="grid grid-cols-3 gap-5">
        {/* Student Search */}
        <div className="col-span-3 lg:col-span-1">
          <div className="card p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Search Student</h3>
            <div className="relative mb-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Name or Admission No."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                className="form-input pl-9 text-xs"
              />
            </div>
            {selectedStudent && (
              <div className="bg-blue-50 rounded-lg p-3 text-sm">
                <p className="font-semibold">{selectedStudent.student_name}</p>
                <p className="text-gray-500 text-xs">{selectedStudent.class_name} - {selectedStudent.section_name}</p>
                <p className="text-gray-500 text-xs">Adm: {selectedStudent.admission_no}</p>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">Demo: Click to set a sample student</p>
            <button
              className="mt-2 text-xs text-blue-600 underline"
              onClick={() => setSelectedStudent({
                student_id: 1, student_name: 'Sample Student',
                class_name: 'X', section_name: 'A',
                admission_no: 'ADM001', session_year: '2024-25'
              })}
            >
              Load Sample Student
            </button>
          </div>

          {/* Fee Heads */}
          <div className="card p-4 mt-4">
            <h3 className="font-semibold text-gray-700 mb-3">Fee Heads</h3>
            <div className="space-y-1">
              {feeHeads.map(head => (
                <button
                  key={head.id}
                  onClick={() => addItem(head)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded-lg flex items-center justify-between"
                >
                  <span>{head.name}</span>
                  <Plus size={14} className="text-blue-500" />
                </button>
              ))}
              {feeHeads.length === 0 && <p className="text-xs text-gray-400">No fee heads configured</p>}
            </div>
          </div>
        </div>

        {/* Fee Entry */}
        <div className="col-span-3 lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="card p-4">
              <h3 className="font-semibold text-gray-700 mb-3">Payment Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Payment Date</label>
                  <input type="date" className="form-input" {...register('payment_date')} />
                </div>
                <div>
                  <label className="form-label">Payment Mode</label>
                  <select className="form-input" {...register('payment_mode')}>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="online">Online/NEFT</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                  </select>
                </div>
                {paymentMode === 'cheque' && (
                  <>
                    <div>
                      <label className="form-label">Cheque No.</label>
                      <input className="form-input" {...register('cheque_no')} />
                    </div>
                    <div>
                      <label className="form-label">Bank Name</label>
                      <input className="form-input" {...register('bank_name')} />
                    </div>
                  </>
                )}
                {(paymentMode === 'online' || paymentMode === 'upi') && (
                  <div className="col-span-2">
                    <label className="form-label">Transaction ID</label>
                    <input className="form-input" {...register('transaction_id')} />
                  </div>
                )}
                <div className="col-span-2">
                  <label className="form-label">Remarks</label>
                  <input className="form-input" {...register('remarks')} />
                </div>
              </div>
            </div>

            <div className="card p-4">
              <h3 className="font-semibold text-gray-700 mb-3">Fee Items</h3>
              {items.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-4">Click fee heads on the left to add</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="table-header px-2 py-2 text-left">Fee Head</th>
                      <th className="table-header px-2 py-2 text-right">Amount</th>
                      <th className="table-header px-2 py-2 text-right">Discount</th>
                      <th className="table-header px-2 py-2 text-right">Net</th>
                      <th className="table-header px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.fee_head_id} className="border-b border-gray-100">
                        <td className="px-2 py-2">{item.fee_head_name}</td>
                        <td className="px-2 py-2">
                          <input
                            type="number" min="0"
                            value={item.amount}
                            onChange={e => updateItem(item.fee_head_id, 'amount', e.target.value)}
                            className="form-input text-right w-24"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number" min="0"
                            value={item.discount}
                            onChange={e => updateItem(item.fee_head_id, 'discount', e.target.value)}
                            className="form-input text-right w-20"
                          />
                        </td>
                        <td className="px-2 py-2 text-right font-medium">
                          ₹{(item.amount - item.discount).toLocaleString('en-IN')}
                        </td>
                        <td className="px-2 py-2">
                          <button onClick={() => removeItem(item.fee_head_id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-semibold">
                      <td colSpan={3} className="px-2 py-2 text-right">Total Payable:</td>
                      <td className="px-2 py-2 text-right text-blue-600">₹{total.toLocaleString('en-IN')}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            <button
              type="submit"
              disabled={payMutation.isLoading}
              className="btn-primary w-full py-3"
            >
              {payMutation.isLoading ? 'Processing...' : `Generate Receipt (₹${total.toLocaleString('en-IN')})`}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
