import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Bus } from 'lucide-react'
import { feeApi, transportApi } from '../../services/api'

const MONTHS = [
  { v: 'apr', l: 'Apr' }, { v: 'may', l: 'May' }, { v: 'jun', l: 'Jun' }, { v: 'jul', l: 'Jul' },
  { v: 'aug', l: 'Aug' }, { v: 'sep', l: 'Sep' }, { v: 'oct', l: 'Oct' }, { v: 'nov', l: 'Nov' },
  { v: 'dec', l: 'Dec' }, { v: 'jan', l: 'Jan' }, { v: 'feb', l: 'Feb' }, { v: 'mar', l: 'Mar' },
]

const listOf = (r) => r.data.results || r.data

export default function ApplyTransportPage() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const backTo = () => navigate(`/feemgmt/student-profile/${studentId}`)

  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [useTransport, setUseTransport] = useState(false)
  const [stopId, setStopId] = useState('')
  const [effectiveMonth, setEffectiveMonth] = useState('')

  useEffect(() => {
    setLoading(true)
    feeApi.getStudentProfile(studentId)
      .then(res => {
        setStudent(res.data)
        setUseTransport(!!res.data.transport)
        setStopId(res.data.transport?.stop_id ? String(res.data.transport.stop_id) : '')
      })
      .catch(err => setError(err.response?.data?.detail || 'Error loading student profile'))
      .finally(() => setLoading(false))
  }, [studentId])

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
      backTo()
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to update transport'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!useTransport) {
      applyMutation.mutate({ student_id: studentId, apply: false })
      return
    }
    if (!stopId || !effectiveMonth) {
      toast.error('Select a stop and the month from which transport applies')
      return
    }
    applyMutation.mutate({ student_id: studentId, apply: true, stop_id: stopId, effective_month: effectiveMonth })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="space-y-4 max-w-xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error || 'Student not found'}</div>
        <button onClick={backTo} className="btn-secondary"><ArrowLeft size={16} /> Back</button>
      </div>
    )
  }

  const hasTransport = !!student.transport
  const startIdx = MONTHS.findIndex(m => m.v === effectiveMonth)

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <button onClick={backTo} className="btn-secondary"><ArrowLeft size={16} /> Back to Profile</button>

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600"><Bus size={20} /></div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Apply Transport</h1>
            <p className="text-sm text-gray-500">{student.student_name} - {student.admission_no}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button type="button" onClick={backTo} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={applyMutation.isPending} className="btn-primary">
              {applyMutation.isPending ? 'Saving...' : <><Save size={16} /> Save</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
