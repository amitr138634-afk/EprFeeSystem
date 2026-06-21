import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { staffApi } from '../../services/api'

export default function ShiftMaster() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const emptyForm = { name: '', start_time: '', end_time: '', grace_minutes: '', is_default: false }
  const [form, setForm] = useState(emptyForm)

  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => staffApi.shifts().then(r => r.data.results || r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? staffApi.updateShift(editing.id, data)
      : staffApi.createShift(data),
    onSuccess: () => {
      qc.invalidateQueries(['shifts'])
      setShowForm(false); setEditing(null); setForm(emptyForm)
      toast.success(editing ? 'Updated!' : 'Shift created!')
    },
    onError: () => toast.error('Failed to save'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => staffApi.deleteShift(id),
    onSuccess: () => { qc.invalidateQueries(['shifts']); toast.success('Deleted!') },
    onError: () => toast.error('Failed to delete'),
  })

  const openEdit = (d) => {
    setEditing(d)
    setForm({ name: d.name, start_time: d.start_time || '', end_time: d.end_time || '', grace_minutes: d.grace_minutes ?? '', is_default: !!d.is_default })
    setShowForm(true)
  }
  const openNew = () => { setEditing(null); setForm(emptyForm); setShowForm(true) }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Shift Master</h1><p className="page-sub">Manage staff shifts</p></div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Shift</button>
      </div>

      {showForm && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{editing ? 'Edit' : 'Add'} Shift</h3>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="form-label">Shift Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Morning" />
            </div>
            <div>
              <label className="form-label">Start Time</label>
              <input type="time" className="form-input" value={form.start_time} onChange={e => setForm(p=>({...p,start_time:e.target.value}))} />
            </div>
            <div>
              <label className="form-label">End Time</label>
              <input type="time" className="form-input" value={form.end_time} onChange={e => setForm(p=>({...p,end_time:e.target.value}))} />
            </div>
            <div>
              <label className="form-label">Grace Minutes</label>
              <input type="number" className="form-input" value={form.grace_minutes} onChange={e => setForm(p=>({...p,grace_minutes:e.target.value}))} placeholder="e.g. 10" min={0} />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.is_default} onChange={e => setForm(p=>({...p,is_default:e.target.checked}))} />
                Default shift
              </label>
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
            <tr><th>#</th><th>Name</th><th>Start Time</th><th>End Time</th><th>Grace Minutes</th><th>Default</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td></tr>}
            {!isLoading && shifts.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">No shifts found</td></tr>}
            {shifts.map((d, i) => (
              <tr key={d.id}>
                <td className="text-gray-500">{i+1}</td>
                <td className="font-medium">{d.name}</td>
                <td>{d.start_time}</td>
                <td>{d.end_time}</td>
                <td>{d.grace_minutes}</td>
                <td>{d.is_default ? <span className="badge badge-green">Default</span> : <span className="text-gray-300">—</span>}</td>
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
