import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { User } from 'lucide-react'
import { timetableApi, staffApi } from '../../services/api'

const DAYS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
]

export default function TeacherTimetable() {
  const [teacherId, setTeacherId] = useState('')

  const { data: staffData } = useQuery({
    queryKey: ['staff-all'],
    queryFn: () => staffApi.list({ page_size: 500 }).then(r => r.data),
  })
  const teachers = (staffData?.results || staffData || [])
    .filter(s => s.staff_type === 'teaching' || !s.staff_type)

  const selectedTeacher = teachers.find(t => String(t.id) === String(teacherId))

  const { data: timetable = [], isLoading } = useQuery({
    queryKey: ['teacher-timetable', teacherId],
    queryFn: () => timetableApi.teacherTimetable(teacherId).then(r => r.data),
    enabled: !!teacherId,
  })

  // Build unique period list from results, preserving order
  const periodOrder = []
  const periodSeen = new Set()
  timetable.forEach(entry => {
    const key = entry.period_name || entry.period_id
    if (!periodSeen.has(key)) {
      periodSeen.add(key)
      periodOrder.push({ name: entry.period_name, id: entry.period_id, order: entry.period_order ?? 999 })
    }
  })
  periodOrder.sort((a, b) => a.order - b.order)

  // Build cell map: period_name -> day -> entry
  const cellMap = {}
  timetable.forEach(entry => {
    const pk = entry.period_name || entry.period_id
    if (!cellMap[pk]) cellMap[pk] = {}
    cellMap[pk][entry.day] = entry
  })

  // Count per day
  const dayCount = {}
  DAYS.forEach(d => {
    dayCount[d.value] = timetable.filter(e => e.day === d.value).length
  })
  const totalPeriods = timetable.length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-800">Teacher Timetable</h1>
        <p className="text-sm text-gray-500">View weekly schedule for any teacher</p>
      </div>

      {/* Filter */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="form-label">Select Teacher</label>
            <select
              className="form-select w-64"
              value={teacherId}
              onChange={e => setTeacherId(e.target.value)}
            >
              <option value="">Choose a teacher...</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.full_name || `${t.first_name} ${t.last_name}`}
                  {t.designation_name ? ` — ${t.designation_name}` : ''}
                </option>
              ))}
            </select>
          </div>
          {selectedTeacher && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <User size={14} />
              </div>
              <div>
                <div className="text-sm font-semibold text-blue-800">
                  {selectedTeacher.full_name || `${selectedTeacher.first_name} ${selectedTeacher.last_name}`}
                </div>
                <div className="text-xs text-blue-500">{selectedTeacher.designation_name || 'Teacher'}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary row */}
      {teacherId && !isLoading && timetable.length > 0 && (
        <div className="grid grid-cols-7 gap-3">
          {DAYS.map(d => (
            <div key={d.value} className="card p-3 text-center">
              <div className="text-xs text-gray-500 font-medium">{d.label}</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{dayCount[d.value] || 0}</div>
              <div className="text-xs text-gray-400">periods</div>
            </div>
          ))}
          <div className="card p-3 text-center bg-blue-50 border border-blue-100">
            <div className="text-xs text-blue-500 font-medium">Total</div>
            <div className="text-2xl font-bold text-blue-700 mt-1">{totalPeriods}</div>
            <div className="text-xs text-blue-400">per week</div>
          </div>
        </div>
      )}

      {/* Timetable Grid */}
      {teacherId ? (
        <div className="card">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">Loading timetable...</div>
          ) : timetable.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              No timetable assigned for this teacher yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-3 py-2 text-left text-gray-600 font-semibold w-32">Period</th>
                    {DAYS.map(d => (
                      <th key={d.value} className="border border-gray-200 px-3 py-2 text-center text-gray-600 font-semibold min-w-[120px]">
                        {d.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periodOrder.map(period => (
                    <tr key={period.name} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-3 py-2 font-semibold text-gray-700 bg-gray-50 text-xs">
                        {period.name}
                      </td>
                      {DAYS.map(day => {
                        const entry = cellMap[period.name]?.[day.value]
                        return (
                          <td key={day.value} className="border border-gray-200 px-2 py-2 text-center">
                            {entry ? (
                              <div className="bg-green-50 rounded p-1.5 text-left">
                                <div className="font-medium text-green-800 text-xs leading-tight">
                                  {entry.subject_name}
                                </div>
                                <div className="text-gray-500 text-xs mt-0.5">
                                  {entry.class_name}{entry.section_name ? ` - ${entry.section_name}` : ''}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-300 text-xs">—</span>
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
      ) : (
        <div className="card p-10 text-center text-gray-400">
          Select a teacher to view their weekly timetable
        </div>
      )}
    </div>
  )
}
