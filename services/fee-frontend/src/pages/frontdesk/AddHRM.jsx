import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Save, User, GraduationCap, FileText } from 'lucide-react'
import { frontdeskApi } from '../../services/api'

const EMPTY_FORM = {
  full_name: '', father_name: '', mother_name: '', date_of_birth: '', gender: '',
  mobile: '', email: '', address: '',
  tenth_school: '', tenth_board: '', tenth_year: '', tenth_percentage: '',
  twelfth_school: '', twelfth_board: '', twelfth_stream: '', twelfth_year: '', twelfth_percentage: '',
  graduation_degree: '', graduation_college: '', graduation_university: '', graduation_year: '', graduation_percentage: '',
  highest_qualification: '', highest_institute: '', highest_year: '', highest_percentage: '',
}

const FILE_FIELDS = ['photo', 'tenth_certificate', 'twelfth_certificate', 'graduation_certificate', 'highest_certificate', 'resume', 'other_certificate']

function SectionCard({ icon: Icon, title, children }) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} className="text-gray-400" />
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{children}</div>
    </div>
  )
}

export default function AddHRM() {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [files, setFiles] = useState({})

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))
  const setFile = (field, file) => setFiles(prev => ({ ...prev, [field]: file }))

  const saveMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v) })
      FILE_FIELDS.forEach(f => { if (files[f]) fd.append(f, files[f]) })
      return frontdeskApi.addHrmCandidate(fd)
    },
    onSuccess: () => {
      toast.success('Candidate added successfully!')
      navigate('/frontdesk/hrm/list')
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to add candidate'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.full_name || !form.mobile) {
      toast.error('Full Name and Mobile are required')
      return
    }
    saveMutation.mutate()
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Add HRM</h1>
        <p className="text-sm text-gray-500 mt-1">Capture a candidate's full detail before their interview</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        <SectionCard icon={User} title="1. Personal Detail">
          <div><label className="form-label">Full Name *</label><input className="form-input" value={form.full_name} onChange={e => set('full_name', e.target.value)} required /></div>
          <div><label className="form-label">Father Name</label><input className="form-input" value={form.father_name} onChange={e => set('father_name', e.target.value)} /></div>
          <div><label className="form-label">Mother Name</label><input className="form-input" value={form.mother_name} onChange={e => set('mother_name', e.target.value)} /></div>
          <div><label className="form-label">Date of Birth</label><input type="date" className="form-input" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} /></div>
          <div>
            <label className="form-label">Gender</label>
            <select className="form-select" value={form.gender} onChange={e => set('gender', e.target.value)}>
              <option value="">Select</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </select>
          </div>
          <div><label className="form-label">Mobile *</label><input className="form-input" value={form.mobile} onChange={e => set('mobile', e.target.value)} required /></div>
          <div><label className="form-label">Email</label><input type="email" className="form-input" value={form.email} onChange={e => set('email', e.target.value)} /></div>
          <div className="sm:col-span-2"><label className="form-label">Address</label><input className="form-input" value={form.address} onChange={e => set('address', e.target.value)} /></div>
          <div><label className="form-label">Photo</label><input type="file" accept="image/*" className="form-input" onChange={e => setFile('photo', e.target.files?.[0] || null)} /></div>
        </SectionCard>

        <SectionCard icon={GraduationCap} title="2. 10th Class Information">
          <div><label className="form-label">School Name</label><input className="form-input" value={form.tenth_school} onChange={e => set('tenth_school', e.target.value)} /></div>
          <div><label className="form-label">Board</label><input className="form-input" value={form.tenth_board} onChange={e => set('tenth_board', e.target.value)} /></div>
          <div><label className="form-label">Year of Passing</label><input className="form-input" value={form.tenth_year} onChange={e => set('tenth_year', e.target.value)} placeholder="e.g. 2015" /></div>
          <div><label className="form-label">Percentage</label><input type="number" step="0.01" className="form-input" value={form.tenth_percentage} onChange={e => set('tenth_percentage', e.target.value)} /></div>
          <div><label className="form-label">Certificate</label><input type="file" className="form-input" onChange={e => setFile('tenth_certificate', e.target.files?.[0] || null)} /></div>
        </SectionCard>

        <SectionCard icon={GraduationCap} title="3. 12th Class Information">
          <div><label className="form-label">School Name</label><input className="form-input" value={form.twelfth_school} onChange={e => set('twelfth_school', e.target.value)} /></div>
          <div><label className="form-label">Board</label><input className="form-input" value={form.twelfth_board} onChange={e => set('twelfth_board', e.target.value)} /></div>
          <div><label className="form-label">Stream</label><input className="form-input" value={form.twelfth_stream} onChange={e => set('twelfth_stream', e.target.value)} placeholder="Science / Commerce / Arts" /></div>
          <div><label className="form-label">Year of Passing</label><input className="form-input" value={form.twelfth_year} onChange={e => set('twelfth_year', e.target.value)} /></div>
          <div><label className="form-label">Percentage</label><input type="number" step="0.01" className="form-input" value={form.twelfth_percentage} onChange={e => set('twelfth_percentage', e.target.value)} /></div>
          <div><label className="form-label">Certificate</label><input type="file" className="form-input" onChange={e => setFile('twelfth_certificate', e.target.files?.[0] || null)} /></div>
        </SectionCard>

        <SectionCard icon={GraduationCap} title="4. Graduation Detail">
          <div><label className="form-label">Degree</label><input className="form-input" value={form.graduation_degree} onChange={e => set('graduation_degree', e.target.value)} placeholder="B.A. / B.Sc. / B.Ed. etc." /></div>
          <div><label className="form-label">College</label><input className="form-input" value={form.graduation_college} onChange={e => set('graduation_college', e.target.value)} /></div>
          <div><label className="form-label">University</label><input className="form-input" value={form.graduation_university} onChange={e => set('graduation_university', e.target.value)} /></div>
          <div><label className="form-label">Year of Passing</label><input className="form-input" value={form.graduation_year} onChange={e => set('graduation_year', e.target.value)} /></div>
          <div><label className="form-label">Percentage</label><input type="number" step="0.01" className="form-input" value={form.graduation_percentage} onChange={e => set('graduation_percentage', e.target.value)} /></div>
          <div><label className="form-label">Certificate</label><input type="file" className="form-input" onChange={e => setFile('graduation_certificate', e.target.files?.[0] || null)} /></div>
        </SectionCard>

        <SectionCard icon={GraduationCap} title="5. Highest Study Information">
          <div><label className="form-label">Qualification</label><input className="form-input" value={form.highest_qualification} onChange={e => set('highest_qualification', e.target.value)} placeholder="M.A. / M.Ed. / Ph.D. etc." /></div>
          <div><label className="form-label">Institute</label><input className="form-input" value={form.highest_institute} onChange={e => set('highest_institute', e.target.value)} /></div>
          <div><label className="form-label">Year of Passing</label><input className="form-input" value={form.highest_year} onChange={e => set('highest_year', e.target.value)} /></div>
          <div><label className="form-label">Percentage</label><input type="number" step="0.01" className="form-input" value={form.highest_percentage} onChange={e => set('highest_percentage', e.target.value)} /></div>
          <div><label className="form-label">Certificate</label><input type="file" className="form-input" onChange={e => setFile('highest_certificate', e.target.files?.[0] || null)} /></div>
        </SectionCard>

        <SectionCard icon={FileText} title="6. Certificate Uploads">
          <div><label className="form-label">Resume</label><input type="file" className="form-input" onChange={e => setFile('resume', e.target.files?.[0] || null)} /></div>
          <div><label className="form-label">Other Certificate</label><input type="file" className="form-input" onChange={e => setFile('other_certificate', e.target.files?.[0] || null)} /></div>
        </SectionCard>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/frontdesk/hrm/list')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saveMutation.isPending} className="btn-primary">
            {saveMutation.isPending ? 'Saving...' : <><Save size={16} /> Save Candidate</>}
          </button>
        </div>
      </form>
    </div>
  )
}
