import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { feeApi } from '../../services/api'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react'

export default function FeeHeads() {
  const queryClient = useQueryClient()
  const activeSession = useAuthStore(s => s.currentSession?.session_year) || ''
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    session: activeSession,
    head1: '', head2: '', head3: '', head4: '', head5: '',
    head6: '', head7: '', head8: '', head9: '', head10: '',
    head11: '', head12: '', head13: '', head14: '', head15: '',
    head16: '', head17: '', head18: '', head19: '', head20: ''
  })

  // Fetch fee heads
  const { data: feeHeads = [], isLoading } = useQuery({
    queryKey: ['fee-heads'],
    queryFn: () => feeApi.heads().then(r => r.data.results || r.data)
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => feeApi.createHead(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['fee-heads'])
      toast.success('Fee heads created successfully!')
      resetForm()
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create fee heads')
    }
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => feeApi.updateHead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['fee-heads'])
      toast.success('Fee heads updated successfully!')
      resetForm()
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update fee heads')
    }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => feeApi.deleteHead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['fee-heads'])
      toast.success('Fee heads deleted successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete fee heads')
    }
  })

  const resetForm = () => {
    setFormData({
      session: activeSession,
      head1: '', head2: '', head3: '', head4: '', head5: '',
      head6: '', head7: '', head8: '', head9: '', head10: '',
      head11: '', head12: '', head13: '', head14: '', head15: '',
      head16: '', head17: '', head18: '', head19: '', head20: ''
    })
    setShowForm(false)
    setEditingId(null)
  }

  const handleEdit = (head) => {
    setFormData({
      session: head.session,
      head1: head.head1 || '', head2: head.head2 || '', head3: head.head3 || '',
      head4: head.head4 || '', head5: head.head5 || '', head6: head.head6 || '',
      head7: head.head7 || '', head8: head.head8 || '', head9: head.head9 || '',
      head10: head.head10 || '', head11: head.head11 || '', head12: head.head12 || '',
      head13: head.head13 || '', head14: head.head14 || '', head15: head.head15 || '',
      head16: head.head16 || '', head17: head.head17 || '', head18: head.head18 || '',
      head19: head.head19 || '', head20: head.head20 || ''
    })
    setEditingId(head.id)
    setShowForm(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this fee heads record?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Define Fee Heads</h1>
          <p className="text-sm text-gray-500 mt-1">Configure fee head names for the session</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Cancel' : 'Add Fee Heads'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            {editingId ? 'Edit Fee Heads' : 'Add New Fee Heads'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Session */}
            <div className="max-w-xs">
              <label className="form-label">Session *</label>
              <input
                type="text"
                value={formData.session}
                onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                className="form-input"
                placeholder="e.g., 2024-25"
                required
              />
            </div>

            {/* 20 Head Fields */}
            <div>
              <h3 className="text-md font-semibold text-gray-700 mb-3">Fee Head Names</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(20)].map((_, i) => {
                  const fieldName = `head${i + 1}`
                  return (
                    <div key={fieldName}>
                      <label className="form-label">Head {i + 1}</label>
                      <input
                        type="text"
                        value={formData[fieldName]}
                        onChange={(e) => setFormData({ ...formData, [fieldName]: e.target.value })}
                        className="form-input"
                        placeholder={`Fee Head ${i + 1}`}
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="btn-primary flex items-center gap-2"
              >
                <Save size={18} />
                {editingId ? 'Update' : 'Save'} Fee Heads
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700">Fee Heads Records</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : feeHeads.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No fee heads configured. Click "Add Fee Heads" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="table-header text-left px-6 py-3">S.No</th>
                  <th className="table-header text-left px-6 py-3">Session</th>
                  <th className="table-header text-left px-6 py-3">Configured Heads</th>
                  <th className="table-header text-center px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {feeHeads.map((head, index) => {
                  const configuredHeads = []
                  for (let i = 1; i <= 20; i++) {
                    if (head[`head${i}`]) {
                      configuredHeads.push(`H${i}: ${head[`head${i}`]}`)
                    }
                  }
                  return (
                    <tr key={head.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700">{index + 1}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800">
                          {head.session}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-2xl">
                          {configuredHeads.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {configuredHeads.slice(0, 5).map((h, i) => (
                                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                                  {h}
                                </span>
                              ))}
                              {configuredHeads.length > 5 && (
                                <span className="text-xs text-gray-500">+{configuredHeads.length - 5} more</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">No heads configured</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(head)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(head.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
