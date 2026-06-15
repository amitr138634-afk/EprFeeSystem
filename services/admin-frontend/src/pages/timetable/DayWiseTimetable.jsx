import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Printer } from 'lucide-react'
import api, { studentApi } from '../../services/api'

const DAYS = [
  { value: 'MON', label: 'Monday' },
  { value: 'TUE', label: 'Tuesday' },
  { value: 'WED', label: 'Wednesday' },
  { value: 'THU', label: 'Thursday' },
  { value: 'FRI', label: 'Friday' }
]

export default function DayWiseTimetable() {
  const currentYear = new Date().getFullYear()
  const [sessionYear, setSessionYear] = useState(`${currentYear}-${currentYear + 1}`)
  const [selectedDay, setSelectedDay] = useState('MON')
  const [showTimetable, setShowTimetable] = useState(false)

  // Fetch Classes
  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => studentApi.classMasters().then(r => r.data.results || r.data),
  })

  // Fetch Periods
  const { data: allPeriods = [] } = useQuery({
    queryKey: ['periods'],
    queryFn: () => api.get('/timetable/periods/').then(r => r.data.results || r.data),
  })

  const periods = allPeriods.filter(p => !p.is_break && p.status)

  // Fetch Day's Timetable
  const { data: timetableEntries = [], isLoading } = useQuery({
    queryKey: ['day-timetable', selectedDay, sessionYear],
    queryFn: () => api.get('/timetable/', {
      params: { day: selectedDay, session_year: sessionYear }
    }).then(r => r.data.results || r.data),
    enabled: showTimetable,
  })

  const handleView = () => {
    setShowTimetable(true)
  }

  const getTimetableCellForClass = (classId, periodId) => {
    return timetableEntries.find(entry => 
      entry.class_ref === classId && entry.period === periodId
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-lg shadow-lg print:hidden">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Calendar size={32} />
          Day Wise Timetable
        </h1>
        <p className="text-purple-100 mt-1">View complete timetable for a specific day</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 print:hidden">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Day <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedDay}
              onChange={(e) => {
                setSelectedDay(e.target.value)
                setShowTimetable(false)
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              {DAYS.map(day => (
                <option key={day.value} value={day.value}>{day.label}</option>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="2024-2025"
            />
          </div>

          <div className="flex items-end gap-3">
            <button
              onClick={handleView}
              className="flex-1 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
            >
              <Calendar size={20} />
              View Day Schedule
            </button>
            {showTimetable && (
              <button
                onClick={() => window.print()}
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
            <h2 className="text-2xl font-bold text-center">Day Wise Timetable</h2>
            <p className="text-center text-gray-600 mt-2">
              Day: {DAYS.find(d => d.value === selectedDay)?.label} | Session: {sessionYear}
            </p>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading schedule...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-purple-50">
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700 bg-purple-100 min-w-[120px]">
                      Class / Period
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
                  {classes.map((classItem, idx) => (
                    <tr key={classItem.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 px-4 py-4 bg-purple-50 font-semibold">
                        <div className="text-sm text-gray-800">{classItem.class_name}</div>
                      </td>
                      {periods.map(period => {
                        const entry = getTimetableCellForClass(classItem.id, period.id)
                        
                        return (
                          <td key={`${classItem.id}-${period.id}`} className="border border-gray-300 p-3 align-top">
                            {entry ? (
                              <div className="space-y-1">
                                {entry.subject_name && (
                                  <div className="text-sm font-medium text-purple-900">
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
                                    🚪 {entry.room}
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
