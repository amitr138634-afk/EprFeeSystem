import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { attendanceApi } from '../../services/api'

const HOLIDAY_TYPE_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'optional', label: 'Optional' },
  { value: 'school', label: 'School' },
]

const typeBadge = (type) => {
  if (type === 'public') return <span className="badge badge-green">Public</span>
  if (type === 'optional') return <span className="badge badge-yellow">Optional</span>
  if (type === 'school') return <span className="badge badge-blue">School</span>
  return <span className="badge badge-gray">{type}</span>
}

export default function HolidayMaster() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', date: '', holiday_type: 'public' })

  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ['holidays'],
    queryFn: () => attendanceApi.holidays().then(r => r.data.results || r.data),
  })

  const sorted = [...holidays].sort((a, b) => (a.date > b.date ? 1 : -1))

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? attendanceApi.updateHoliday(editing.id, data)
      : attendanceApi.createHoliday(data),
    onSuccess: () => {
      qc.invalidateQueries(['holidays'])
      setShowForm(false); setEditing(null); setForm({ name: '', date: '', holiday_type: 'public' })
      toast.success(editing ? 'Updated!' : 'Holiday created!')
    },
    onError: () => toast.error('Failed to save'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => attendanceApi.deleteHoliday(id),
    onSuccess: () => { qc.invalidateQueries(['holidays']); toast.success('Deleted!') },
    onError: () => toast.error('Failed to delete'),
  })

  const openEdit = (d) => {
    setEditing(d)
    setForm({ name: d.name, date: d.date || '', holiday_type: d.holiday_type || 'public' })
    setShowForm(true)
  }
  const openNew = () => { setEditing(null); setForm({ name: '', date: '', holiday_type: 'public' }); setShowForm(true) }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Holiday Master</h1><p className="page-sub">Manage school holidays</p></div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Holiday</button>
      </div>

      {showForm && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{editing ? 'Edit' : 'Add'} Holiday</h3>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="form-label">Holiday Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Diwali" />
            </div>
            <div>
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={form.date} onChange={e => setForm(p=>({...p,date:e.target.value}))} />
            </div>
            <div>
              <label className="form-label">Holiday Type</label>
              <select className="form-input" value={form.holiday_type} onChange={e => setForm(p=>({...p,holiday_type:e.target.value}))}>
                {HOLIDAY_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isLoading} className="btn-primary btn-sm">Save</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary btn-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr><th>#</th><th>Holiday Name</th><th>Date</th><th>Type</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="text-center py-8 text-gray-400">Loading...</td></tr>}
            {!isLoading && sorted.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">No holidays found</td></tr>}
            {sorted.map((d, i) => (
              <tr key={d.id}>
                <td className="text-gray-500">{i+1}</td>
                <td className="font-medium">{d.name}</td>
                <td>{d.date}</td>
                <td>{typeBadge(d.holiday_type)}</td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(d)} className="p-1.5 hover:bg-blue-50 rounded text-blue-600"><Edit size={14}/></button>
                    <button onClick={() => { if(confirm('Delete?')) deleteMutation.mutate(d.id) }} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
