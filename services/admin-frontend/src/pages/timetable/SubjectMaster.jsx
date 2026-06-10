import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { timetableApi } from '../../services/api'

const EMPTY_FORM = { name: '', code: '', type: 'core' }

const TYPE_BADGE = {
  core: 'badge badge-blue',
  elective: 'badge badge-green',
  activity: 'badge badge-gray',
}

export default function SubjectMaster() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['timetable-subjects'],
    queryFn: () => timetableApi.subjects().then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => timetableApi.createSubject(data),
    onSuccess: () => {
      qc.invalidateQueries(['timetable-subjects'])
      toast.success('Subject created')
      resetForm()
    },
    onError: () => toast.error('Failed to create subject'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => timetableApi.updateSubject(id, data),
    onSuccess: () => {
      qc.invalidateQueries(['timetable-subjects'])
      toast.success('Subject updated')
      resetForm()
    },
    onError: () => toast.error('Failed to update subject'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => timetableApi.deleteSubject(id),
    onSuccess: () => {
      qc.invalidateQueries(['timetable-subjects'])
      toast.success('Subject deleted')
    },
    onError: () => toast.error('Failed to delete subject'),
  })

  function resetForm() {
    setForm(EMPTY_FORM)
    setShowForm(false)
    setEditId(null)
  }

  function startEdit(subject) {
    setEditId(subject.id)
    setForm({ name: subject.name, code: subject.code, type: subject.type })
    setShowForm(false)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.code.trim()) {
      toast.error('Name and Code are required')
      return
    }
    if (editId) {
      updateMutation.mutate({ id: editId, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const isBusy = createMutation.isPending || updateMutation.isPending

  const InlineForm = ({ onCancel }) => (
    <form onSubmit={handleSubmit} className="card p-4 border-2 border-blue-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        {editId ? 'Edit Subject' : 'New Subject'}
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="form-label">Name <span className="text-red-500">*</span></label>
          <input
            className="form-input"
            placeholder="e.g. Mathematics"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="form-label">Code <span className="text-red-500">*</span></label>
          <input
            className="form-input"
            placeholder="e.g. MATH101"
            value={form.code}
            onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
          />
        </div>
        <div>
          <label className="form-label">Type</label>
          <select
            className="form-select"
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
          >
            <option value="core">Core</option>
            <option value="elective">Elective</option>
            <option value="activity">Activity</option>
          </select>
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Subject Master</h1>
          <p className="text-sm text-gray-500">Manage all subjects for timetable</p>
        </div>
        {!showForm && !editId && (
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM) }}
          >
            <Plus size={16} /> Add Subject
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
                <th>Code</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : subjects.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No subjects found. Add one above.</td></tr>
              ) : (
                subjects.map((s, i) => (
                  <>
                    <tr key={s.id}>
                      <td className="text-gray-500">{i + 1}</td>
                      <td className="font-medium text-gray-800">{s.name}</td>
                      <td>
                        <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">{s.code}</span>
                      </td>
                      <td>
                        <span className={TYPE_BADGE[s.type] || 'badge badge-gray'}>
                          {s.type?.charAt(0).toUpperCase() + s.type?.slice(1)}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                            onClick={() => startEdit(s)}
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="p-1.5 hover:bg-red-50 rounded text-red-500"
                            onClick={() => {
                              if (window.confirm(`Delete subject "${s.name}"?`)) deleteMutation.mutate(s.id)
                            }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {editId === s.id && (
                      <tr key={`edit-${s.id}`}>
                        <td colSpan={5} className="p-0">
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
