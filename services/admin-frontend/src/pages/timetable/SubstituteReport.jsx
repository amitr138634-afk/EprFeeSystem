import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserCheck, Calendar, Plus, X, Save } from 'lucide-react'
import api, { staffApi } from '../../services/api'

export default function SubstituteReport() {
  const queryClient = useQueryClient()
  const today = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(today)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    original_teacher: '',
    substitute_teacher: '',
    timetable: '',
    date: today,
    reason: ''
  })

  // Fetch Teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => staffApi.list().then(r => r.data.results || r.data),
  })

  // Fetch Timetable for selection
  const { data: timetableEntries = [] } = useQuery({
    queryKey: ['all-timetable'],
    queryFn: () => api.get('/timetable/').then(r => r.data.results || r.data),
  })

  // Fetch Substitutes for selected date
  const { data: substitutes = [], isLoading } = useQuery({
    queryKey: ['substitutes', selectedDate],
    queryFn: () => api.get('/timetable/substitutes/', {
      params: { date: selectedDate }
    }).then(r => r.data.results || r.data),
  })

  // Add Substitute
  const addMutation = useMutation({
    mutationFn: (data) => api.post('/timetable/substitutes/', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['substitutes'])
      setShowAddModal(false)
      resetForm()
      alert('✅ Substitute added successfully!')
    },
    onError: (error) => {
      alert(`❌ Error: ${error.response?.data?.detail || 'Failed to add substitute'}`)
    }
  })

  const resetForm = () => {
    setFormData({
      original_teacher: '',
      substitute_teacher: '',
      timetable: '',
      date: selectedDate,
      reason: ''
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.original_teacher || !formData.substitute_teacher || !formData.timetable) {
      alert('⚠️ Please fill all required fields')
      return
    }
    addMutation.mutate(formData)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <UserCheck size={32} />
          Teacher Substitute Report
        </h1>
        <p className="text-teal-100 mt-1">Manage daily teacher substitutions</p>
      </div>

      {/* Date Filter & Add Button */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
            >
              <Plus size={20} />
              Add Substitute
            </button>
          </div>
        </div>
      </div>

      {/* Substitutes List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-teal-50">
          <h2 className="text-lg font-semibold text-gray-800">
            Substitutions for {new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h2>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading substitutes...</p>
          </div>
        ) : substitutes.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <UserCheck size={48} className="mx-auto text-gray-300 mb-3" />
            <p>No substitutions for this date</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Original Teacher</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Substitute Teacher</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class/Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {substitutes.map((sub, idx) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{sub.original_teacher_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-teal-600">{sub.substitute_teacher_name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {sub.timetable_details ? (
                        <div>
                          <div className="font-medium text-gray-900">
                            {sub.timetable_details.class_name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {sub.timetable_details.period_name} ({sub.timetable_details.period_time})
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            {sub.timetable_details.subject_name}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{sub.reason || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(sub.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Substitute Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Add Teacher Substitute</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original Teacher <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.original_teacher}
                    onChange={(e) => setFormData({...formData, original_teacher: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    required
                  >
                    <option value="">-- Select Teacher --</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Substitute Teacher <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.substitute_teacher}
                    onChange={(e) => setFormData({...formData, substitute_teacher: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    required
                  >
                    <option value="">-- Select Teacher --</option>
                    {teachers.filter(t => t.id !== parseInt(formData.original_teacher)).map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timetable Entry <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.timetable}
                  onChange={(e) => setFormData({...formData, timetable: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  required
                >
                  <option value="">-- Select Class/Period --</option>
                  {timetableEntries
                    .filter(entry => entry.teacher === parseInt(formData.original_teacher))
                    .map(entry => (
                      <option key={entry.id} value={entry.id}>
                        {entry.class_name} - {entry.day} - {entry.period_name} ({entry.subject_name})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  rows="3"
                  placeholder="e.g., Sick leave, Personal work, etc."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="flex-1 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {addMutation.isPending ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save size={20} />
                      Add Substitute
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
