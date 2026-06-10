import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays } from 'lucide-react'
import { timetableApi } from '../../services/api'

const DAYS = [
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
]

// Today's day (1=Mon...6=Sat), default to Monday if weekend
function getTodayDay() {
  const d = new Date().getDay() // 0=Sun, 1=Mon...6=Sat
  if (d === 0) return 1 // Sunday -> Monday
  if (d > 6) return 6
  return d
}

export default function DayWiseTimetable() {
  const [day, setDay] = useState(getTodayDay())

  const { data: allEntries = [], isLoading } = useQuery({
    queryKey: ['timetable-day', day],
    queryFn: () => timetableApi.list({ day }).then(r => r.data),
    enabled: !!day,
  })

  // Group by class + section
  const groups = {}
  allEntries.forEach(entry => {
    const className = entry.class_name || entry.class?.name || `Class ${entry.class_id}`
    const sectionName = entry.section_name || entry.section?.name || ''
    const key = `${className}${sectionName ? ' - ' + sectionName : ''}`
    if (!groups[key]) groups[key] = { label: key, entries: [] }
    groups[key].entries.push(entry)
  })

  // Sort entries within each group by period order
  Object.values(groups).forEach(g => {
    g.entries.sort((a, b) => (a.period_order ?? a.period_id ?? 999) - (b.period_order ?? b.period_id ?? 999))
  })

  const groupKeys = Object.keys(groups).sort()

  // Flat rows for the main table (alternating class groups)
  const rows = []
  groupKeys.forEach(key => {
    const group = groups[key]
    group.entries.forEach((entry, idx) => {
      rows.push({ ...entry, _groupLabel: key, _isFirstInGroup: idx === 0, _groupSize: group.entries.length })
    })
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-800">Day Wise Timetable</h1>
        <p className="text-sm text-gray-500">View all classes scheduled for a specific day</p>
      </div>

      {/* Day selector */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-600 mr-2 flex items-center gap-1">
            <CalendarDays size={15} /> Day:
          </span>
          {DAYS.map(d => (
            <button
              key={d.value}
              onClick={() => setDay(d.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                day === d.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      {!isLoading && allEntries.length > 0 && (
        <div className="flex gap-4 text-sm text-gray-500 px-1">
          <span>
            <span className="font-semibold text-gray-700">{allEntries.length}</span> total entries
          </span>
          <span>
            <span className="font-semibold text-gray-700">{groupKeys.length}</span> class-sections
          </span>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Class / Section</th>
                <th>Period</th>
                <th>Subject</th>
                <th>Teacher</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-400">
                    No timetable entries for {DAYS.find(d => d.value === day)?.label}
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={`${row.id}-${i}`} className={row._isFirstInGroup && i !== 0 ? 'border-t-2 border-gray-200' : ''}>
                    {row._isFirstInGroup ? (
                      <td rowSpan={row._groupSize} className="font-semibold text-gray-800 bg-gray-50 align-top pt-3">
                        {row._groupLabel}
                      </td>
                    ) : null}
                    <td className="text-gray-600">
                      {row.period_name || row.period?.name || `Period ${row.period_id}`}
                      {(row.period_start_time || row.period?.start_time) && (
                        <span className="text-xs text-gray-400 ml-1">
                          ({(row.period_start_time || row.period?.start_time)?.slice(0,5)})
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="font-medium text-blue-700">
                        {row.subject_name || row.subject?.name || '—'}
                      </span>
                      {(row.subject_code || row.subject?.code) && (
                        <span className="text-xs text-gray-400 ml-1.5">
                          ({row.subject_code || row.subject?.code})
                        </span>
                      )}
                    </td>
                    <td className="text-gray-600">
                      {row.teacher_name || row.teacher?.full_name || (
                        <span className="text-gray-300 italic text-xs">Unassigned</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
