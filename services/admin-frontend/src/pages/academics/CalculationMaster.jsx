import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Save, Loader2, Calculator, AlertTriangle, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { academicsApi } from '../../services/api'

export default function CalculationMaster() {
  const [weights, setWeights] = useState({}) // exam_id -> weightage

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['calculation-master'],
    queryFn: () => academicsApi.calculation().then(r => r.data),
  })

  const examTypes = data?.exam_types || []

  useEffect(() => {
    if (examTypes.length) {
      const map = {}
      examTypes.forEach(e => { map[e.id] = e.weightage })
      setWeights(map)
    }
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  const total = Object.values(weights).reduce((sum, w) => sum + (Number(w) || 0), 0)
  const balanced = Math.abs(total - 100) < 0.01

  const saveMut = useMutation({
    mutationFn: () => academicsApi.updateCalculation({
      weightages: examTypes.map(e => ({ id: e.id, weightage: Number(weights[e.id]) || 0 })),
    }),
    onSuccess: () => { toast.success('Weightages saved'); refetch() },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to save'),
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Calculation Master</h1>
        <p className="page-sub">Set how much each exam contributes to the final result. Total should equal 100%.</p>
      </div>

      {isLoading ? (
        <div className="card p-12 text-center text-sm text-gray-400">Loading…</div>
      ) : examTypes.length === 0 ? (
        <div className="card p-12 text-center">
          <Calculator size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No exam types found. Create exam types first under CCE → Exam Types.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Exam Type</th>
                  <th>Code</th>
                  <th>Session</th>
                  <th className="w-48">Weightage (%)</th>
                </tr>
              </thead>
              <tbody>
                {examTypes.map(e => (
                  <tr key={e.id}>
                    <td className="font-medium text-gray-800">{e.name}</td>
                    <td className="text-gray-500 font-mono">{e.code}</td>
                    <td className="text-gray-500">{e.session_year}</td>
                    <td>
                      <input
                        type="number" step="0.01" min="0" max="100"
                        className="form-input py-1 w-28"
                        value={weights[e.id] ?? ''}
                        onChange={ev => setWeights(p => ({ ...p, [e.id]: ev.target.value }))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <div className={`flex items-center gap-2 text-sm font-semibold ${balanced ? 'text-green-600' : 'text-amber-600'}`}>
              {balanced ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              Total: {total.toFixed(2)}% {balanced ? '(balanced)' : '(should be 100%)'}
            </div>
            <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="btn-primary flex items-center gap-2">
              {saveMut.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> Save Weightages</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
