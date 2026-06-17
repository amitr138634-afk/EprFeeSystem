import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { masterApi } from '../../services/api'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'
import { Plus, Trash2, Power, X, Save } from 'lucide-react'

export default function SectionMaster() {
  const activeSession = useAuthStore(s => s.currentSession?.session_year) || ''
  const [showModal, setShowModal] = useState(false)
  const [filters, setFilters] = useState({ class_id: '', session: activeSession })
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    class_master: '',
    sections: [], // Multi-select
    session: activeSession,
    status: true
  })

  // Fetch classes
  const { data: classes = [] } = useQuery({
    queryKey: ['classes', filters.session],
    queryFn: () => masterApi.classes({ session: filters.session }).then(r => r.data.results || r.data)
  })

  // Fetch available sections from Sec Master
  const { data: availableSections = [] } = useQuery({
    queryKey: ['section-master'],
    queryFn: () => masterApi.getSectionMaster().then(r => r.data.results || r.data)
  })

  // Fetch assigned class-sections
  const { data: classSections = [], isLoading } = useQuery({
    queryKey: ['class-sections', filters],
    queryFn: () => masterApi.sections(filters).then(r => r.data.results || r.data)
  })

  // Get already assigned sections for selected class
  const getAssignedSectionsForClass = (classId) => {
    if (!classId) return []
    return classSections
      .filter(cs => cs.class_master === parseInt(classId) && cs.session === formData.session)
      .map(cs => cs.section_name)
  }

  // Filter available sections - show only unassigned ones
  const getAvailableSectionsForClass = () => {
    if (!formData.class_master) return availableSections.filter(s => s.status)
    
    const assignedSections = getAssignedSectionsForClass(formData.class_master)
    return availableSections.filter(s => 
      s.status && !assignedSections.includes(s.section)
    )
  }

  // Create multiple class-section mappings
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const promises = data.sections.map(sectionId => {
        const section = availableSections.find(s => s.id === parseInt(sectionId))
        return masterApi.createSection({
          class_master: data.class_master,
          section_name: section.section,
          session: data.session,
          status: data.status
        })
      })
      return Promise.allSettled(promises) // Use allSettled to handle partial failures
    },
    onSuccess: (results) => {
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length
      
      queryClient.invalidateQueries(['class-sections'])
      
      if (failed === 0) {
        toast.success(`All ${successful} section(s) assigned successfully!`)
      } else if (successful > 0) {
        toast.success(`${successful} section(s) assigned. ${failed} skipped (may already exist).`, { duration: 4000 })
      } else {
        toast.error('All sections already assigned to this class.')
      }
      
      closeModal()
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to assign sections')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => masterApi.deleteSection(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['class-sections'])
      toast.success('Deleted successfully')
    }
  })

  const toggleStatusMutation = useMutation({
    mutationFn: (id) => masterApi.toggleSectionStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['class-sections'])
      toast.success('Status updated')
    }
  })

  const openModal = () => {
    setFormData({ class_master: '', sections: [], session: activeSession, status: true })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setFormData({ class_master: '', sections: [], session: activeSession, status: true })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.sections.length === 0) {
      toast.error('Please select at least one section')
      return
    }
    createMutation.mutate(formData)
  }

  const handleSectionToggle = (sectionId) => {
    setFormData(prev => {
      const sections = prev.sections.includes(sectionId.toString())
        ? prev.sections.filter(id => id !== sectionId.toString())
        : [...prev.sections, sectionId.toString()]
      return { ...prev, sections }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Class Section Master</h1>
          <p className="text-sm text-gray-500">Assign sections to classes</p>
        </div>
        <button onClick={openModal} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Assign Sections
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Session</label>
            <input type="text" value={filters.session} onChange={(e) => setFilters({ ...filters, session: e.target.value })} className="form-input" />
          </div>
          <div>
            <label className="form-label">Filter by Class</label>
            <select value={filters.class_id} onChange={(e) => setFilters({ ...filters, class_id: e.target.value })} className="form-input">
              <option value="">All Classes</option>
              {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.class_name}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={() => setFilters({ class_id: '', session: activeSession })} className="btn-secondary w-full">Clear</button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Assignments ({classSections.length})</h2>
        </div>
        {isLoading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : classSections.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No assignments found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="table-header text-left px-4 py-3">S.No</th>
                <th className="table-header text-left px-4 py-3">Class</th>
                <th className="table-header text-left px-4 py-3">Section</th>
                <th className="table-header text-left px-4 py-3">Session</th>
                <th className="table-header text-left px-4 py-3">Status</th>
                <th className="table-header text-center px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {classSections.map((section, idx) => (
                <tr key={section.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium">{section.class_name}</td>
                  <td className="px-4 py-3"><span className="text-lg font-bold text-blue-600">{section.section_name}</span></td>
                  <td className="px-4 py-3 text-sm">{section.session}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-medium ${section.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {section.status ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => toggleStatusMutation.mutate(section.id)} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded">
                        <Power size={16} />
                      </button>
                      <button onClick={() => confirm(`Delete ${section.section_name}?`) && deleteMutation.mutate(section.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Assign Sections to Class</h2>
                <p className="text-sm text-blue-100">Select class and multiple sections</p>
              </div>
              <button onClick={closeModal} className="hover:bg-white/20 rounded-full p-2">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="form-label">Select Class *</label>
                <select value={formData.class_master} onChange={(e) => setFormData({ ...formData, class_master: e.target.value })} className="form-input" required>
                  <option value="">-- Select Class --</option>
                  {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.class_name}</option>)}
                </select>
              </div>

              <div>
                <label className="form-label">Select Sections * (Multiple)</label>
                <div className="border-2 rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50">
                  {!formData.class_master ? (
                    <p className="text-center text-gray-500 py-4">Please select a class first</p>
                  ) : getAvailableSectionsForClass().length === 0 ? (
                    <p className="text-center text-gray-500 py-4">
                      All sections already assigned to this class or no sections available in Sec Master.
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-3">
                      {getAvailableSectionsForClass().map(section => (
                        <label key={section.id} className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer ${
                          formData.sections.includes(section.id.toString()) ? 'bg-blue-100 border-blue-500 shadow' : 'bg-white border-gray-300 hover:border-blue-300'
                        }`}>
                          <input type="checkbox" checked={formData.sections.includes(section.id.toString())} onChange={() => handleSectionToggle(section.id)} className="w-5 h-5" />
                          <span className="text-lg font-bold">{section.section}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Selected: {formData.sections.length} section(s)
                  {formData.class_master && getAssignedSectionsForClass(formData.class_master).length > 0 && (
                    <span className="ml-2 text-orange-600">
                      • Already assigned: {getAssignedSectionsForClass(formData.class_master).join(', ')}
                    </span>
                  )}
                </p>
              </div>

              <div>
                <label className="form-label">Session *</label>
                <input type="text" value={formData.session} onChange={(e) => setFormData({ ...formData, session: e.target.value })} className="form-input" required />
              </div>

              <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
                <input type="checkbox" id="status" checked={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.checked })} className="w-4 h-4" />
                <label htmlFor="status" className="text-sm">Active Status</label>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button type="submit" disabled={createMutation.isPending} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                  <Save size={18} />
                  {createMutation.isPending ? 'Assigning...' : 'Assign Sections'}
                </button>
                <button type="button" onClick={closeModal} className="px-6 py-3 bg-gray-200 rounded-lg font-semibold hover:bg-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
