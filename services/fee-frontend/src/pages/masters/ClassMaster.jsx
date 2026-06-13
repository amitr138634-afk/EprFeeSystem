import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { masterApi } from '../../services/api'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, Save, X, CheckCircle, XCircle } from 'lucide-react'

export default function ClassMaster() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    class_name: '',
    session: '2024-25',
    status: true
  })

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['class-master'],
    queryFn: () => masterApi.classes().then(r => r.data.results || r.data)
  })

  const createMutation = useMutation({
    mutationFn: (data) => masterApi.createClass(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['class-master'])
      toast.success('Class created successfully!')
      resetForm()
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create class')
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => masterApi.updateClass(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['class-master'])
      toast.success('Class updated successfully!')
      resetForm()
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update class')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => masterApi.deleteClass(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['class-master'])
      toast.success('Class deleted successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete class')
    }
  })

  const toggleStatusMutation = useMutation({
    mutationFn: (id) => masterApi.toggleClassStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['class-master'])
      toast.success('Class status updated!')
    },
    onError: (error) => {
      toast.error('Failed to update status')
    }
  })

  const resetForm = () => {
    setFormData({ class_name: '', session: '2024-25', status: true })
    setShowForm(false)
    setEditingId(null)
  }

  const handleEdit = (cls) => {
    setFormData({
      class_name: cls.class_name,
      session: cls.session,
      status: cls.status
    })
    setEditingId(cls.id)
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
    if (window.confirm('Are you sure you want to delete this class?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleToggleStatus = (id) => {
    toggleStatusMutation.mutate(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Class Master</h1>
          <p className="text-sm text-gray-500 mt-1">Define and manage classes</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Cancel' : 'Add Class'}
        </button>
      </div>

      {showForm && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            {editingId ? 'Edit Class' : 'Add New Class'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Class Name *</label>
                <input
                  type="text"
                  value={formData.class_name}
                  onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                  className="form-input"
                  placeholder="e.g., Class 1, Class 2, ..."
                  required
                />
              </div>
              <div>
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
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Save size={18} />
                {editingId ? 'Update' : 'Save'} Class
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
          <h2 className="text-lg font-semibold text-gray-700">Class List</h2>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : classes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No classes found. Click "Add Class" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="table-header text-left px-6 py-3">S.No</th>
                  <th className="table-header text-left px-6 py-3">Class Name</th>
                  <th className="table-header text-left px-6 py-3">Session</th>
                  <th className="table-header text-center px-6 py-3">Status</th>
                  <th className="table-header text-center px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((cls, index) => (
                  <tr key={cls.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">{index + 1}</td>
                    <td className="px-6 py-4 font-medium">{cls.class_name}</td>
                    <td className="px-6 py-4 text-sm">{cls.session}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(cls.id)}
                        className="inline-flex items-center gap-1"
                      >
                        {cls.status ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle size={14} className="mr-1" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            <XCircle size={14} className="mr-1" /> Inactive
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(cls)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(cls.id)}
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
