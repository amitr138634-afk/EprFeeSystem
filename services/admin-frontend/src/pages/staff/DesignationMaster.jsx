import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { staffApi } from '../../services/api'

export default function DesignationMaster() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', status: 'active' })

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
      closeForm()
      toast.success(editing ? 'Designation updated!' : 'Designation created!')
    },
    onError: (err) => {
      const msg = err.response?.data?.name?.[0] || err.response?.data?.detail || 'Failed to save'
      toast.error(msg)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => staffApi.deleteDesignation(id),
    onSuccess: () => {
      qc.invalidateQueries(['designations'])
      toast.success('Designation deleted!')
    },
    onError: (err) => {
      const msg = err.response?.data?.detail || 'Cannot delete designation'
      toast.error(msg)
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }) => staffApi.updateDesignation(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries(['designations'])
      toast.success('Status updated!')
    },
    onError: () => toast.error('Failed to update status'),
  })

  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
    setForm({ name: '', status: 'active' })
  }

  const openEdit = (desig) => {
    setEditing(desig)
    setForm({ name: desig.name, status: desig.status })
    setShowForm(true)
  }

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', status: 'active' })
    setShowForm(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Designation Master</h1>
          <p className="text-sm text-gray-500">Manage staff designations</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Designation
        </button>
      </div>

      {showForm && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{editing ? 'Edit' : 'Add'} Designation</h3>
            <button onClick={closeForm}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Designation Name *</label>
              <input
                className="form-input"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Teacher, HOD, Lab Assistant"
              />
            </div>
            <div>
              <label className="form-label">Status *</label>
              <select
                className="form-input"
                value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button 
              onClick={() => saveMutation.mutate(form)} 
              disabled={saveMutation.isLoading || !form.name.trim()}
              className="btn-primary"
            >
              {saveMutation.isLoading ? 'Saving...' : 'Save'}
            </button>
            <button onClick={closeForm} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-700">#</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Designation Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={4} className="text-center py-10 text-gray-400">Loading...</td></tr>
              )}
              {!isLoading && designations.length === 0 && (
                <tr><td colSpan={4} className="text-center py-10 text-gray-400">No designations found</td></tr>
              )}
              {designations.map((desig, idx) => (
                <tr key={desig.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{desig.name}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatusMutation.mutate({
                        id: desig.id,
                        status: desig.status === 'active' ? 'inactive' : 'active'
                      })}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        desig.status === 'active'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {desig.status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button 
                        onClick={() => openEdit(desig)}
                        className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(`Delete "${desig.name}"? This cannot be undone.`)) {
                            deleteMutation.mutate(desig.id)
                          }
                        }}
                        className="p-1.5 hover:bg-red-50 rounded text-red-500"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
