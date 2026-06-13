import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { staffApi } from '../../services/api'

export default function DeptDesignationMapping() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ department: '', designations: [], status: 'active' })

  const { data: mappings = [], isLoading } = useQuery({
    queryKey: ['dept-designation-mappings'],
    queryFn: () => staffApi.departmentDesignations().then(r => r.data.results || r.data),
  })

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => staffApi.departments().then(r => {
      const data = r.data.results || r.data
      return data.filter(d => d.status === 'active')
    }),
  })

  const { data: designations = [] } = useQuery({
    queryKey: ['designations'],
    queryFn: () => staffApi.designations().then(r => {
      const data = r.data.results || r.data
      return data.filter(d => d.status === 'active')
    }),
  })

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? staffApi.updateDeptDesignation(editing.id, data)
      : staffApi.createDeptDesignation(data),
    onSuccess: () => {
      qc.invalidateQueries(['dept-designation-mappings'])
      closeForm()
      toast.success(editing ? 'Mapping updated!' : 'Mapping created!')
    },
    onError: (err) => {
      const msg = err.response?.data?.department?.[0] || err.response?.data?.detail || 'Failed to save'
      toast.error(msg)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => staffApi.deleteDeptDesignation(id),
    onSuccess: () => {
      qc.invalidateQueries(['dept-designation-mappings'])
      toast.success('Mapping deleted!')
    },
    onError: (err) => {
      const msg = err.response?.data?.detail || 'Cannot delete mapping'
      toast.error(msg)
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }) => staffApi.updateDeptDesignation(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries(['dept-designation-mappings'])
      toast.success('Status updated!')
    },
    onError: () => toast.error('Failed to update status'),
  })

  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
    setForm({ department: '', designations: [], status: 'active' })
  }

  const openEdit = (mapping) => {
    setEditing(mapping)
    setForm({ 
      department: mapping.department,
      designations: mapping.designations || [],
      status: mapping.status 
    })
    setShowForm(true)
  }

  const openNew = () => {
    setEditing(null)
    setForm({ department: '', designations: [], status: 'active' })
    setShowForm(true)
  }

  const handleDesignationToggle = (desigId) => {
    setForm(prev => {
      const isSelected = prev.designations.includes(desigId)
      return {
        ...prev,
        designations: isSelected
          ? prev.designations.filter(id => id !== desigId)
          : [...prev.designations, desigId]
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Department-Designation Master</h1>
          <p className="text-sm text-gray-500">Map designations to departments</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Mapping
        </button>
      </div>

      {showForm && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{editing ? 'Edit' : 'Add'} Department-Designation Mapping</h3>
            <button onClick={closeForm}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Department (Single Select) *</label>
                <select
                  className="form-input"
                  value={form.department}
                  onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                  disabled={editing} // Can't change department when editing
                >
                  <option value="">-- Select Department --</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
                {editing && (
                  <p className="text-xs text-gray-500 mt-1">Department cannot be changed when editing</p>
                )}
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

            <div>
              <label className="form-label">Designations (Multi-select) *</label>
              <div className="border border-gray-300 rounded-lg p-3 max-h-56 overflow-y-auto bg-white">
                {designations.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No active designations available</p>
                ) : (
                  <div className="space-y-2">
                    {designations.map(desig => (
                      <label key={desig.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={form.designations.includes(desig.id)}
                          onChange={() => handleDesignationToggle(desig.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{desig.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Select all designations allowed for this department</p>
            </div>
          </div>

          <div className="flex gap-2 mt-5">
            <button 
              onClick={() => saveMutation.mutate(form)} 
              disabled={saveMutation.isLoading || !form.department || form.designations.length === 0}
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
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Department</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Designations</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">Loading...</td></tr>
              )}
              {!isLoading && mappings.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">No mappings found</td></tr>
              )}
              {mappings.map((mapping, idx) => (
                <tr key={mapping.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{mapping.department_name}</td>
                  <td className="px-4 py-3">
                    {mapping.designation_names?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {mapping.designation_names.map((name, i) => (
                          <span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">
                            {name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">No designations</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatusMutation.mutate({
                        id: mapping.id,
                        status: mapping.status === 'active' ? 'inactive' : 'active'
                      })}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        mapping.status === 'active'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {mapping.status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button 
                        onClick={() => openEdit(mapping)}
                        className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(`Delete mapping for "${mapping.department_name}"? This cannot be undone.`)) {
                            deleteMutation.mutate(mapping.id)
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
