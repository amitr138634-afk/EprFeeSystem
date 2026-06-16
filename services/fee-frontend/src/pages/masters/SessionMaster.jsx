  import { useState } from 'react'
  import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
  import api from '../../services/api'
  import toast from 'react-hot-toast'
  import { Plus, Edit2, Trash2, Save, X, CheckCircle, XCircle } from 'lucide-react'

  export default function SessionMaster() {
    const queryClient = useQueryClient()
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    session_year: '',
    status: true
  })

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['session-master'],
    queryFn: () => api.get('/masters/sessions/').then(r => Array.isArray(r.data) ? r.data : (r.data.results || []))
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/masters/sessions/', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['session-master'])
      toast.success('Session created successfully!')
      resetForm()
    },
    onError: (error) => {
      const message = error.response?.data?.session_year?.[0] || 
                      error.response?.data?.message || 
                      'Failed to create session'
      toast.error(message)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/masters/sessions/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['session-master'])
      toast.success('Session updated successfully!')
      resetForm()
    },
    onError: (error) => {
      const message = error.response?.data?.session_year?.[0] || 
                      error.response?.data?.message || 
                      'Failed to update session'
      toast.error(message)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/masters/sessions/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries(['session-master'])
      toast.success('Session deleted successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete session')
    }
  })

  const resetForm = () => {
    setFormData({ 
      session_year: '', 
      status: true 
    })
    setShowForm(false)
    setEditingId(null)
  }

  const handleEdit = (session) => {
    setFormData({
      session_year: session.session_year,
      status: session.status
    })
    setEditingId(session.id)
    setShowForm(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validate session year format
    const sessionYearPattern = /^\d{4}-\d{4}$/
    if (!sessionYearPattern.test(formData.session_year)) {
      toast.error('Session year format should be YYYY-YYYY (e.g., 2024-2025)')
      return
    }

    // Validate consecutive years
    const [startYear, endYear] = formData.session_year.split('-').map(Number)
    if (endYear !== startYear + 1) {
      toast.error('End year should be start year + 1')
      return
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleSetCurrent = (id) => {
    if (window.confirm('Set this as the current session? This will unmark other sessions.')) {
      setCurrentMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Session Master</h1>
          <p className="text-sm text-gray-500 mt-1">Define and manage academic sessions</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Cancel' : 'Add Session'}
        </button>
      </div>

      {showForm && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            {editingId ? 'Edit Session' : 'Add New Session'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Session Year *</label>
                <input
                  type="text"
                  value={formData.session_year}
                  onChange={(e) => setFormData({ ...formData, session_year: e.target.value })}
                  className="form-input"
                  placeholder="e.g., 2024-2025"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Format: YYYY-YYYY</p>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer mt-8">
                  <input
                    type="checkbox"
                    checked={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Save size={18} />
                {editingId ? 'Update' : 'Save'} Session
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-700">Session List</h2>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No sessions found. Click "Add Session" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="table-header text-left px-6 py-3">S.No</th>
                  <th className="table-header text-left px-6 py-3">Session Year</th>
                  <th className="table-header text-center px-6 py-3">Status</th>
                  <th className="table-header text-center px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session, index) => (
                  <tr key={session.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">{index + 1}</td>
                    <td className="px-6 py-4 font-medium">{session.session_year}</td>
                    <td className="px-6 py-4 text-center">
                      {session.status ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle size={14} className="mr-1" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          <XCircle size={14} className="mr-1" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(session)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(session.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
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
