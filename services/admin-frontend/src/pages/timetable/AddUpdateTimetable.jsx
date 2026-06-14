import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, Calendar, Copy, Check, Loader2, BookOpen, Users, AlertCircle } from 'lucide-react'
import api, { studentApi, staffApi } from '../../services/api'

const DAYS = [
  { value: 'MON', label: 'Monday' },
  { value: 'TUE', label: 'Tuesday' },
  { value: 'WED', label: 'Wednesday' },
  { value: 'THU', label: 'Thursday' },
  { value: 'FRI', label: 'Friday' }
]

export default function AddUpdateTimetable() {
  const queryClient = useQueryClient()
  const currentYear = new Date().getFullYear()
  const [sessionYear, setSessionYear] = useState(`${currentYear}-${currentYear + 1}`)
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSection, setSelectedSection] = useState('') // Single select
  const [showGrid, setShowGrid] = useState(false)
  const [timetableData, setTimetableData] = useState({})
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false) // Flag to prevent overwrite during save
  const [copyFromDay, setCopyFromDay] = useState('')
  const [copyToDays, setCopyToDays] = useState([]) // Changed to array for multi-select
  const [clearDays, setClearDays] = useState([]) // For clearing multiple days

  // Fetch Classes
  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => studentApi.classMasters().then(r => r.data.results || r.data),
  })

  // Fetch Sections based on selected class
  const { data: sections = [] } = useQuery({
    queryKey: ['sections', selectedClass],
    queryFn: () => studentApi.sectionMasters({ class_id: selectedClass }).then(r => r.data.results || r.data),
    enabled: !!selectedClass,
  })

  // Fetch Periods
  const { data: allPeriods = [], isLoading: periodsLoading } = useQuery({
    queryKey: ['periods'],
    queryFn: async () => {
      const response = await api.get('/timetable/periods/')
      console.log('✅ Periods API Response:', response.data)
      return response.data.results || response.data
    },
  })

  const periods = allPeriods.filter(p => !p.is_break && p.status)
  
  console.log('📊 All Periods:', allPeriods)
  console.log('📊 Filtered Periods (active, non-break):', periods)

  // Fetch Subjects
  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await api.get('/timetable/subjects/')
      console.log('📚 Subjects API Response:', response.data)
      return response.data.results || response.data
    },
    enabled: showGrid,
  })

  // Fetch Teachers
  const { data: teachers = [], isLoading: teachersLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await staffApi.list()
      console.log('👨‍🏫 Teachers API Response:', response.data)
      return response.data.results || response.data
    },
    enabled: showGrid,
  })

  console.log('📊 Current State:', {
    showGrid,
    subjects: subjects.length,
    teachers: teachers.length,
    subjectsLoading,
    teachersLoading
  })

  // Fetch existing timetable
  const { data: existingTimetable = [], refetch: refetchTimetable } = useQuery({
    queryKey: ['timetable', selectedClass, sessionYear],
    queryFn: () => api.get('/timetable/', {
      params: { class_id: selectedClass, session_year: sessionYear }
    }).then(r => r.data.results || r.data),
    enabled: showGrid && !!selectedClass,
  })

  // Load existing timetable
  useEffect(() => {
    // Don't reload if we're in the middle of saving
    if (isSaving) {
      console.log('⏸️ Skipping reload - save in progress')
      return
    }
    
    console.log('🔄 Loading existing timetable, count:', existingTimetable.length)
    
    if (existingTimetable.length > 0) {
      const data = {}
      existingTimetable.forEach(entry => {
        const key = `${entry.day}-${entry.period}`
        console.log(`📝 Loading entry for ${key}:`, {
          id: entry.id,
          subject: entry.subject,
          teacher: entry.teacher,
          room: entry.room
        })
        
        data[key] = {
          id: entry.id,
          subject: entry.subject,
          teacher: entry.teacher,
          room: entry.room || ''
        }
      })
      setTimetableData(data)
      console.log('✅ Timetable data loaded:', data)
    } else {
      console.log('ℹ️ No existing timetable found, starting fresh')
      setTimetableData({})
    }
    setHasChanges(false) // Reset changes flag when loading
  }, [existingTimetable, isSaving])

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async ({ entries, entriesToDelete }) => {
      setIsSaving(true) // Set flag before saving
      const results = []
      
      // First, delete entries that were removed
      for (const entryId of entriesToDelete) {
        try {
          console.log('🗑️ Deleting entry:', entryId)
          await api.delete(`/timetable/${entryId}/`)
          results.push({ _action: 'delete', id: entryId })
        } catch (error) {
          console.error('❌ Error deleting entry:', error.response?.data || error)
          setIsSaving(false)
          throw error
        }
      }
      
      // Then, create or update entries
      for (const entry of entries) {
        try {
          if (entry.id) {
            console.log('🔄 Updating entry:', entry.id, entry)
            const res = await api.patch(`/timetable/${entry.id}/`, entry)
            results.push({ ...res.data, _action: 'update', _key: `${entry.day}-${entry.period}` })
          } else {
            console.log('➕ Creating new entry:', entry)
            const res = await api.post('/timetable/', entry)
            results.push({ ...res.data, _action: 'create', _key: `${entry.day}-${entry.period}` })
          }
        } catch (error) {
          console.error('❌ Error saving entry:', error.response?.data || error)
          setIsSaving(false)
          throw error
        }
      }
      return results
    },
    onSuccess: async (results) => {
      console.log('✅ Save successful, responses:', results)
      
      // Update local state with backend response
      const updatedData = { ...timetableData }
      
      // Handle deletions - remove from local state
      results.filter(r => r._action === 'delete').forEach(result => {
        console.log(`🗑️ Removed from local state: ID ${result.id}`)
      })
      
      // Handle creates/updates - update local state
      results.filter(r => r._action !== 'delete').forEach(result => {
        const key = result._key
        updatedData[key] = {
          id: result.id,
          subject: result.subject,
          teacher: result.teacher,
          room: result.room || ''
        }
        console.log(`✅ Updated local state for ${key}:`, updatedData[key])
      })
      
      setTimetableData(updatedData)
      setHasChanges(false)
      
      // Invalidate query and refetch in background
      await queryClient.invalidateQueries(['timetable'])
      await refetchTimetable()
      
      // Clear saving flag after a delay
      setTimeout(() => {
        setIsSaving(false)
        console.log('✅ Save complete, flag cleared')
      }, 500)
      
      const summary = results.reduce((acc, r) => {
        acc[r._action] = (acc[r._action] || 0) + 1
        return acc
      }, {})
      
      alert(`✅ Timetable saved successfully!\n\nCreated: ${summary.create || 0}\nUpdated: ${summary.update || 0}\nDeleted: ${summary.delete || 0}`)
    },
    onError: (error) => {
      setIsSaving(false)
      console.error('❌ Save error:', error)
      const errorMsg = error.response?.data?.detail || 
                      error.response?.data?.non_field_errors?.[0] ||
                      JSON.stringify(error.response?.data) ||
                      'Failed to save timetable'
      alert(`❌ Error: ${errorMsg}`)
    }
  })

  const handleLoadClass = () => {
    if (!selectedClass) {
      alert('⚠️ Please select a class')
      return
    }
    if (!selectedSection) {
      alert('⚠️ Please select a section')
      return
    }
    setShowGrid(true)
    setHasChanges(false)
  }

  const getCellData = (day, periodId) => {
    const key = `${day}-${periodId}`
    return timetableData[key] || { subject: null, teacher: null, room: '' }
  }

  const updateCell = (day, periodId, field, value) => {
    const key = `${day}-${periodId}`
    const currentData = timetableData[key] || {}
    
    console.log(`📝 Updating cell ${key}, field: ${field}, value:`, value)
    
    setTimetableData(prev => ({
      ...prev,
      [key]: {
        ...currentData,
        [field]: value
      }
    }))
    setHasChanges(true)
  }

  const handleCopyDay = () => {
    if (!copyFromDay) {
      alert('⚠️ Please select source day')
      return
    }
    
    if (copyToDays.length === 0) {
      alert('⚠️ Please select at least one destination day')
      return
    }
    
    if (copyToDays.includes(copyFromDay)) {
      alert('⚠️ Source and destination days cannot be the same')
      return
    }

    const dayNames = copyToDays.map(d => DAYS.find(day => day.value === d)?.label).join(', ')
    if (!window.confirm(`📋 Copy all entries from ${DAYS.find(d => d.value === copyFromDay)?.label} to: ${dayNames}?`)) {
      return
    }

    const newData = { ...timetableData }
    
    // Copy to each selected day
    copyToDays.forEach(toDay => {
      periods.forEach(period => {
        const sourceKey = `${copyFromDay}-${period.id}`
        const destKey = `${toDay}-${period.id}`
        
        if (timetableData[sourceKey]) {
          newData[destKey] = {
            ...timetableData[sourceKey],
            id: timetableData[destKey]?.id || null
          }
        }
      })
    })
    
    setTimetableData(newData)
    setHasChanges(true)
    setCopyFromDay('')
    setCopyToDays([])
    alert(`✅ Timetable copied to ${copyToDays.length} day(s) successfully! Don't forget to save.`)
  }

  const handleClearDays = () => {
    if (clearDays.length === 0) {
      alert('⚠️ Please select at least one day to clear')
      return
    }

    const dayNames = clearDays.map(d => DAYS.find(day => day.value === d)?.label).join(', ')
    if (!window.confirm(`🗑️ Clear all entries from: ${dayNames}?\n\nThis will remove all subjects and teachers for selected days.`)) {
      return
    }

    const newData = { ...timetableData }
    
    // Clear all periods for selected days
    clearDays.forEach(day => {
      periods.forEach(period => {
        const key = `${day}-${period.id}`
        delete newData[key]
      })
    })
    
    setTimetableData(newData)
    setHasChanges(true)
    setClearDays([])
    alert(`✅ ${clearDays.length} day(s) cleared successfully! Don't forget to save.`)
  }

  const handleSave = () => {
    const entries = []
    const existingKeys = new Set()
    
    // Collect all entries that should exist
    DAYS.forEach(day => {
      periods.forEach(period => {
        const key = `${day.value}-${period.id}`
        const cellData = timetableData[key]
        
        if (cellData && (cellData.subject || cellData.teacher)) {
          existingKeys.add(key)
          
          const entry = {
            id: cellData.id || null,
            class_ref: parseInt(selectedClass),
            sections_list: [parseInt(selectedSection)],
            day: day.value,
            period: period.id,
            subject: cellData.subject || null,
            teacher: cellData.teacher || null,
            room: cellData.room || '',
            session_year: sessionYear
          }
          
          console.log(`📦 Preparing entry for ${key}:`, entry)
          entries.push(entry)
        }
      })
    })

    // Find entries that need to be deleted (exist in DB but not in current data)
    const entriesToDelete = []
    existingTimetable.forEach(entry => {
      const key = `${entry.day}-${entry.period}`
      if (!existingKeys.has(key)) {
        entriesToDelete.push(entry.id)
        console.log(`🗑️ Marking entry for deletion: ${key} (ID: ${entry.id})`)
      }
    })

    console.log('💾 Total entries to save:', entries.length)
    console.log('🗑️ Total entries to delete:', entriesToDelete.length)
    console.log('💾 Entries breakdown:', {
      new: entries.filter(e => !e.id).length,
      update: entries.filter(e => e.id).length,
      delete: entriesToDelete.length
    })

    if (entries.length === 0 && entriesToDelete.length === 0) {
      alert('⚠️ No changes to save.')
      return
    }

    const message = `💾 Save Changes?\n\n` +
                   `New: ${entries.filter(e => !e.id).length}\n` +
                   `Updates: ${entries.filter(e => e.id).length}\n` +
                   `Deletions: ${entriesToDelete.length}`

    if (window.confirm(message)) {
      saveMutation.mutate({ entries, entriesToDelete })
    }
  }

  if (periodsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <span className="ml-3 text-lg">Loading periods...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Calendar size={32} />
              Add / Update Timetable
            </h1>
            <p className="text-blue-100 mt-1">Create or modify class timetable for the week</p>
          </div>
          {hasChanges && (
            <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 animate-pulse">
              <AlertCircle size={18} />
              Unsaved Changes
            </div>
          )}
        </div>
      </div>

      {/* Class & Section Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Class <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value)
                setSelectedSection('') // Reset section when class changes
                setShowGrid(false)
                setTimetableData({})
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Class --</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.class_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Section <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSection}
              onChange={(e) => {
                setSelectedSection(e.target.value)
                setShowGrid(false)
              }}
              disabled={!selectedClass}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">-- Select Section --</option>
              {sections.map(sec => (
                <option key={sec.id} value={sec.id}>
                  {sec.section_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Year
            </label>
            <input
              type="text"
              value={sessionYear}
              onChange={(e) => setSessionYear(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="2024-2025"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleLoadClass}
              disabled={!selectedClass || !selectedSection}
              className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Calendar size={20} />
              Load Timetable
            </button>
          </div>
        </div>
      </div>

      {/* Timetable Grid */}
      {showGrid && (
        <>
          {/* No Periods Warning */}
          {periods.length === 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} className="text-red-600" />
                <div>
                  <h4 className="font-semibold text-red-800">No Periods Found!</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Please create periods first from Masters → Period Master. 
                    At least one active period is required to create timetable.
                  </p>
                </div>
              </div>
            </div>
          )}

          {periods.length > 0 && (
            <>
              {/* Copy Day & Clear Days */}
              <div className="bg-white rounded-lg shadow p-6 space-y-4">
                {/* Copy Day Section */}
                <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                  <Copy size={20} className="text-purple-600" />
                  <h3 className="font-semibold text-gray-800">Copy Day</h3>
                  <div className="flex-1 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 font-medium">From:</label>
                      <select
                        value={copyFromDay}
                        onChange={(e) => setCopyFromDay(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">-- Select Source Day --</option>
                        {DAYS.map(day => (
                          <option key={day.value} value={day.value}>{day.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 font-medium">To (Multiple):</label>
                      <div className="border border-gray-300 rounded-lg p-2 bg-white min-w-[200px]">
                        <div className="flex flex-wrap gap-2">
                          {DAYS.filter(d => d.value !== copyFromDay).map(day => (
                            <label key={day.value} className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={copyToDays.includes(day.value)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setCopyToDays([...copyToDays, day.value])
                                  } else {
                                    setCopyToDays(copyToDays.filter(d => d !== day.value))
                                  }
                                }}
                                disabled={!copyFromDay}
                                className="w-3 h-3 text-purple-600 rounded"
                              />
                              <span className="text-xs text-gray-700">{day.label.substring(0, 3)}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      {copyToDays.length > 0 && (
                        <span className="text-xs text-green-600 font-medium">
                          ✓ {copyToDays.length} selected
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={handleCopyDay}
                      disabled={!copyFromDay || copyToDays.length === 0}
                      className="px-4 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm whitespace-nowrap"
                    >
                      <Copy size={16} />
                      Copy to {copyToDays.length || 0} Day(s)
                    </button>
                  </div>
                </div>

                {/* Clear Days Section */}
                <div className="flex items-center gap-4">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <h3 className="font-semibold text-gray-800">Clear Days</h3>
                  <div className="flex-1 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 font-medium">Select Days to Clear:</label>
                      <div className="border border-gray-300 rounded-lg p-2 bg-white min-w-[280px]">
                        <div className="flex flex-wrap gap-2">
                          {DAYS.map(day => (
                            <label key={day.value} className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={clearDays.includes(day.value)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setClearDays([...clearDays, day.value])
                                  } else {
                                    setClearDays(clearDays.filter(d => d !== day.value))
                                  }
                                }}
                                className="w-3 h-3 text-red-600 rounded"
                              />
                              <span className="text-xs text-gray-700">{day.label.substring(0, 3)}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      {clearDays.length > 0 && (
                        <span className="text-xs text-red-600 font-medium">
                          ✗ {clearDays.length} selected
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={handleClearDays}
                      disabled={clearDays.length === 0}
                      className="px-4 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm whitespace-nowrap"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Clear {clearDays.length || 0} Day(s)
                    </button>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={!hasChanges || saveMutation.isPending}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saveMutation.isPending ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        Save Timetable
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Grid Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700 bg-gray-200 sticky left-0 z-20 min-w-[120px]">
                          Day / Period
                        </th>
                        {periods.map(period => (
                          <th key={period.id} className="border border-gray-300 px-3 py-3 text-center font-semibold text-gray-700 min-w-[200px]">
                            <div className="text-sm">{period.name}</div>
                            <div className="text-xs text-gray-600 mt-1 font-normal">
                              {period.start_time} - {period.end_time}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {DAYS.map((day, idx) => (
                        <tr key={day.value} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 px-4 py-4 bg-gray-100 font-semibold sticky left-0 z-10">
                            <div className="text-sm text-gray-800">{day.label}</div>
                          </td>
                          {periods.map(period => {
                            const cellData = getCellData(day.value, period.id)
                            
                            return (
                              <td key={`${day.value}-${period.id}`} className="border border-gray-300 p-2 align-top">
                                <div className="space-y-2">
                                  {/* Subject Dropdown */}
                                  <select
                                    value={cellData.subject || ''}
                                    onChange={(e) => {
                                      const value = e.target.value ? parseInt(e.target.value) : null
                                      console.log('📚 Subject changed:', value)
                                      updateCell(day.value, period.id, 'subject', value)
                                    }}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  >
                                    <option value="">-- Subject --</option>
                                    {subjects.filter(s => s.status === 'active').map(subject => (
                                      <option key={subject.id} value={subject.id}>
                                        {subject.name}
                                      </option>
                                    ))}
                                  </select>

                                  {/* Teacher Dropdown */}
                                  <select
                                    value={cellData.teacher || ''}
                                    onChange={(e) => {
                                      const value = e.target.value ? parseInt(e.target.value) : null
                                      console.log('👨‍🏫 Teacher changed:', value)
                                      updateCell(day.value, period.id, 'teacher', value)
                                    }}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                  >
                                    <option value="">-- Teacher --</option>
                                    {teachers.filter(t => t.status === 'active').map(teacher => (
                                      <option key={teacher.id} value={teacher.id}>
                                        {teacher.full_name}
                                      </option>
                                    ))}
                                  </select>

                                  {/* Display selected values */}
                                  {(cellData.subject || cellData.teacher) && (
                                    <div className="pt-1 space-y-1">
                                      {cellData.subject && (
                                        <div className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded">
                                          <BookOpen size={12} />
                                          <span className="truncate">
                                            {subjects.find(s => s.id === cellData.subject)?.name}
                                          </span>
                                        </div>
                                      )}
                                      {cellData.teacher && (
                                        <div className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                                          <Users size={12} />
                                          <span className="truncate">
                                            {teachers.find(t => t.id === cellData.teacher)?.full_name}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Check size={18} />
                  Instructions:
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Select subject and teacher directly from dropdowns in each cell</li>
                  <li>• Changes are tracked automatically - click "Save Timetable" when done</li>
                  <li>• Use "Copy Day" feature to duplicate timetable from one day to another</li>
                  <li>• You can leave cells empty if no class is scheduled</li>
                  <li>• Timetable will be applied to all selected sections</li>
                </ul>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
