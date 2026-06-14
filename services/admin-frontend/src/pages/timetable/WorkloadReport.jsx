import { useQuery } from '@tanstack/react-query'
import { BarChart3, Printer, Download } from 'lucide-react'
import api, { staffApi } from '../../services/api'

export default function WorkloadReport() {
  // Fetch Teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => staffApi.list().then(r => r.data.results || r.data),
  })

  // Fetch All Timetable Entries
  const { data: timetableEntries = [], isLoading } = useQuery({
    queryKey: ['all-timetable'],
    queryFn: () => api.get('/timetable/').then(r => r.data.results || r.data),
  })

  // Calculate workload for each teacher
  const teacherWorkload = teachers.map(teacher => {
    const assignments = timetableEntries.filter(entry => entry.teacher === teacher.id)
    const uniqueClasses = [...new Set(assignments.map(a => a.class_name))].filter(Boolean)
    const uniqueSubjects = [...new Set(assignments.map(a => a.subject_name))].filter(Boolean)
    
    return {
      ...teacher,
      totalClasses: assignments.length,
      uniqueClasses: uniqueClasses.length,
      uniqueSubjects: uniqueSubjects.length,
      classes: uniqueClasses,
      subjects: uniqueSubjects
    }
  }).filter(t => t.totalClasses > 0).sort((a, b) => b.totalClasses - a.totalClasses)

  const totalAssignments = timetableEntries.length
  const avgWorkload = teacherWorkload.length > 0 
    ? (totalAssignments / teacherWorkload.length).toFixed(1) 
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-6 rounded-lg shadow-lg print:hidden">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <BarChart3 size={32} />
          Timetable Workload Report
        </h1>
        <p className="text-orange-100 mt-1">Teacher workload analysis and distribution</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-orange-600">{teacherWorkload.length}</div>
          <div className="text-sm text-gray-600 mt-1">Active Teachers</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-blue-600">{totalAssignments}</div>
          <div className="text-sm text-gray-600 mt-1">Total Classes</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-green-600">{avgWorkload}</div>
          <div className="text-sm text-gray-600 mt-1">Avg per Teacher</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow flex items-center justify-center gap-2 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <Printer size={18} />
            Print
          </button>
        </div>
      </div>

      {/* Workload Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Teacher-wise Workload</h2>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading workload data...</p>
          </div>
        ) : teacherWorkload.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No timetable assignments found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total Classes</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Unique Classes</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Subjects</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Workload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {teacherWorkload.map((teacher, idx) => {
                  const workloadPercent = (teacher.totalClasses / totalAssignments) * 100
                  let workloadColor = 'bg-green-500'
                  if (workloadPercent > 20) workloadColor = 'bg-orange-500'
                  if (workloadPercent > 30) workloadColor = 'bg-red-500'
                  
                  return (
                    <tr key={teacher.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{teacher.full_name}</div>
                        <div className="text-xs text-gray-500">{teacher.designation || 'Teacher'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{teacher.employee_id}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-2xl font-bold text-orange-600">{teacher.totalClasses}</span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm">{teacher.uniqueClasses}</td>
                      <td className="px-6 py-4 text-center text-sm">{teacher.uniqueSubjects}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${workloadColor}`}
                              style={{ width: `${Math.min(workloadPercent * 2, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-gray-600">
                            {workloadPercent.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Distribution Chart */}
      {teacherWorkload.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Workload Distribution</h3>
          <div className="space-y-3">
            {teacherWorkload.slice(0, 10).map((teacher) => (
              <div key={teacher.id} className="flex items-center gap-3">
                <div className="w-32 text-sm text-gray-700 truncate">{teacher.full_name}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-8 relative">
                  <div
                    className="bg-gradient-to-r from-orange-400 to-orange-600 h-8 rounded-full flex items-center justify-end pr-3 text-white text-sm font-medium"
                    style={{ width: `${(teacher.totalClasses / teacherWorkload[0].totalClasses) * 100}%` }}
                  >
                    {teacher.totalClasses}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
