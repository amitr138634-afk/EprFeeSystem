import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { staffApi } from '../../services/api'

export default function DesignationMaster() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', code: '', department: '' })

  const { data: designations = [], isLoading } = useQuery({
    queryKey: ['designations'],
    queryFn: () => staffApi.designations().then(r => r.data.results || r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? staffApi.updateDesignation(editing.id, data)
      : staffApi.createDesignation(data),
    onSuccess: () => {
      qc.invalidateQueries(['designations'])
      setShowForm(false); setEditing(null); setForm({ name: '', code: '', department: '' })
      toast.success(editing ? 'Updated!' : 'Designation created!')
    },
    onError: () => toast.error('Failed to save'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => staffApi.deleteDesignation(id),
    onSuccess: () => { qc.invalidateQueries(['designations']); toast.success('Deleted!') },
    onError: () => toast.error('Failed to delete'),
  })

  const openEdit = (d) => {
    setEditing(d); setForm({ name: d.name, code: d.code || '', department: d.department || '' }); setShowForm(true)
  }
  const openNew = () => { setEditing(null); setForm({ name: '', code: '', department: '' }); setShowForm(true) }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Designation Master</h1><p className="page-sub">Manage staff designations</p></div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Designation</button>
      </div>

      {showForm && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{editing ? 'Edit' : 'Add'} Designation</h3>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Class Teacher" /></div>
            <div><label className="form-label">Code</label><input className="form-input" value={form.code} onChange={e => setForm(p=>({...p,code:e.target.value}))} placeholder="e.g. CT" /></div>
            <div><label className="form-label">Department</label><input className="form-input" value={form.department} onChange={e => setForm(p=>({...p,department:e.target.value}))} placeholder="e.g. Academics" /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isLoading} className="btn-primary btn-sm">Save</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary btn-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>#</th><th>Name</th><th>Code</th><th>Department</th><th>Actions</th></tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="text-center py-8 text-gray-400">Loading...</td></tr>}
            {!isLoading && designations.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">No designations found</td></tr>}
            {designations.map((d, i) => (
              <tr key={d.id}>
                <td className="text-gray-500">{i+1}</td>
                <td className="font-medium">{d.name}</td>
                <td>{d.code}</td>
                <td>{d.department}</td>
                <td><div className="flex gap-1">
                  <button onClick={() => openEdit(d)} className="p-1.5 hover:bg-blue-50 rounded text-blue-600"><Edit size={14}/></button>
                  <button onClick={() => { if(confirm('Delete?')) deleteMutation.mutate(d.id) }} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 size={14}/></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
