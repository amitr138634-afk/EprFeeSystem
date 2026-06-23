import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, AlertTriangle, FileEdit } from 'lucide-react'
import { feeApi, masterApi } from '../../services/api'

const MONTHS = [
  { v: 'apr', l: 'April' }, { v: 'may', l: 'May' }, { v: 'jun', l: 'June' }, { v: 'jul', l: 'July' },
  { v: 'aug', l: 'August' }, { v: 'sep', l: 'September' }, { v: 'oct', l: 'October' }, { v: 'nov', l: 'November' },
  { v: 'dec', l: 'December' }, { v: 'jan', l: 'January' }, { v: 'feb', l: 'February' }, { v: 'mar', l: 'March' },
]

const listOf = (r) => r.data.results || r.data

export default function CompleteDetailPage() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const backTo = () => navigate(`/feemgmt/student-profile/${studentId}`)

  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [effectiveMonth, setEffectiveMonth] = useState('')

  useEffect(() => {
    setLoading(true)
    feeApi.getStudentProfile(studentId)
      .then(res => setStudent(res.data))
      .catch(err => setError(err.response?.data?.detail || 'Error loading student profile'))
      .finally(() => setLoading(false))
  }, [studentId])

  const { data: classes = [] } = useQuery({
    queryKey: ['classes-detail', student?.session],
    queryFn: () => masterApi.classes({ session: student.session }).then(listOf),
    enabled: !!student,
  })

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['student-detail', studentId],
    queryFn: () => feeApi.getStudentDetail(studentId).then(r => r.data),
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
        return feeApi.updateStudentDetail(studentId, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      }
      return feeApi.updateStudentDetail(studentId, payload)
    },
    onSuccess: (res) => {
      toast.success(res.data?.class_changed ? 'Student updated — new class fee structure applied!' : 'Student details updated!')
      backTo()
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
    delete payload.photo
    if (classChanged) payload.effective_month = effectiveMonth
    updateMutation.mutate(payload)
  }

  if (loading || detailLoading || !form) {
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
    <div className="space-y-6 max-w-5xl mx-auto">
      <button onClick={backTo} className="btn-secondary"><ArrowLeft size={16} /> Back to Profile</button>

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><FileEdit size={20} /></div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Complete Detail</h1>
            <p className="text-sm text-gray-500">{student.student_name} - {student.admission_no}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              <select className="form-select max-w-xs" value={effectiveMonth} onChange={e => setEffectiveMonth(e.target.value)} required>
                <option value="">Select Month</option>
                {MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button type="button" onClick={backTo} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={updateMutation.isPending} className="btn-primary">
              {updateMutation.isPending ? 'Saving...' : <><Save size={16} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
