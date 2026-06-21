import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, Save, X, CheckCircle, XCircle } from 'lucide-react'
import { transportApi } from '../../services/api'

const listOf = (r) => r.data.results || r.data
const emptyForm = {
  bus_no: '', registration_no: '', capacity: 40,
  driver_name: '', driver_phone: '', conductor_name: '', conductor_phone: '', status: 'active',
}

export default function BusMasterPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles-master'],
    queryFn: () => transportApi.vehicles().then(listOf),
  })

  const resetForm = () => { setForm(emptyForm); setShowForm(false); setEditingId(null) }

  const saveMutation = useMutation({
    mutationFn: (data) => editingId ? transportApi.updateVehicle(editingId, data) : transportApi.createVehicle(data),
    onSuccess: () => {
      qc.invalidateQueries(['vehicles-master'])
      toast.success(editingId ? 'Bus updated!' : 'Bus created!')
      resetForm()
    },
    onError: (e) => toast.error(e.response?.data?.detail || Object.values(e.response?.data || {})[0]?.[0] || 'Failed to save bus'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => transportApi.deleteVehicle(id),
    onSuccess: () => { qc.invalidateQueries(['vehicles-master']); toast.success('Bus deleted!') },
    onError: () => toast.error('Failed to delete bus'),
  })

  const handleEdit = (v) => {
    setForm({
      bus_no: v.bus_no, registration_no: v.registration_no, capacity: v.capacity,
      driver_name: v.driver_name, driver_phone: v.driver_phone,
      conductor_name: v.conductor_name || '', conductor_phone: v.conductor_phone || '', status: v.status,
    })
    setEditingId(v.id)
    setShowForm(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    saveMutation.mutate(form)
  }

  const statusBadge = (status) => {
    if (status === 'active') return <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={14} className="mr-1" /> Active</span>
    if (status === 'maintenance') return <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Maintenance</span>
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"><XCircle size={14} className="mr-1" /> Inactive</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bus Master</h1>
          <p className="text-sm text-gray-500 mt-1">Register buses and assign them to routes (from Route Master)</p>
        </div>
        <button onClick={() => (showForm ? resetForm() : setShowForm(true))} className="btn-primary flex items-center gap-2">
          {showForm ? <X size={18} /> : <Plus size={18} />} {showForm ? 'Cancel' : 'Add Bus'}
        </button>
      </div>

      {showForm && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">{editingId ? 'Edit Bus' : 'Add New Bus'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="form-label">Bus No. *</label><input className="form-input" value={form.bus_no} onChange={e => setForm(p => ({ ...p, bus_no: e.target.value }))} placeholder="e.g., BUS-01" required /></div>
              <div><label className="form-label">Registration No. *</label><input className="form-input" value={form.registration_no} onChange={e => setForm(p => ({ ...p, registration_no: e.target.value }))} required /></div>
              <div><label className="form-label">Capacity</label><input type="number" min="1" className="form-input" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: Number(e.target.value) }))} /></div>
              <div><label className="form-label">Driver Name</label><input className="form-input" value={form.driver_name} onChange={e => setForm(p => ({ ...p, driver_name: e.target.value }))} /></div>
              <div><label className="form-label">Driver Phone</label><input className="form-input" value={form.driver_phone} onChange={e => setForm(p => ({ ...p, driver_phone: e.target.value }))} /></div>
              <div><label className="form-label">Conductor Name</label><input className="form-input" value={form.conductor_name} onChange={e => setForm(p => ({ ...p, conductor_name: e.target.value }))} /></div>
              <div><label className="form-label">Conductor Phone</label><input className="form-input" value={form.conductor_phone} onChange={e => setForm(p => ({ ...p, conductor_phone: e.target.value }))} /></div>
              <div>
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="maintenance">In Maintenance</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saveMutation.isPending} className="btn-primary flex items-center gap-2"><Save size={18} /> {editingId ? 'Update' : 'Save'} Bus</button>
              <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="p-6 border-b"><h2 className="text-lg font-semibold text-gray-700">Buses</h2></div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : vehicles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No buses found. Click "Add Bus" to create one.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="table-header text-left px-6 py-3">S.No</th>
                  <th className="table-header text-left px-6 py-3">Bus No.</th>
                  <th className="table-header text-left px-6 py-3">Registration No.</th>
                  <th className="table-header text-left px-6 py-3">Capacity</th>
                  <th className="table-header text-left px-6 py-3">Driver</th>
                  <th className="table-header text-center px-6 py-3">Status</th>
                  <th className="table-header text-center px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v, i) => (
                  <tr key={v.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">{i + 1}</td>
                    <td className="px-6 py-4 font-medium">{v.bus_no}</td>
                    <td className="px-6 py-4 text-sm">{v.registration_no}</td>
                    <td className="px-6 py-4 text-sm">{v.capacity}</td>
                    <td className="px-6 py-4 text-sm">{v.driver_name} ({v.driver_phone})</td>
                    <td className="px-6 py-4 text-center">{statusBadge(v.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEdit(v)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Edit2 size={16} /></button>
                        <button onClick={() => { if (window.confirm('Delete this bus?')) deleteMutation.mutate(v.id) }} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 size={16} /></button>
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
