import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calendar, TrendingUp, Printer } from 'lucide-react'
import api, { staffApi } from '../../services/api'

export default function MonthlySubstituteReport() {
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())

  // Fetch Monthly Substitutes
  const { data: substitutes = [], isLoading } = useQuery({
    queryKey: ['monthly-substitutes', selectedMonth, selectedYear],
    queryFn: () => api.get('/timetable/substitutes/', {
      params: { 
        month: selectedMonth,
        year: selectedYear 
      }
    }).then(r => r.data.results || r.data),
  })

  // Fetch Teachers for name lookup
  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => staffApi.list().then(r => r.data.results || r.data),
  })

  // Calculate statistics
  const teacherStats = {}
  substitutes.forEach(sub => {
    // Original teacher who was absent
    if (!teacherStats[sub.original_teacher]) {
      teacherStats[sub.original_teacher] = {
        name: sub.original_teacher_name,
        absences: 0,
        substitutions: 0
      }
    }
    teacherStats[sub.original_teacher].absences += 1

    // Substitute teacher who covered
    if (!teacherStats[sub.substitute_teacher]) {
      teacherStats[sub.substitute_teacher] = {
        name: sub.substitute_teacher_name,
        absences: 0,
        substitutions: 0
      }
    }
    teacherStats[sub.substitute_teacher].substitutions += 1
  })

  const statsArray = Object.entries(teacherStats).map(([id, stats]) => ({
    id,
    ...stats
  }))

  const handlePrint = () => {
    window.print()
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-lg shadow-lg print:hidden">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Calendar size={32} />
          Monthly Substitute Report
        </h1>
        <p className="text-purple-100 mt-1">View month-wise teacher substitute statistics</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 print:hidden">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              {monthNames.map((month, idx) => (
                <option key={idx} value={idx + 1}>{month}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              {[2024, 2025, 2026, 2027, 2028].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end ml-auto">
            <button
              onClick={handlePrint}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Printer size={20} />
              Print Report
            </button>
          </div>
        </div>
      </div>

      {/* Print Header - Only visible when printing */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-2xl font-bold">Monthly Substitute Report</h1>
        <p className="text-gray-600">{monthNames[selectedMonth - 1]} {selectedYear}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Substitutions</p>
              <p className="text-3xl font-bold text-purple-600">{substitutes.length}</p>
            </div>
            <TrendingUp size={40} className="text-purple-300" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Teachers Involved</p>
              <p className="text-3xl font-bold text-indigo-600">{statsArray.length}</p>
            </div>
            <Calendar size={40} className="text-indigo-300" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average per Teacher</p>
              <p className="text-3xl font-bold text-blue-600">
                {statsArray.length ? (substitutes.length / statsArray.length).toFixed(1) : 0}
              </p>
            </div>
            <TrendingUp size={40} className="text-blue-300" />
          </div>
        </div>
      </div>

      {/* Teacher Statistics Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-purple-50">
          <h2 className="text-lg font-semibold text-gray-800">
            Teacher-wise Statistics - {monthNames[selectedMonth - 1]} {selectedYear}
          </h2>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading report...</p>
          </div>
        ) : statsArray.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
            <p>No substitute records for {monthNames[selectedMonth - 1]} {selectedYear}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher Name</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Times Absent</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Times Substituted</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total Involvement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {statsArray
                  .sort((a, b) => (b.absences + b.substitutions) - (a.absences + a.substitutions))
                  .map((stat, idx) => (
                    <tr key={stat.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{stat.name}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          {stat.absences}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          {stat.substitutions}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                          {stat.absences + stat.substitutions}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Daily Details Table */}
      {substitutes.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-purple-50">
            <h2 className="text-lg font-semibold text-gray-800">Daily Substitute Records</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Original Teacher</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Substitute Teacher</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {substitutes
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((sub, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(sub.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          day: '2-digit', 
                          month: 'short' 
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{sub.original_teacher_name}</td>
                      <td className="px-6 py-4 text-sm text-purple-600 font-medium">{sub.substitute_teacher_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{sub.reason || '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
