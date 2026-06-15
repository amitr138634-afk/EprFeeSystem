import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Printer, Download } from 'lucide-react'
import api, { studentApi } from '../../services/api'

const DAYS = [
  { value: 'MON', label: 'Monday' },
  { value: 'TUE', label: 'Tuesday' },
  { value: 'WED', label: 'Wednesday' },
  { value: 'THU', label: 'Thursday' },
  { value: 'FRI', label: 'Friday' }
]

export default function ClassWiseTimetable() {
  const currentYear = new Date().getFullYear()
  const [sessionYear, setSessionYear] = useState(`${currentYear}-${currentYear + 1}`)
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSection, setSelectedSection] = useState('') // Added section state
  const [showTimetable, setShowTimetable] = useState(false)

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
  const { data: allPeriods = [] } = useQuery({
    queryKey: ['periods'],
    queryFn: () => api.get('/timetable/periods/').then(r => r.data.results || r.data),
  })

  const periods = allPeriods.filter(p => !p.is_break && p.status)

  // Fetch Timetable
  const { data: timetableEntries = [], isLoading } = useQuery({
    queryKey: ['timetable', selectedClass, selectedSection, sessionYear],
    queryFn: () => {
      const params = { 
        class_id: selectedClass, 
        session_year: sessionYear 
      }
      if (selectedSection) {
        params.section_id = selectedSection
      }
      return api.get('/timetable/', { params }).then(r => r.data.results || r.data)
    },
    enabled: showTimetable && !!selectedClass,
  })

  const handleView = () => {
    if (!selectedClass) {
      alert('Please select a class')
      return
    }
    setShowTimetable(true)
  }

  const getTimetableCell = (day, periodId) => {
    return timetableEntries.find(entry => entry.day === day && entry.period === periodId)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6 rounded-lg shadow-lg print:hidden">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Calendar size={32} />
          Class Wise Timetable
        </h1>
        <p className="text-indigo-100 mt-1">View complete weekly timetable for any class</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 print:hidden">
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
                setShowTimetable(false)
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
              Select Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => {
                setSelectedSection(e.target.value)
                setShowTimetable(false)
              }}
              disabled={!selectedClass}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            >
              <option value="">-- All Sections --</option>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="2024-2025"
            />
          </div>

          <div className="flex items-end gap-3">
            <button
              onClick={handleView}
              disabled={!selectedClass}
              className="flex-1 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Calendar size={20} />
              View Timetable
            </button>
            {showTimetable && (
              <button
                onClick={handlePrint}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                <Printer size={20} />
                Print
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Timetable Display */}
      {showTimetable && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Print Header */}
          <div className="hidden print:block p-6 border-b">
            <h2 className="text-2xl font-bold text-center">Class Timetable</h2>
            <p className="text-center text-gray-600 mt-2">
              Class: {classes.find(c => c.id === parseInt(selectedClass))?.class_name}
              {selectedSection && ` - ${sections.find(s => s.id === parseInt(selectedSection))?.section_name}`} | 
              Session: {sessionYear}
            </p>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading timetable...</p>
            </div>
          ) : periods.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No periods found. Please create periods from Masters → Period Master.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-indigo-50">
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700 bg-indigo-100 min-w-[120px]">
                      Day / Period
                    </th>
                    {periods.map(period => (
                      <th key={period.id} className="border border-gray-300 px-3 py-3 text-center font-semibold text-gray-700 min-w-[180px]">
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
                      <td className="border border-gray-300 px-4 py-4 bg-indigo-50 font-semibold">
                        <div className="text-sm text-gray-800">{day.label}</div>
                      </td>
                      {periods.map(period => {
                        const entry = getTimetableCell(day.value, period.id)
                        
                        return (
                          <td key={`${day.value}-${period.id}`} className="border border-gray-300 p-3 align-top">
                            {entry ? (
                              <div className="space-y-1">
                                {entry.subject_name && (
                                  <div className="text-sm font-medium text-blue-900">
                                    📚 {entry.subject_name}
                                  </div>
                                )}
                                {entry.teacher_name && (
                                  <div className="text-xs text-gray-600">
                                    👨‍🏫 {entry.teacher_name}
                                  </div>
                                )}
                                {entry.room && (
                                  <div className="text-xs text-gray-500">
                                    🚪 Room: {entry.room}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center text-gray-400 text-sm py-2">-</div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
