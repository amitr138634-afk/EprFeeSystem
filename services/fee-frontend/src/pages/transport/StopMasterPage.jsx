import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import { transportApi } from '../../services/api'

const listOf = (r) => r.data.results || r.data
const emptyForm = { name: '', route: '', order: 0, monthly_fee: '', pickup_time: '', drop_time: '' }

export default function StopMasterPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [routeFilter, setRouteFilter] = useState('')

  const { data: routes = [] } = useQuery({
    queryKey: ['routes-for-stop'],
    queryFn: () => transportApi.routes().then(listOf),
  })

  const { data: stops = [], isLoading } = useQuery({
    queryKey: ['stops-master', routeFilter],
    queryFn: () => transportApi.stops(routeFilter ? { route_id: routeFilter } : {}).then(listOf),
  })

  const resetForm = () => { setForm(emptyForm); setShowForm(false); setEditingId(null) }

  const saveMutation = useMutation({
    mutationFn: (data) => editingId ? transportApi.updateStop(editingId, data) : transportApi.createStop(data),
    onSuccess: () => {
      qc.invalidateQueries(['stops-master'])
      qc.invalidateQueries(['routes-for-stop'])
      toast.success(editingId ? 'Stop updated!' : 'Stop created!')
      resetForm()
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to save stop'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => transportApi.deleteStop(id),
    onSuccess: () => { qc.invalidateQueries(['stops-master']); toast.success('Stop deleted!') },
    onError: () => toast.error('Failed to delete stop'),
  })

  const handleEdit = (s) => {
    setForm({
      name: s.name, route: s.route, order: s.order, monthly_fee: s.monthly_fee,
      pickup_time: s.pickup_time || '', drop_time: s.drop_time || '',
    })
    setEditingId(s.id)
    setShowForm(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.route) { toast.error('Select a route'); return }
    saveMutation.mutate({
      ...form,
      pickup_time: form.pickup_time || null,
      drop_time: form.drop_time || null,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Stop Master</h1>
          <p className="text-sm text-gray-500 mt-1">Define stops per route, with bus assignment (via route) and fee per stop</p>
        </div>
        <button onClick={() => (showForm ? resetForm() : setShowForm(true))} className="btn-primary flex items-center gap-2">
          {showForm ? <X size={18} /> : <Plus size={18} />} {showForm ? 'Cancel' : 'Add Stop'}
        </button>
      </div>

      {showForm && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">{editingId ? 'Edit Stop' : 'Add New Stop'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Route *</label>
                <select className="form-select" value={form.route} onChange={e => setForm(p => ({ ...p, route: e.target.value }))} required>
                  <option value="">Select Route</option>
                  {routes.map(r => <option key={r.id} value={r.id}>{r.name} {r.vehicle_no ? `(Bus ${r.vehicle_no})` : ''}</option>)}
                </select>
              </div>
              <div><label className="form-label">Stop Name *</label><input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
              <div><label className="form-label">Order</label><input type="number" min="0" className="form-input" value={form.order} onChange={e => setForm(p => ({ ...p, order: Number(e.target.value) }))} /></div>
              <div><label className="form-label">Monthly Fee (₹) *</label><input type="number" min="0" step="0.01" className="form-input" value={form.monthly_fee} onChange={e => setForm(p => ({ ...p, monthly_fee: e.target.value }))} required /></div>
              <div><label className="form-label">Pickup Time</label><input type="time" className="form-input" value={form.pickup_time} onChange={e => setForm(p => ({ ...p, pickup_time: e.target.value }))} /></div>
              <div><label className="form-label">Drop Time</label><input type="time" className="form-input" value={form.drop_time} onChange={e => setForm(p => ({ ...p, drop_time: e.target.value }))} /></div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saveMutation.isPending} className="btn-primary flex items-center gap-2"><Save size={18} /> {editingId ? 'Update' : 'Save'} Stop</button>
              <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-700">Stops</h2>
          <select className="form-select w-56" value={routeFilter} onChange={e => setRouteFilter(e.target.value)}>
            <option value="">All Routes</option>
            {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : stops.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No stops found. Click "Add Stop" to create one.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="table-header text-left px-6 py-3">S.No</th>
                  <th className="table-header text-left px-6 py-3">Stop Name</th>
                  <th className="table-header text-left px-6 py-3">Route</th>
                  <th className="table-header text-left px-6 py-3">Order</th>
                  <th className="table-header text-right px-6 py-3">Monthly Fee</th>
                  <th className="table-header text-left px-6 py-3">Pickup / Drop</th>
                  <th className="table-header text-center px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stops.map((s, i) => (
                  <tr key={s.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">{i + 1}</td>
                    <td className="px-6 py-4 font-medium">{s.name}</td>
                    <td className="px-6 py-4 text-sm">{s.route_name}</td>
                    <td className="px-6 py-4 text-sm">{s.order}</td>
                    <td className="px-6 py-4 text-right font-semibold text-green-700">₹{Number(s.monthly_fee).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{s.pickup_time || '—'} / {s.drop_time || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEdit(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Edit2 size={16} /></button>
                        <button onClick={() => { if (window.confirm('Delete this stop?')) deleteMutation.mutate(s.id) }} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
