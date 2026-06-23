import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Save, School } from 'lucide-react'
import { masterApi } from '../../services/api'

const emptyForm = {
  school_name: '', address: '', city: '', state: '', pincode: '',
  phone: '', email: '', website: '', affiliation_board: '',
  registration_no: '', established_year: '', principal_name: '',
}

export default function SchoolMaster() {
  const qc = useQueryClient()
  const [form, setForm] = useState(emptyForm)
  const [logoFile, setLogoFile] = useState(null)

  const { data: school, isLoading } = useQuery({
    queryKey: ['school-info'],
    queryFn: () => masterApi.getSchoolInfo().then(r => r.data),
  })

  useEffect(() => {
    if (school) {
      setForm({
        school_name: school.school_name || '', address: school.address || '',
        city: school.city || '', state: school.state || '', pincode: school.pincode || '',
        phone: school.phone || '', email: school.email || '', website: school.website || '',
        affiliation_board: school.affiliation_board || '', registration_no: school.registration_no || '',
        established_year: school.established_year || '', principal_name: school.principal_name || '',
      })
    }
  }, [school])

  const saveMutation = useMutation({
    mutationFn: () => {
      if (logoFile) {
        const fd = new FormData()
        Object.entries(form).forEach(([k, v]) => fd.append(k, v))
        fd.append('logo', logoFile)
        return masterApi.updateSchoolInfo(fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      }
      return masterApi.updateSchoolInfo(form)
    },
    onSuccess: () => {
      qc.invalidateQueries(['school-info'])
      toast.success('School info saved!')
      setLogoFile(null)
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to save school info'),
  })

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    saveMutation.mutate()
  }

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600"><School size={20} /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">School Info</h1>
          <p className="text-sm text-gray-500 mt-1">School details used on receipts, ID cards, and report cards</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div className="flex items-center gap-4">
          {school?.logo ? (
            <img src={school.logo} alt="School logo" className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400"><School size={28} /></div>
          )}
          <div>
            <label className="form-label">School Logo</label>
            <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] || null)} className="form-input" />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Identity</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><label className="form-label">School Name</label><input className="form-input" value={form.school_name} onChange={e => set('school_name', e.target.value)} /></div>
            <div><label className="form-label">Affiliation Board</label><input className="form-input" value={form.affiliation_board} onChange={e => set('affiliation_board', e.target.value)} placeholder="e.g., CBSE, ICSE, State Board" /></div>
            <div><label className="form-label">Registration No.</label><input className="form-input" value={form.registration_no} onChange={e => set('registration_no', e.target.value)} /></div>
            <div><label className="form-label">Established Year</label><input className="form-input" value={form.established_year} onChange={e => set('established_year', e.target.value)} maxLength={4} placeholder="e.g., 1998" /></div>
            <div><label className="form-label">Principal Name</label><input className="form-input" value={form.principal_name} onChange={e => set('principal_name', e.target.value)} /></div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Address</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><label className="form-label">Address</label><input className="form-input" value={form.address} onChange={e => set('address', e.target.value)} /></div>
            <div><label className="form-label">City</label><input className="form-input" value={form.city} onChange={e => set('city', e.target.value)} /></div>
            <div><label className="form-label">State</label><input className="form-input" value={form.state} onChange={e => set('state', e.target.value)} /></div>
            <div><label className="form-label">Pincode</label><input className="form-input" value={form.pincode} onChange={e => set('pincode', e.target.value)} /></div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Contact</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div><label className="form-label">Email</label><input type="email" className="form-input" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div className="sm:col-span-2"><label className="form-label">Website</label><input className="form-input" value={form.website} onChange={e => set('website', e.target.value)} placeholder="e.g., www.myschool.edu" /></div>
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-100 pt-4">
          <button type="submit" disabled={saveMutation.isPending} className="btn-primary">
            {saveMutation.isPending ? 'Saving...' : <><Save size={16} /> Save School Info</>}
          </button>
        </div>
      </form>
    </div>
  )
}
