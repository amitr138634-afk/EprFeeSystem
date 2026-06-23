import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, Save, X, Power } from 'lucide-react'
import { masterApi } from '../../services/api'

const listOf = (r) => r.data.results || r.data
const emptyForm = { house_name: '', color: '' }

export default function HouseMaster() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const { data: houses = [], isLoading } = useQuery({
    queryKey: ['house-master'],
    queryFn: () => masterApi.getHouseMaster().then(listOf),
  })

  const resetForm = () => { setForm(emptyForm); setShowForm(false); setEditingId(null) }

  const saveMutation = useMutation({
    mutationFn: (data) => editingId ? masterApi.updateHouseMaster(editingId, data) : masterApi.createHouseMaster(data),
    onSuccess: () => {
      qc.invalidateQueries(['house-master'])
      toast.success(editingId ? 'House updated!' : 'House created!')
      resetForm()
    },
    onError: (e) => toast.error(e.response?.data?.house_name?.[0] || e.response?.data?.detail || 'Failed to save house'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => masterApi.deleteHouseMaster(id),
    onSuccess: () => { qc.invalidateQueries(['house-master']); toast.success('House deleted!') },
    onError: () => toast.error('Failed to delete house'),
  })

  const toggleMutation = useMutation({
    mutationFn: (id) => masterApi.toggleHouseMasterStatus(id),
    onSuccess: () => { qc.invalidateQueries(['house-master']); toast.success('Status updated!') },
    onError: () => toast.error('Failed to toggle status'),
  })

  const handleEdit = (h) => {
    setForm({ house_name: h.house_name, color: h.color || '' })
    setEditingId(h.id)
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
          <h1 className="text-2xl font-bold text-gray-800">House Master</h1>
          <p className="text-sm text-gray-500 mt-1">School houses for sports day / inter-house events</p>
        </div>
        <button onClick={() => (showForm ? resetForm() : setShowForm(true))} className="btn-primary flex items-center gap-2">
          {showForm ? <X size={18} /> : <Plus size={18} />} {showForm ? 'Cancel' : 'Add House'}
        </button>
      </div>

      {showForm && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">{editingId ? 'Edit House' : 'Add New House'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="form-label">House Name *</label><input className="form-input" value={form.house_name} onChange={e => setForm(p => ({ ...p, house_name: e.target.value }))} placeholder="e.g., Red House" required /></div>
              <div><label className="form-label">Color</label><input className="form-input" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} placeholder="e.g., Red, #FF0000" /></div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saveMutation.isPending} className="btn-primary flex items-center gap-2"><Save size={18} /> {editingId ? 'Update' : 'Save'} House</button>
              <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="p-6 border-b"><h2 className="text-lg font-semibold text-gray-700">Houses ({houses.length})</h2></div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : houses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No houses found. Click "Add House" to create one.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="table-header text-left px-6 py-3">S.No</th>
                  <th className="table-header text-left px-6 py-3">House Name</th>
                  <th className="table-header text-left px-6 py-3">Color</th>
                  <th className="table-header text-center px-6 py-3">Status</th>
                  <th className="table-header text-center px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {houses.map((h, i) => (
                  <tr key={h.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">{i + 1}</td>
                    <td className="px-6 py-4 font-medium">{h.house_name}</td>
                    <td className="px-6 py-4 text-sm">
                      {h.color ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: h.color }} /> {h.color}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4 text-center"><span className={h.status ? 'badge-green' : 'badge-gray'}>{h.status ? 'Active' : 'Inactive'}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => toggleMutation.mutate(h.id)} className={h.status ? 'p-2 text-red-600 hover:bg-red-50 rounded' : 'p-2 text-green-600 hover:bg-green-50 rounded'} title={h.status ? 'Deactivate' : 'Activate'}><Power size={16} /></button>
                        <button onClick={() => handleEdit(h)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Edit2 size={16} /></button>
                        <button onClick={() => { if (window.confirm('Delete this house?')) deleteMutation.mutate(h.id) }} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 size={16} /></button>
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
