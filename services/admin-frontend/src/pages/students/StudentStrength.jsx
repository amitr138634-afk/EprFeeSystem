import { useQuery } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import { studentApi } from '../../services/api'

export default function StudentStrength() {
  const { data: strength = [], isLoading } = useQuery({
    queryKey: ['student-strength'],
    queryFn: () => studentApi.strength().then(r => r.data),
  })

  const total = strength.reduce((a, r) => a + r.total, 0)
  const boys = strength.reduce((a, r) => a + r.boys, 0)
  const girls = strength.reduce((a, r) => a + r.girls, 0)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Student Strength</h1>
        <p className="text-sm text-gray-500">Class-wise student count</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Students', value: total, color: 'blue' },
          { label: 'Boys', value: boys, color: 'blue' },
          { label: 'Girls', value: girls, color: 'pink' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-2xl font-bold text-gray-800">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Class Wise Strength</h2>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="table-header px-4 py-3 text-left">Class</th>
                  <th className="table-header px-4 py-3 text-left">Section</th>
                  <th className="table-header px-4 py-3 text-center">Boys</th>
                  <th className="table-header px-4 py-3 text-center">Girls</th>
                  <th className="table-header px-4 py-3 text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {strength.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-400">No data available</td>
                  </tr>
                ) : (
                  strength.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{row.class_name}</td>
                      <td className="px-4 py-3">{row.section_name}</td>
                      <td className="px-4 py-3 text-center">{row.boys}</td>
                      <td className="px-4 py-3 text-center">{row.girls}</td>
                      <td className="px-4 py-3 text-center font-semibold">{row.total}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
