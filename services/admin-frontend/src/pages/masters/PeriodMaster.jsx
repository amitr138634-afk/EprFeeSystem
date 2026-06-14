import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, X, Clock, Zap, AlertCircle } from 'lucide-react'
import api from '../../services/api'

export default function PeriodMaster() {
  const [showModal, setShowModal] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    start_time: '',
    end_time: '',
    period_order: 0,
    is_break: false,
    status: true
  })
  const [wizardConfig, setWizardConfig] = useState({
    totalPeriods: 8,
    periodDuration: 45,
    startTime: '08:00',
    shortBreak: true,
    shortBreakAfter: 2,
    shortBreakDuration: 15,
    lunchBreak: true,
    lunchBreakAfter: 4,
    lunchBreakDuration: 40
  })
  const [errors, setErrors] = useState({})

  const queryClient = useQueryClient()

  const { data: periods = [], isLoading } = useQuery({
    queryKey: ['periods'],
    queryFn: () => api.get('/timetable/periods/').then(r => r.data.results || r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/timetable/periods/', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['periods'])
      closeModal()
    },
    onError: (error) => {
      console.error('Create error:', error.response?.data)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/timetable/periods/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['periods'])
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/timetable/periods/${id}/`),
    onSuccess: () => queryClient.invalidateQueries(['periods']),
  })

  const openModal = (period = null) => {
    if (period) {
      setEditingPeriod(period)
      setFormData({
        name: period.name,
        start_time: period.start_time,
        end_time: period.end_time,
        period_order: period.period_order,
        is_break: period.is_break,
        status: period.status
      })
    } else {
      setEditingPeriod(null)
      const nextOrder = periods.length > 0 ? Math.max(...periods.map(p => p.period_order)) + 1 : 1
      setFormData({
        name: '',
        start_time: '',
        end_time: '',
        period_order: nextOrder,
        is_break: false,
        status: true
      })
    }
    setShowModal(true)
    setErrors({})
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingPeriod(null)
    setFormData({
      name: '',
      start_time: '',
      end_time: '',
      period_order: 0,
      is_break: false,
      status: true
    })
    setErrors({})
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Period name is required'
    if (!formData.start_time) newErrors.start_time = 'Start time is required'
    if (!formData.end_time) newErrors.end_time = 'End time is required'
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    if (editingPeriod) {
      updateMutation.mutate({ id: editingPeriod.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this period?')) {
      deleteMutation.mutate(id)
    }
  }

  // Function to add minutes to time string
  const addMinutes = (timeStr, minutes) => {
    const [hours, mins] = timeStr.split(':').map(Number)
    const totalMinutes = hours * 60 + mins + minutes
    const newHours = Math.floor(totalMinutes / 60) % 24
    const newMins = totalMinutes % 60
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`
  }

  const generatePeriods = async () => {
    try {
      const periodsToCreate = []
      let currentTime = wizardConfig.startTime
      let periodCounter = 1

      for (let i = 0; i < wizardConfig.totalPeriods; i++) {
        const startTime = currentTime
        const endTime = addMinutes(currentTime, wizardConfig.periodDuration)
        
        periodsToCreate.push({
          name: `Period ${periodCounter}`,
          start_time: startTime,
          end_time: endTime,
          period_order: periodsToCreate.length + 1,
          is_break: false,
          status: true
        })
        
        currentTime = endTime
        periodCounter++

        // Add short break after specified period
        if (wizardConfig.shortBreak && i + 1 === wizardConfig.shortBreakAfter) {
          const breakStart = currentTime
          const breakEnd = addMinutes(currentTime, wizardConfig.shortBreakDuration)
          periodsToCreate.push({
            name: 'Short Break',
            start_time: breakStart,
            end_time: breakEnd,
            period_order: periodsToCreate.length + 1,
            is_break: true,
            status: true
          })
          currentTime = breakEnd
        }

        // Add lunch break after specified period
        if (wizardConfig.lunchBreak && i + 1 === wizardConfig.lunchBreakAfter) {
          const lunchStart = currentTime
          const lunchEnd = addMinutes(currentTime, wizardConfig.lunchBreakDuration)
          periodsToCreate.push({
            name: 'Lunch Break',
            start_time: lunchStart,
            end_time: lunchEnd,
            period_order: periodsToCreate.length + 1,
            is_break: true,
            status: true
          })
          currentTime = lunchEnd
        }
      }

      // Create all periods
      for (const period of periodsToCreate) {
        await api.post('/timetable/periods/', period)
      }

      queryClient.invalidateQueries(['periods'])
      setShowWizard(false)
      alert(`Successfully created ${periodsToCreate.length} periods!`)
    } catch (error) {
      console.error('Error generating periods:', error)
      alert('Failed to generate periods. Please try again.')
    }
  }

  const clearAllPeriods = async () => {
    if (window.confirm(`Are you sure you want to delete all ${periods.length} periods? This cannot be undone.`)) {
      try {
        for (const period of periods) {
          await api.delete(`/timetable/periods/${period.id}/`)
        }
        queryClient.invalidateQueries(['periods'])
        alert('All periods cleared successfully!')
      } catch (error) {
        console.error('Error clearing periods:', error)
        alert('Failed to clear all periods')
      }
    }
  }

  if (isLoading) return <div className="p-6">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Period Master</h1>
        <div className="flex gap-3">
          {periods.length > 0 && (
            <button
              onClick={clearAllPeriods}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 size={20} />
              Clear All
            </button>
          )}
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Zap size={20} />
            Quick Setup
          </button>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Add Manually
          </button>
        </div>
      </div>

      {periods.length === 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <div className="flex items-start">
            <Zap className="text-blue-500 mt-0.5 mr-3" size={20} />
            <div>
              <p className="font-medium text-blue-800">Quick Setup Available!</p>
              <p className="text-sm text-blue-700 mt-1">
                Use "Quick Setup" to automatically generate all periods with breaks, or add them manually one by one.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {periods.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                  No periods found. Use Quick Setup or Add Manually to create periods.
                </td>
              </tr>
            ) : (
              periods.map((period) => (
                <tr key={period.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{period.period_order}</td>
                  <td className="px-6 py-4 text-sm font-medium">{period.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      {period.start_time} - {period.end_time}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{period.duration_minutes} mins</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      period.is_break 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {period.is_break ? 'Break' : 'Regular'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openModal(period)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(period.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Quick Setup Wizard */}
      {showWizard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Zap className="text-green-600" size={28} />
                <h2 className="text-2xl font-bold">Quick Period Setup</h2>
              </div>
              <button
                onClick={() => setShowWizard(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  ⚡ Configure your school timing and all periods will be auto-generated with proper timings!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Periods
                  </label>
                  <select
                    value={wizardConfig.totalPeriods}
                    onChange={(e) => setWizardConfig({...wizardConfig, totalPeriods: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    {[6, 7, 8, 9, 10].map(n => (
                      <option key={n} value={n}>{n} Periods</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Period Duration
                  </label>
                  <select
                    value={wizardConfig.periodDuration}
                    onChange={(e) => setWizardConfig({...wizardConfig, periodDuration: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    {[35, 40, 45, 50, 60].map(n => (
                      <option key={n} value={n}>{n} minutes</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    School Start Time
                  </label>
                  <input
                    type="time"
                    value={wizardConfig.startTime}
                    onChange={(e) => setWizardConfig({...wizardConfig, startTime: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-800 mb-4">Break Configuration</h3>
                <div className="space-y-4">
                  {/* Short Break */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="shortBreak"
                      checked={wizardConfig.shortBreak}
                      onChange={(e) => setWizardConfig({...wizardConfig, shortBreak: e.target.checked})}
                      className="mt-1 w-4 h-4"
                    />
                    <div className="flex-1">
                      <label htmlFor="shortBreak" className="font-medium text-gray-700">
                        Short Break
                      </label>
                      {wizardConfig.shortBreak && (
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">After Period</label>
                            <select
                              value={wizardConfig.shortBreakAfter}
                              onChange={(e) => setWizardConfig({...wizardConfig, shortBreakAfter: parseInt(e.target.value)})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                              {Array.from({length: wizardConfig.totalPeriods}, (_, i) => i + 1).map(n => (
                                <option key={n} value={n}>Period {n}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Duration</label>
                            <select
                              value={wizardConfig.shortBreakDuration}
                              onChange={(e) => setWizardConfig({...wizardConfig, shortBreakDuration: parseInt(e.target.value)})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                              {[10, 15, 20].map(n => (
                                <option key={n} value={n}>{n} mins</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lunch Break */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="lunchBreak"
                      checked={wizardConfig.lunchBreak}
                      onChange={(e) => setWizardConfig({...wizardConfig, lunchBreak: e.target.checked})}
                      className="mt-1 w-4 h-4"
                    />
                    <div className="flex-1">
                      <label htmlFor="lunchBreak" className="font-medium text-gray-700">
                        Lunch Break
                      </label>
                      {wizardConfig.lunchBreak && (
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">After Period</label>
                            <select
                              value={wizardConfig.lunchBreakAfter}
                              onChange={(e) => setWizardConfig({...wizardConfig, lunchBreakAfter: parseInt(e.target.value)})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                              {Array.from({length: wizardConfig.totalPeriods}, (_, i) => i + 1).map(n => (
                                <option key={n} value={n}>Period {n}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Duration</label>
                            <select
                              value={wizardConfig.lunchBreakDuration}
                              onChange={(e) => setWizardConfig({...wizardConfig, lunchBreakDuration: parseInt(e.target.value)})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                              {[30, 40, 45].map(n => (
                                <option key={n} value={n}>{n} mins</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t">
                <button
                  onClick={() => setShowWizard(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={generatePeriods}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Zap size={20} />
                  Generate {wizardConfig.totalPeriods + (wizardConfig.shortBreak ? 1 : 0) + (wizardConfig.lunchBreak ? 1 : 0)} Periods
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingPeriod ? 'Edit Period' : 'Add Period'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Period 1, Break, Lunch"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={16} />
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.start_time ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.start_time && (
                    <p className="mt-1 text-sm text-red-600">{errors.start_time}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.end_time ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.end_time && (
                    <p className="mt-1 text-sm text-red-600">{errors.end_time}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.period_order}
                  onChange={(e) => setFormData({ ...formData, period_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_break"
                  checked={formData.is_break}
                  onChange={(e) => setFormData({ ...formData, is_break: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_break" className="text-sm font-medium text-gray-700">
                  This is a break period
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="status"
                  checked={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="status" className="text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
