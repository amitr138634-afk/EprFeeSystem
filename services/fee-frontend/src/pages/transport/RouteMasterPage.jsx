import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, Save, X, CheckCircle, XCircle } from 'lucide-react'
import { transportApi } from '../../services/api'

const listOf = (r) => r.data.results || r.data
const emptyForm = { name: '', code: '', vehicle: '', is_active: true }

export default function RouteMasterPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const { data: routes = [], isLoading } = useQuery({
    queryKey: ['routes-master'],
    queryFn: () => transportApi.routes().then(listOf),
  })
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles-for-route'],
    queryFn: () => transportApi.vehicles().then(listOf),
  })

  const resetForm = () => { setForm(emptyForm); setShowForm(false); setEditingId(null) }

  const saveMutation = useMutation({
    mutationFn: (data) => editingId ? transportApi.updateRoute(editingId, data) : transportApi.createRoute(data),
    onSuccess: () => {
      qc.invalidateQueries(['routes-master'])
      toast.success(editingId ? 'Route updated!' : 'Route created!')
      resetForm()
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to save route'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => transportApi.deleteRoute(id),
    onSuccess: () => { qc.invalidateQueries(['routes-master']); toast.success('Route deleted!') },
    onError: () => toast.error('Failed to delete route'),
  })

  const handleEdit = (r) => {
    setForm({ name: r.name, code: r.code, vehicle: r.vehicle || '', is_active: r.is_active })
    setEditingId(r.id)
    setShowForm(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    saveMutation.mutate({ ...form, vehicle: form.vehicle || null })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Route Master</h1>
          <p className="text-sm text-gray-500 mt-1">Define and manage transport routes</p>
        </div>
        <button onClick={() => (showForm ? resetForm() : setShowForm(true))} className="btn-primary flex items-center gap-2">
          {showForm ? <X size={18} /> : <Plus size={18} />} {showForm ? 'Cancel' : 'Add Route'}
        </button>
      </div>

      {showForm && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">{editingId ? 'Edit Route' : 'Add New Route'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Route Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Route 1 - North" required />
              </div>
              <div>
                <label className="form-label">Route Code *</label>
                <input className="form-input" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g., RT-01" required />
              </div>
              <div>
                <label className="form-label">Assign Bus</label>
                <select className="form-select" value={form.vehicle} onChange={e => setForm(p => ({ ...p, vehicle: e.target.value }))}>
                  <option value="">No bus assigned</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.bus_no}</option>)}
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 text-blue-600 rounded" />
              <span className="text-sm text-gray-700">Active</span>
            </label>
            <div className="flex gap-3">
              <button type="submit" disabled={saveMutation.isPending} className="btn-primary flex items-center gap-2"><Save size={18} /> {editingId ? 'Update' : 'Save'} Route</button>
              <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="p-6 border-b"><h2 className="text-lg font-semibold text-gray-700">Routes</h2></div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : routes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No routes found. Click "Add Route" to create one.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="table-header text-left px-6 py-3">S.No</th>
                  <th className="table-header text-left px-6 py-3">Route Name</th>
                  <th className="table-header text-left px-6 py-3">Code</th>
                  <th className="table-header text-left px-6 py-3">Bus</th>
                  <th className="table-header text-left px-6 py-3">Stops</th>
                  <th className="table-header text-center px-6 py-3">Status</th>
                  <th className="table-header text-center px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((r, i) => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">{i + 1}</td>
                    <td className="px-6 py-4 font-medium">{r.name}</td>
                    <td className="px-6 py-4 text-sm">{r.code}</td>
                    <td className="px-6 py-4 text-sm">{r.vehicle_no || '—'}</td>
                    <td className="px-6 py-4 text-sm">{(r.stops || []).length}</td>
                    <td className="px-6 py-4 text-center">
                      {r.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={14} className="mr-1" /> Active</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"><XCircle size={14} className="mr-1" /> Inactive</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEdit(r)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Edit2 size={16} /></button>
                        <button onClick={() => { if (window.confirm('Delete this route?')) deleteMutation.mutate(r.id) }} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 size={16} /></button>
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
