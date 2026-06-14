import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { masterApi } from '../../services/api'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, Power, X, Save } from 'lucide-react'

export default function SecMaster() {
  const [showModal, setShowModal] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    section: '',
    status: true
  })

  // Fetch sections
  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['section-master'],
    queryFn: () => masterApi.getSectionMaster().then(r => r.data.results || r.data)
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => masterApi.createSectionMaster(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['section-master'])
      toast.success('Section created successfully')
      closeModal()
    },
    onError: (error) => {
      toast.error(error.response?.data?.section?.[0] || error.response?.data?.detail || 'Failed to create section')
    }
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => masterApi.updateSectionMaster(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['section-master'])
      toast.success('Section updated successfully')
      closeModal()
    },
    onError: (error) => {
      toast.error(error.response?.data?.section?.[0] || error.response?.data?.detail || 'Failed to update section')
    }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => masterApi.deleteSectionMaster(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['section-master'])
      toast.success('Section deleted successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to delete section')
    }
  })

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (id) => masterApi.toggleSectionMasterStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['section-master'])
      toast.success('Section status updated')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to toggle status')
    }
  })

  const openModal = (section = null) => {
    if (section) {
      setEditingSection(section)
      setFormData({
        section: section.section,
        status: section.status
      })
    } else {
      setEditingSection(null)
      setFormData({
        section: '',
        status: true
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingSection(null)
    setFormData({
      section: '',
      status: true
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingSection) {
      updateMutation.mutate({ id: editingSection.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (section) => {
    if (confirm(`Are you sure you want to delete section "${section.section}"?`)) {
      deleteMutation.mutate(section.id)
    }
  }

  const handleToggleStatus = (section) => {
    toggleStatusMutation.mutate(section.id)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Section Master</h1>
          <p className="text-sm text-gray-500 mt-1">Manage section names (A, B, C, etc.)</p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Add Section
        </button>
      </div>

      {/* Table */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700">All Sections ({sections.length})</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : sections.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No sections found. Click "Add Section" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="table-header text-left px-4 py-3">S.No</th>
                  <th className="table-header text-left px-4 py-3">Section Name</th>
                  <th className="table-header text-left px-4 py-3">Status</th>
                  <th className="table-header text-center px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((section, index) => (
                  <tr key={section.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                    <td className="px-4 py-3">
                      <span className="text-lg font-bold text-gray-900">{section.section}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        section.status
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {section.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(section)}
                          className={`p-2 rounded-lg transition-colors ${
                            section.status
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={section.status ? 'Deactivate' : 'Activate'}
                        >
                          <Power size={18} />
                        </button>
                        <button
                          onClick={() => openModal(section)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(section)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 flex justify-between items-center rounded-t-xl">
              <h2 className="text-xl font-bold">
                {editingSection ? 'Edit Section' : 'Add New Section'}
              </h2>
              <button
                onClick={closeModal}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="form-label">Section Name *</label>
                <input
                  type="text"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="form-input text-lg font-semibold"
                  placeholder="e.g., A, B, C, D"
                  required
                  maxLength={50}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter section name (single letter or word). Must be unique.
                </p>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="status"
                  checked={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="status" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Active Status
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  {editingSection ? 'Update Section' : 'Create Section'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
