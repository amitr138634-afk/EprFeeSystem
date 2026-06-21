import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, User, Phone, Mail, Calendar, Hash, BookOpen,
  Wallet, Receipt, CheckCircle2, AlertTriangle, FileEdit, Bus, Percent, Hash as RollIcon,
} from 'lucide-react'
import { feeApi } from '../../services/api'
import PayFeeModal from './PayFeeModal'
import CompleteDetailModal from './CompleteDetailModal'
import ApplyTransportModal from './ApplyTransportModal'
import ApplyDiscountModal from './ApplyDiscountModal'

const MONTH_NAMES = {
  apr: 'Apr', may: 'May', jun: 'Jun', jul: 'Jul', aug: 'Aug', sep: 'Sep',
  oct: 'Oct', nov: 'Nov', dec: 'Dec', jan: 'Jan', feb: 'Feb', mar: 'Mar',
}

export default function StudentProfile() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeModal, setActiveModal] = useState(null) // 'pay' | 'detail' | 'transport' | 'discount'

  const fetchProfile = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await feeApi.getStudentProfile(studentId)
      setStudent(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error loading student profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProfile() }, [studentId])

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
        <button onClick={() => navigate('/feemgmt/pay-fee')} className="btn-secondary">
          <ArrowLeft size={16} /> Back to Search
        </button>
      </div>
    )
  }

  const paidPct = student.total_due > 0 ? Math.min(100, (student.total_paid / student.total_due) * 100) : 0
  const closeModal = () => setActiveModal(null)
  const onModalSuccess = () => { closeModal(); fetchProfile() }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <button onClick={() => navigate('/feemgmt/pay-fee')} className="btn-secondary">
        <ArrowLeft size={16} /> Back to Search
      </button>

      {/* Profile card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-5">
          {student.photo ? (
            <img src={student.photo} alt={student.student_name} className="w-20 h-20 rounded-full object-cover flex-shrink-0 border border-gray-200" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
              {student.student_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">{student.student_name}</h1>
              <span className="badge-gray">{student.admission_no}</span>
              <span className={student.status === 'active' ? 'badge-green' : 'badge-gray'}>{student.status.toUpperCase()}</span>
              {student.transport && <span className="badge-blue flex items-center gap-1"><Bus size={11} /> Transport</span>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-3 text-sm text-gray-600">
              <div className="flex items-center gap-2"><BookOpen size={14} className="text-gray-400" /> Class {student.class_name} - {student.section}</div>
              <div className="flex items-center gap-2"><RollIcon size={14} className="text-gray-400" /> Roll No: {student.roll_no || '—'}</div>
              <div className="flex items-center gap-2"><Hash size={14} className="text-gray-400" /> Session: {student.session}</div>
              <div className="flex items-center gap-2"><User size={14} className="text-gray-400" /> Father: {student.father_name}</div>
              <div className="flex items-center gap-2"><User size={14} className="text-gray-400" /> Mother: {student.mother_name}</div>
              <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /> {student.father_mobile}</div>
              {student.father_email && <div className="flex items-center gap-2"><Mail size={14} className="text-gray-400" /> {student.father_email}</div>}
              <div className="flex items-center gap-2"><Calendar size={14} className="text-gray-400" /> DOB: {new Date(student.date_of_birth).toLocaleDateString('en-IN')}</div>
            </div>

            {/* Action bar */}
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={() => setActiveModal('pay')} disabled={student.total_balance <= 0} className="btn-primary btn-sm">
                <Wallet size={14} /> Pay Fee
              </button>
              <button onClick={() => setActiveModal('detail')} className="btn-secondary btn-sm">
                <FileEdit size={14} /> Complete Detail
              </button>
              <button onClick={() => setActiveModal('transport')} className="btn-secondary btn-sm">
                <Bus size={14} /> Apply Transport
              </button>
              <button onClick={() => setActiveModal('discount')} disabled={!student.has_fee_structure} className="btn-secondary btn-sm">
                <Percent size={14} /> Apply Discount
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fee summary */}
      <div>
        <h2 className="section-title">Fee Summary - Session {student.session}</h2>

        {!student.has_fee_structure ? (
          <div className="card p-8 text-center">
            <AlertTriangle size={32} className="text-yellow-500 mx-auto mb-3" />
            <p className="font-medium text-gray-700">No fee structure assigned to this class for session {student.session}</p>
            <p className="text-sm text-gray-500 mt-1">Define the fee structure for this class/session before fees can be collected.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div className="stat-card">
                <p className="stat-label">Total Annual Fee</p>
                <p className="stat-value">₹{student.total_due.toLocaleString('en-IN')}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Discount</p>
                <p className="stat-value text-amber-600">₹{student.total_discount.toLocaleString('en-IN')}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Paid</p>
                <p className="stat-value text-green-600">₹{student.total_paid.toLocaleString('en-IN')}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Balance Due</p>
                <p className={`stat-value ${student.total_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>₹{student.total_balance.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="card p-5 mb-4">
              <div className="flex justify-between text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                <span>Payment Progress</span>
                <span>{paidPct.toFixed(0)}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill bg-green-600" style={{ width: `${paidPct}%` }} />
              </div>
            </div>

            {/* Yearly month-wise breakdown */}
            <div className="table-container mb-4 overflow-x-auto">
              <table className="data-table text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-white z-10">Fee Head</th>
                    {Object.values(MONTH_NAMES).map(m => <th key={m} className="text-center">{m}</th>)}
                    <th className="text-right">Annual</th>
                    <th className="text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {student.fee_structure.map(head => (
                    <tr key={head.head_number}>
                      <td className="font-medium text-gray-900 sticky left-0 bg-white">{head.head_name}</td>
                      {head.months.map(m => (
                        <td key={m.month} className="text-center text-xs">
                          {m.due > 0 ? (
                            <span className={m.balance > 0 ? 'text-gray-700' : 'text-green-600'}>₹{m.due.toLocaleString('en-IN')}</span>
                          ) : <span className="text-gray-300">—</span>}
                          {m.discount > 0 && <div className="text-amber-600">-₹{m.discount.toLocaleString('en-IN')}</div>}
                        </td>
                      ))}
                      <td className="text-right font-medium">₹{head.annual_total.toLocaleString('en-IN')}</td>
                      <td className={`text-right font-semibold ${head.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>₹{head.balance.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => setActiveModal('pay')}
                disabled={student.total_balance <= 0}
                className="btn-primary btn-lg"
              >
                {student.total_balance <= 0 ? <><CheckCircle2 size={18} /> Fully Paid</> : <><Wallet size={18} /> Pay Fee</>}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Payment history */}
      <div>
        <h2 className="section-title flex items-center gap-2"><Receipt size={16} className="text-gray-400" /> Payment History</h2>
        {student.payment_history.length === 0 ? (
          <div className="card p-6 text-center text-sm text-gray-500">No fee payments recorded yet.</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Receipt No</th>
                  <th>Date</th>
                  <th>Month</th>
                  <th className="text-right">Amount</th>
                  <th>Mode</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {student.payment_history.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium text-gray-900">{p.rec_no}</td>
                    <td>{new Date(p.date).toLocaleDateString('en-IN')}</td>
                    <td>{MONTH_NAMES[p.month] || '—'}</td>
                    <td className="text-right font-semibold text-green-600">₹{parseFloat(p.amount).toLocaleString('en-IN')}</td>
                    <td><span className="badge-gray uppercase">{p.mode}</span></td>
                    <td className="text-gray-500 text-xs max-w-xs truncate">{p.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeModal === 'pay' && <PayFeeModal student={student} onClose={closeModal} onSuccess={onModalSuccess} />}
      {activeModal === 'detail' && <CompleteDetailModal student={student} onClose={closeModal} onSuccess={onModalSuccess} />}
      {activeModal === 'transport' && <ApplyTransportModal student={student} onClose={closeModal} onSuccess={onModalSuccess} />}
      {activeModal === 'discount' && <ApplyDiscountModal student={student} onClose={closeModal} onSuccess={onModalSuccess} />}
    </div>
  )
}
