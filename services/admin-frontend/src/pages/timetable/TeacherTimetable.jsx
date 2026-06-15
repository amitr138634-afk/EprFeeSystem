import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, Printer } from 'lucide-react'
import api, { staffApi } from '../../services/api'

const DAYS = [
  { value: 'MON', label: 'Monday' },
  { value: 'TUE', label: 'Tuesday' },
  { value: 'WED', label: 'Wednesday' },
  { value: 'THU', label: 'Thursday' },
  { value: 'FRI', label: 'Friday' }
]

export default function TeacherTimetable() {
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [showTimetable, setShowTimetable] = useState(false)

  // Fetch Teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => staffApi.list().then(r => r.data.results || r.data),
  })

  // Fetch Periods
  const { data: allPeriods = [] } = useQuery({
    queryKey: ['periods'],
    queryFn: () => api.get('/timetable/periods/').then(r => r.data.results || r.data),
  })

  const periods = allPeriods.filter(p => !p.is_break && p.status)

  // Fetch Teacher's Timetable
  const { data: timetableEntries = [], isLoading } = useQuery({
    queryKey: ['teacher-timetable', selectedTeacher],
    queryFn: () => api.get('/timetable/', {
      params: { teacher_id: selectedTeacher }
    }).then(r => r.data.results || r.data),
    enabled: showTimetable && !!selectedTeacher,
  })

  const handleView = () => {
    if (!selectedTeacher) {
      alert('Please select a teacher')
      return
    }
    setShowTimetable(true)
  }

  const getTimetableCell = (day, periodId) => {
    return timetableEntries.find(entry => entry.day === day && entry.period === periodId)
  }

  const selectedTeacherData = teachers.find(t => t.id === parseInt(selectedTeacher))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-lg shadow-lg print:hidden">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Users size={32} />
          Teacher Timetable
        </h1>
        <p className="text-green-100 mt-1">View weekly schedule for any teacher</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 print:hidden">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Teacher <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedTeacher}
              onChange={(e) => {
                setSelectedTeacher(e.target.value)
                setShowTimetable(false)
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">-- Select Teacher --</option>
              {teachers.filter(t => t.status === 'active').map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.full_name} - {teacher.employee_id}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-3">
            <button
              onClick={handleView}
              disabled={!selectedTeacher}
              className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Users size={20} />
              View Schedule
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
            <h2 className="text-2xl font-bold text-center">Teacher Timetable</h2>
            <p className="text-center text-gray-600 mt-2">
              Teacher: {selectedTeacherData?.full_name} ({selectedTeacherData?.employee_id})
            </p>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading schedule...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-green-50">
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700 bg-green-100 min-w-[120px]">
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
                      <td className="border border-gray-300 px-4 py-4 bg-green-50 font-semibold">
                        <div className="text-sm text-gray-800">{day.label}</div>
                      </td>
                      {periods.map(period => {
                        const entry = getTimetableCell(day.value, period.id)
                        
                        return (
                          <td key={`${day.value}-${period.id}`} className="border border-gray-300 p-3 align-top">
                            {entry ? (
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-green-900">
                                  {entry.class_name}
                                </div>
                                {entry.subject_name && (
                                  <div className="text-xs text-gray-600">
                                    📚 {entry.subject_name}
                                  </div>
                                )}
                                {entry.room && (
                                  <div className="text-xs text-gray-500">
                                    🚪 {entry.room}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center text-gray-400 text-sm py-2">Free</div>
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

          {/* Summary */}
          {showTimetable && timetableEntries.length > 0 && (
            <div className="p-6 border-t bg-gray-50">
              <h3 className="font-semibold text-gray-800 mb-3">Weekly Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-2xl font-bold text-green-600">{timetableEntries.length}</div>
                  <div className="text-sm text-gray-600">Total Classes</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-2xl font-bold text-blue-600">
                    {[...new Set(timetableEntries.map(e => e.subject_name))].length}
                  </div>
                  <div className="text-sm text-gray-600">Subjects</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-2xl font-bold text-purple-600">
                    {[...new Set(timetableEntries.map(e => e.class_name))].length}
                  </div>
                  <div className="text-sm text-gray-600">Classes</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
