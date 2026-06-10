import { useQuery } from '@tanstack/react-query'
import { BarChart2 } from 'lucide-react'
import { timetableApi, staffApi } from '../../services/api'

const DAYS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
]

function getWorkloadColor(total) {
  if (total === 0) return 'text-gray-400'
  if (total <= 10) return 'text-green-600'
  if (total <= 20) return 'text-blue-600'
  if (total <= 30) return 'text-orange-500'
  return 'text-red-600'
}

export default function WorkloadReport() {
  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ['staff-all'],
    queryFn: () => staffApi.list({ page_size: 500 }).then(r => r.data),
  })
  const teachers = (staffData?.results || staffData || [])
    .filter(s => s.staff_type === 'teaching' || !s.staff_type)

  const { data: allEntries = [], isLoading: ttLoading } = useQuery({
    queryKey: ['timetable-all'],
    queryFn: () => timetableApi.list({}).then(r => r.data),
  })

  const isLoading = staffLoading || ttLoading

  // Build workload map: teacher_id -> { day: count }
  const workloadMap = {}
  allEntries.forEach(entry => {
    const tid = entry.teacher_id || entry.teacher?.id
    if (!tid) return
    if (!workloadMap[tid]) workloadMap[tid] = {}
    workloadMap[tid][entry.day] = (workloadMap[tid][entry.day] || 0) + 1
  })

  // Totals per teacher
  const totalMap = {}
  Object.entries(workloadMap).forEach(([tid, dayMap]) => {
    totalMap[tid] = Object.values(dayMap).reduce((a, b) => a + b, 0)
  })

  // Overall stats
  const teachersWithLoad = teachers.filter(t => (totalMap[t.id] || 0) > 0)
  const avgLoad = teachersWithLoad.length
    ? Math.round(teachersWithLoad.reduce((a, t) => a + (totalMap[t.id] || 0), 0) / teachersWithLoad.length)
    : 0
  const maxTeacher = teachersWithLoad.reduce((max, t) =>
    (totalMap[t.id] || 0) > (totalMap[max?.id] || 0) ? t : max, null)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-800">Teacher Workload Report</h1>
        <p className="text-sm text-gray-500">Weekly period distribution across all teachers</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card p-4">
          <div className="text-xs text-gray-500">Total Teachers</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{teachers.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500">Teachers Assigned</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{teachersWithLoad.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500">Avg Periods/Week</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{avgLoad}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500">Highest Workload</div>
          <div className="text-sm font-bold text-orange-600 mt-1 truncate">
            {maxTeacher
              ? `${maxTeacher.full_name || `${maxTeacher.first_name} ${maxTeacher.last_name}`} (${totalMap[maxTeacher.id]})`
              : '—'}
          </div>
        </div>
      </div>

      {/* Workload Table */}
      <div className="card">
        <div className="flex items-center gap-2 px-4 pt-4 pb-2 border-b border-gray-100">
          <BarChart2 size={16} className="text-blue-500" />
          <span className="text-sm font-semibold text-gray-700">Periods Per Day</span>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Teacher Name</th>
                <th>Designation</th>
                {DAYS.map(d => <th key={d.value} className="text-center">{d.label}</th>)}
                <th className="text-center">Total/Week</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={10} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : teachers.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-8 text-gray-400">No teaching staff found</td></tr>
              ) : (
                teachers
                  .sort((a, b) => (totalMap[b.id] || 0) - (totalMap[a.id] || 0))
                  .map((t, i) => {
                    const dayMap = workloadMap[t.id] || {}
                    const total = totalMap[t.id] || 0
                    return (
                      <tr key={t.id}>
                        <td className="text-gray-500">{i + 1}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-semibold flex-shrink-0">
                              {(t.first_name || t.full_name || '?').charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-800">
                              {t.full_name || `${t.first_name} ${t.last_name}`}
                            </span>
                          </div>
                        </td>
                        <td className="text-gray-500 text-xs">{t.designation_name || '—'}</td>
                        {DAYS.map(d => (
                          <td key={d.value} className="text-center">
                            {dayMap[d.value] ? (
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                                dayMap[d.value] >= 6 ? 'bg-orange-100 text-orange-700' :
                                dayMap[d.value] >= 4 ? 'bg-blue-100 text-blue-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {dayMap[d.value]}
                              </span>
                            ) : (
                              <span className="text-gray-200 text-xs">—</span>
                            )}
                          </td>
                        ))}
                        <td className="text-center">
                          <span className={`text-base font-bold ${getWorkloadColor(total)}`}>
                            {total}
                          </span>
                        </td>
                      </tr>
                    )
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
