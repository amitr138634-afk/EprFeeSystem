import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, X, Check, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { timetableApi } from '../../services/api'

const EMPTY_FORM = { name: '', start_time: '', end_time: '', order: '' }

function formatTime(t) {
  if (!t) return '-'
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${display}:${m} ${ampm}`
}

export default function PeriodMaster() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const { data: periods = [], isLoading } = useQuery({
    queryKey: ['timetable-periods'],
    queryFn: () => timetableApi.periods().then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => timetableApi.createPeriod(data),
    onSuccess: () => {
      qc.invalidateQueries(['timetable-periods'])
      toast.success('Period created')
      resetForm()
    },
    onError: () => toast.error('Failed to create period'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => timetableApi.updatePeriod(id, data),
    onSuccess: () => {
      qc.invalidateQueries(['timetable-periods'])
      toast.success('Period updated')
      resetForm()
    },
    onError: () => toast.error('Failed to update period'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => timetableApi.deletePeriod(id),
    onSuccess: () => {
      qc.invalidateQueries(['timetable-periods'])
      toast.success('Period deleted')
    },
    onError: () => toast.error('Failed to delete period'),
  })

  function resetForm() {
    setForm(EMPTY_FORM)
    setShowForm(false)
    setEditId(null)
  }

  function startEdit(period) {
    setEditId(period.id)
    setForm({
      name: period.name,
      start_time: period.start_time?.slice(0, 5) || '',
      end_time: period.end_time?.slice(0, 5) || '',
      order: period.order ?? '',
    })
    setShowForm(false)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.start_time || !form.end_time) {
      toast.error('Name, Start Time and End Time are required')
      return
    }
    const payload = { ...form, order: form.order === '' ? undefined : parseInt(form.order) }
    if (editId) {
      updateMutation.mutate({ id: editId, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isBusy = createMutation.isPending || updateMutation.isPending

  const InlineForm = ({ onCancel }) => (
    <form onSubmit={handleSubmit} className="card p-4 border-2 border-blue-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        {editId ? 'Edit Period' : 'New Period'}
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="form-label">Name <span className="text-red-500">*</span></label>
          <input
            className="form-input"
            placeholder="e.g. Period 1"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="form-label">Start Time <span className="text-red-500">*</span></label>
          <input
            type="time"
            className="form-input"
            value={form.start_time}
            onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
          />
        </div>
        <div>
          <label className="form-label">End Time <span className="text-red-500">*</span></label>
          <input
            type="time"
            className="form-input"
            value={form.end_time}
            onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
          />
        </div>
        <div>
          <label className="form-label">Order</label>
          <input
            type="number"
            min="1"
            className="form-input"
            placeholder="e.g. 1"
            value={form.order}
            onChange={e => setForm(f => ({ ...f, order: e.target.value }))}
          />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button type="submit" disabled={isBusy} className="btn-primary flex items-center gap-1">
          <Check size={14} /> {editId ? 'Update' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary flex items-center gap-1">
          <X size={14} /> Cancel
        </button>
      </div>
    </form>
  )

  const sorted = [...periods].sort((a, b) => (a.order ?? 999) - (b.order ?? 999))

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Period Master</h1>
          <p className="text-sm text-gray-500">Define daily periods and their timings</p>
        </div>
        {!showForm && !editId && (
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM) }}
          >
            <Plus size={16} /> Add Period
          </button>
        )}
      </div>

      {/* Add Form */}
      {showForm && !editId && (
        <InlineForm onCancel={resetForm} />
      )}

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : sorted.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No periods found. Add one above.</td></tr>
              ) : (
                sorted.map((p, i) => (
                  <>
                    <tr key={p.id}>
                      <td className="text-gray-500">{i + 1}</td>
                      <td className="font-medium text-gray-800">{p.name}</td>
                      <td>
                        <span className="flex items-center gap-1 text-gray-600">
                          <Clock size={12} className="text-gray-400" />
                          {formatTime(p.start_time)}
                        </span>
                      </td>
                      <td>
                        <span className="flex items-center gap-1 text-gray-600">
                          <Clock size={12} className="text-gray-400" />
                          {formatTime(p.end_time)}
                        </span>
                      </td>
                      <td>
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                          {p.order ?? '-'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                            onClick={() => startEdit(p)}
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="p-1.5 hover:bg-red-50 rounded text-red-500"
                            onClick={() => {
                              if (window.confirm(`Delete period "${p.name}"?`)) deleteMutation.mutate(p.id)
                            }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {editId === p.id && (
                      <tr key={`edit-${p.id}`}>
                        <td colSpan={6} className="p-0">
                          <div className="p-3 bg-blue-50">
                            <InlineForm onCancel={resetForm} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
