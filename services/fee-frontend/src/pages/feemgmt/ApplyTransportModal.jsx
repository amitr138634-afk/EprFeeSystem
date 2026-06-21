import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { X, Save, Bus } from 'lucide-react'
import { transportApi } from '../../services/api'

const MONTHS = [
  { v: 'apr', l: 'Apr' }, { v: 'may', l: 'May' }, { v: 'jun', l: 'Jun' }, { v: 'jul', l: 'Jul' },
  { v: 'aug', l: 'Aug' }, { v: 'sep', l: 'Sep' }, { v: 'oct', l: 'Oct' }, { v: 'nov', l: 'Nov' },
  { v: 'dec', l: 'Dec' }, { v: 'jan', l: 'Jan' }, { v: 'feb', l: 'Feb' }, { v: 'mar', l: 'Mar' },
]

const listOf = (r) => r.data.results || r.data

export default function ApplyTransportModal({ student, onClose, onSuccess }) {
  const hasTransport = !!student.transport
  const [useTransport, setUseTransport] = useState(hasTransport)
  const [stopId, setStopId] = useState(student.transport?.stop_id ? String(student.transport.stop_id) : '')
  const [effectiveMonth, setEffectiveMonth] = useState('')

  const { data: routes = [] } = useQuery({
    queryKey: ['routes-for-transport'],
    queryFn: () => transportApi.routes().then(listOf),
  })

  const stopOptions = useMemo(() => {
    const opts = []
    for (const route of routes) {
      for (const stop of route.stops || []) {
        opts.push({ ...stop, route_name: route.name, bus_no: route.vehicle_no })
      }
    }
    return opts
  }, [routes])

  const selectedStop = stopOptions.find(s => String(s.id) === stopId)

  const applyMutation = useMutation({
    mutationFn: (payload) => transportApi.applyStudentTransport(payload),
    onSuccess: (res) => {
      toast.success(res.data?.detail || 'Transport updated!')
      onSuccess()
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to update transport'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!useTransport) {
      applyMutation.mutate({ student_id: student.id, apply: false })
      return
    }
    if (!stopId || !effectiveMonth) {
      toast.error('Select a stop and the month from which transport applies')
      return
    }
    applyMutation.mutate({ student_id: student.id, apply: true, stop_id: stopId, effective_month: effectiveMonth })
  }

  const startIdx = MONTHS.findIndex(m => m.v === effectiveMonth)

  return (
    <div className="modal-overlay">
      <div className="modal-box max-w-2xl">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Apply Transport</h2>
            <p className="text-xs text-gray-500 mt-0.5">{student.student_name} - {student.admission_no}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div>
              <label className="form-label">Use Transport?</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setUseTransport(true)} className={useTransport ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}>Yes</button>
                <button type="button" onClick={() => setUseTransport(false)} className={!useTransport ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}>No</button>
              </div>
            </div>

            {hasTransport && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 flex items-center gap-2">
                <Bus size={15} /> Currently on Route <strong>{student.transport.route_name}</strong>, Stop <strong>{student.transport.stop_name}</strong> (₹{student.transport.monthly_fee.toLocaleString('en-IN')}/month)
              </div>
            )}

            {useTransport && (
              <>
                <div>
                  <label className="form-label">Stop</label>
                  <select className="form-select" value={stopId} onChange={e => setStopId(e.target.value)} required>
                    <option value="">Select Stop</option>
                    {stopOptions.map(s => <option key={s.id} value={s.id}>{s.name} ({s.route_name})</option>)}
                  </select>
                </div>

                {selectedStop && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Bus Route (auto-filled)</label>
                      <input className="form-input bg-gray-50" value={selectedStop.route_name} disabled />
                    </div>
                    <div>
                      <label className="form-label">Bus No. (auto-filled)</label>
                      <input className="form-input bg-gray-50" value={selectedStop.bus_no || '—'} disabled />
                    </div>
                  </div>
                )}

                <div>
                  <label className="form-label">Applies From Month</label>
                  <select className="form-select" value={effectiveMonth} onChange={e => setEffectiveMonth(e.target.value)} required>
                    <option value="">Select Month</option>
                    {MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                  </select>
                </div>

                {selectedStop && (
                  <div>
                    <label className="form-label">Month-wise Transport Fee (non-editable)</label>
                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-1">
                      {MONTHS.map((m, i) => {
                        const applicable = startIdx >= 0 && i >= startIdx
                        return (
                          <div
                            key={m.v}
                            className={`rounded border text-center py-2 text-xs ${applicable ? 'bg-green-50 border-green-200 text-green-700 font-semibold' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
                          >
                            <div>{m.l}</div>
                            <div>₹{Number(selectedStop.monthly_fee).toLocaleString('en-IN')}</div>
                          </div>
                        )
                      })}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Highlighted months will be added to the Transport fee head.</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={applyMutation.isPending} className="btn-primary">
              {applyMutation.isPending ? 'Saving...' : <><Save size={16} /> Save</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
