import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { X, Save, AlertTriangle } from 'lucide-react'
import { feeApi, masterApi } from '../../services/api'

const MONTHS = [
  { v: 'apr', l: 'April' }, { v: 'may', l: 'May' }, { v: 'jun', l: 'June' }, { v: 'jul', l: 'July' },
  { v: 'aug', l: 'August' }, { v: 'sep', l: 'September' }, { v: 'oct', l: 'October' }, { v: 'nov', l: 'November' },
  { v: 'dec', l: 'December' }, { v: 'jan', l: 'January' }, { v: 'feb', l: 'February' }, { v: 'mar', l: 'March' },
]

const listOf = (r) => r.data.results || r.data

export default function CompleteDetailModal({ student, onClose, onSuccess }) {
  const [form, setForm] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [effectiveMonth, setEffectiveMonth] = useState('')

  const { data: classes = [] } = useQuery({
    queryKey: ['classes-detail', student.session],
    queryFn: () => masterApi.classes({ session: student.session }).then(listOf),
  })

  const { data: detail, isLoading } = useQuery({
    queryKey: ['student-detail', student.id],
    queryFn: () => feeApi.getStudentDetail(student.id).then(r => r.data),
  })

  useEffect(() => {
    if (detail) setForm({ ...detail })
  }, [detail])

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const classChanged = form && detail && String(form.class_name) !== String(detail.class_name)

  const updateMutation = useMutation({
    mutationFn: (payload) => {
      if (photoFile) {
        const fd = new FormData()
        Object.entries(payload).forEach(([k, v]) => { if (v !== null && v !== undefined) fd.append(k, v) })
        fd.append('photo', photoFile)
        return feeApi.updateStudentDetail(student.id, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      }
      return feeApi.updateStudentDetail(student.id, payload)
    },
    onSuccess: (res) => {
      toast.success(res.data?.class_changed ? 'Student updated — new class fee structure applied!' : 'Student details updated!')
      onSuccess()
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to update student'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (classChanged && !effectiveMonth) {
      toast.error('Select from which month the new class fee structure should apply')
      return
    }
    const payload = { ...form }
    delete payload.photo // file handled separately; URL string isn't a valid upload value
    if (classChanged) payload.effective_month = effectiveMonth
    updateMutation.mutate(payload)
  }

  if (isLoading || !form) {
    return (
      <div className="modal-overlay">
        <div className="modal-box max-w-3xl p-10 text-center text-gray-400">Loading student details...</div>
      </div>
    )
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box max-w-3xl">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Complete Detail</h2>
            <p className="text-xs text-gray-500 mt-0.5">{student.student_name} - {student.admission_no}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-5">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Identity</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Admission No</label>
                  <input className="form-input" value={form.admission_no} onChange={e => set('admission_no', e.target.value)} required />
                </div>
                <div>
                  <label className="form-label">Roll No</label>
                  <input className="form-input" value={form.roll_no || ''} onChange={e => set('roll_no', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Photo</label>
                  <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)} className="form-input" />
                </div>
                <div className="sm:col-span-2">
                  <label className="form-label">Student Name</label>
                  <input className="form-input" value={form.student_name} onChange={e => set('student_name', e.target.value)} required />
                </div>
                <div>
                  <label className="form-label">Gender</label>
                  <select className="form-select" value={form.gender} onChange={e => set('gender', e.target.value)}>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Date of Birth</label>
                  <input type="date" className="form-input" value={form.date_of_birth || ''} onChange={e => set('date_of_birth', e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Family Contact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="form-label">Father Name</label><input className="form-input" value={form.father_name} onChange={e => set('father_name', e.target.value)} /></div>
                <div><label className="form-label">Mother Name</label><input className="form-input" value={form.mother_name} onChange={e => set('mother_name', e.target.value)} /></div>
                <div><label className="form-label">Father Mobile</label><input className="form-input" value={form.father_mobile} onChange={e => set('father_mobile', e.target.value)} /></div>
                <div><label className="form-label">Mother Mobile</label><input className="form-input" value={form.mother_mobile || ''} onChange={e => set('mother_mobile', e.target.value)} /></div>
                <div><label className="form-label">Father Email</label><input type="email" className="form-input" value={form.father_email || ''} onChange={e => set('father_email', e.target.value)} /></div>
                <div><label className="form-label">Mother Email</label><input type="email" className="form-input" value={form.mother_email || ''} onChange={e => set('mother_email', e.target.value)} /></div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Academic</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Class</label>
                  <select className="form-select" value={String(form.class_name)} onChange={e => set('class_name', e.target.value)}>
                    {classes.map(c => <option key={c.id} value={String(c.id)}>{c.class_name}</option>)}
                  </select>
                </div>
                <div><label className="form-label">Section</label><input className="form-input" value={form.section} onChange={e => set('section', e.target.value)} /></div>
                <div>
                  <label className="form-label">Type</label>
                  <select className="form-select" value={form.type} onChange={e => set('type', e.target.value)}>
                    <option value="new">New</option>
                    <option value="old">Old</option>
                  </select>
                </div>
                <div><label className="form-label">Session</label><input className="form-input" value={form.session} disabled /></div>
                <div><label className="form-label">Admission Date</label><input type="date" className="form-input" value={form.admission_date || ''} onChange={e => set('admission_date', e.target.value)} /></div>
                <div>
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="tc_issued">TC Issued</option>
                  </select>
                </div>
              </div>
            </div>

            {classChanged && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-3">
                  <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-800">
                    Class is changing. From which month should the <strong>new class's fee structure</strong> apply?
                    Months before this keep the old structure unchanged.
                  </p>
                </div>
                <select className="form-select" value={effectiveMonth} onChange={e => setEffectiveMonth(e.target.value)} required>
                  <option value="">Select Month</option>
                  {MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={updateMutation.isPending} className="btn-primary">
              {updateMutation.isPending ? 'Saving...' : <><Save size={16} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
