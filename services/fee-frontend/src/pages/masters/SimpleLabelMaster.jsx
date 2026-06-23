import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, Save, X, Power } from 'lucide-react'

const listOf = (r) => r.data.results || r.data

/** Shared "single name + status" master CRUD list — used by House, Blood
 * Group, Category, Religion, and Caste masters (same shape, different
 * field/endpoint), to avoid five near-identical copies of this page. */
export default function SimpleLabelMaster({ title, subtitle, fieldName, fieldLabel, placeholder, queryKey, api, addLabel, itemLabel }) {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [value, setValue] = useState('')

  const { data: items = [], isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: () => api.get().then(listOf),
  })

  const resetForm = () => { setValue(''); setShowForm(false); setEditingId(null) }

  const saveMutation = useMutation({
    mutationFn: (data) => editingId ? api.update(editingId, data) : api.create(data),
    onSuccess: () => {
      qc.invalidateQueries([queryKey])
      toast.success(editingId ? `${itemLabel} updated!` : `${itemLabel} created!`)
      resetForm()
    },
    onError: (e) => toast.error(e.response?.data?.[fieldName]?.[0] || e.response?.data?.detail || `Failed to save ${itemLabel.toLowerCase()}`),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.remove(id),
    onSuccess: () => { qc.invalidateQueries([queryKey]); toast.success(`${itemLabel} deleted!`) },
    onError: () => toast.error(`Failed to delete ${itemLabel.toLowerCase()}`),
  })

  const toggleMutation = useMutation({
    mutationFn: (id) => api.toggle(id),
    onSuccess: () => { qc.invalidateQueries([queryKey]); toast.success('Status updated!') },
    onError: () => toast.error('Failed to toggle status'),
  })

  const handleEdit = (item) => {
    setValue(item[fieldName])
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    saveMutation.mutate({ [fieldName]: value })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        <button onClick={() => (showForm ? resetForm() : setShowForm(true))} className="btn-primary flex items-center gap-2">
          {showForm ? <X size={18} /> : <Plus size={18} />} {showForm ? 'Cancel' : addLabel}
        </button>
      </div>

      {showForm && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">{editingId ? `Edit ${itemLabel}` : `Add New ${itemLabel}`}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="max-w-sm">
              <label className="form-label">{fieldLabel} *</label>
              <input className="form-input" value={value} onChange={e => setValue(e.target.value)} placeholder={placeholder} required maxLength={50} />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saveMutation.isPending} className="btn-primary flex items-center gap-2"><Save size={18} /> {editingId ? 'Update' : 'Save'} {itemLabel}</button>
              <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="p-6 border-b"><h2 className="text-lg font-semibold text-gray-700">{title} ({items.length})</h2></div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No records found. Click "{addLabel}" to create one.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="table-header text-left px-6 py-3">S.No</th>
                  <th className="table-header text-left px-6 py-3">{fieldLabel}</th>
                  <th className="table-header text-center px-6 py-3">Status</th>
                  <th className="table-header text-center px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">{i + 1}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{item[fieldName]}</td>
                    <td className="px-6 py-4 text-center"><span className={item.status ? 'badge-green' : 'badge-gray'}>{item.status ? 'Active' : 'Inactive'}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => toggleMutation.mutate(item.id)} className={item.status ? 'p-2 text-red-600 hover:bg-red-50 rounded' : 'p-2 text-green-600 hover:bg-green-50 rounded'} title={item.status ? 'Deactivate' : 'Activate'}><Power size={16} /></button>
                        <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Edit2 size={16} /></button>
                        <button onClick={() => { if (window.confirm(`Delete this ${itemLabel.toLowerCase()}?`)) deleteMutation.mutate(item.id) }} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 size={16} /></button>
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
