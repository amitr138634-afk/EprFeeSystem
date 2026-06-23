import { useQuery } from '@tanstack/react-query'
import { feeApi } from '../../services/api'
import useAuthStore from '../../store/authStore'

export default function ClasswiseStrength() {
  const activeSession = useAuthStore(s => s.currentSession?.session_year) || ''

  const { data, isLoading } = useQuery({
    queryKey: ['classwise-strength', activeSession],
    queryFn: () => feeApi.classwiseStrength({ session: activeSession }).then(r => r.data),
  })

  const rows = data?.rows || []
  const classTotals = data?.class_totals || []
  const totalStrength = data?.total_strength || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Class-wise Strength</h1>
        <p className="text-sm text-gray-500 mt-1">Active student count per class and section, session {activeSession}</p>
      </div>

      <div className="stat-card max-w-xs">
        <p className="stat-label">Total Strength</p>
        <p className="stat-value">{totalStrength}</p>
      </div>

      {isLoading ? (
        <div className="card p-8 text-center text-gray-500">Loading...</div>
      ) : rows.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">No active students found for this session.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Class</th><th>Section</th><th className="text-right">Strength</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td className="font-medium text-gray-900">{r.class_name}</td>
                    <td>{r.section}</td>
                    <td className="text-right font-semibold">{r.strength}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card p-5">
            <h2 className="section-title">Class Totals</h2>
            <div className="space-y-2">
              {classTotals.map((c, i) => (
                <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
                  <span className="text-gray-600">{c.class_name}</span>
                  <span className="font-semibold text-gray-900">{c.strength}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
