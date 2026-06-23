import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, Save, X, Power } from 'lucide-react'
import { masterApi } from '../../services/api'

const listOf = (r) => r.data.results || r.data
const emptyForm = { name: '' }

export default function BloodGroupMaster() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['blood-group-master'],
    queryFn: () => masterApi.getBloodGroupMaster().then(listOf),
  })

  const resetForm = () => { setForm(emptyForm); setShowForm(false); setEditingId(null) }

  const saveMutation = useMutation({
    mutationFn: (data) => editingId ? masterApi.updateBloodGroupMaster(editingId, data) : masterApi.createBloodGroupMaster(data),
    onSuccess: () => {
      qc.invalidateQueries(['blood-group-master'])
      toast.success(editingId ? 'Blood group updated!' : 'Blood group created!')
      resetForm()
    },
    onError: (e) => toast.error(e.response?.data?.name?.[0] || e.response?.data?.detail || 'Failed to save blood group'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => masterApi.deleteBloodGroupMaster(id),
    onSuccess: () => { qc.invalidateQueries(['blood-group-master']); toast.success('Blood group deleted!') },
    onError: () => toast.error('Failed to delete blood group'),
  })

  const toggleMutation = useMutation({
    mutationFn: (id) => masterApi.toggleBloodGroupMasterStatus(id),
    onSuccess: () => { qc.invalidateQueries(['blood-group-master']); toast.success('Status updated!') },
    onError: () => toast.error('Failed to toggle status'),
  })

  const handleEdit = (g) => {
    setForm({ name: g.name })
    setEditingId(g.id)
    setShowForm(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    saveMutation.mutate(form)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Blood Group Master</h1>
          <p className="text-sm text-gray-500 mt-1">Blood group options for student records</p>
        </div>
        <button onClick={() => (showForm ? resetForm() : setShowForm(true))} className="btn-primary flex items-center gap-2">
          {showForm ? <X size={18} /> : <Plus size={18} />} {showForm ? 'Cancel' : 'Add Blood Group'}
        </button>
      </div>

      {showForm && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">{editingId ? 'Edit Blood Group' : 'Add New Blood Group'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="max-w-xs">
              <label className="form-label">Blood Group *</label>
              <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., A+, O-, AB+" required maxLength={10} />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saveMutation.isPending} className="btn-primary flex items-center gap-2"><Save size={18} /> {editingId ? 'Update' : 'Save'} Blood Group</button>
              <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="p-6 border-b"><h2 className="text-lg font-semibold text-gray-700">Blood Groups ({groups.length})</h2></div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : groups.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No blood groups found. Click "Add Blood Group" to create one.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="table-header text-left px-6 py-3">S.No</th>
                  <th className="table-header text-left px-6 py-3">Blood Group</th>
                  <th className="table-header text-center px-6 py-3">Status</th>
                  <th className="table-header text-center px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g, i) => (
                  <tr key={g.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">{i + 1}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{g.name}</td>
                    <td className="px-6 py-4 text-center"><span className={g.status ? 'badge-green' : 'badge-gray'}>{g.status ? 'Active' : 'Inactive'}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => toggleMutation.mutate(g.id)} className={g.status ? 'p-2 text-red-600 hover:bg-red-50 rounded' : 'p-2 text-green-600 hover:bg-green-50 rounded'} title={g.status ? 'Deactivate' : 'Activate'}><Power size={16} /></button>
                        <button onClick={() => handleEdit(g)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Edit2 size={16} /></button>
                        <button onClick={() => { if (window.confirm('Delete this blood group?')) deleteMutation.mutate(g.id) }} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
