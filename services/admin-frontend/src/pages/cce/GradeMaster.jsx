import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { academicsApi } from '../../services/api'

const listOf = (r) => r.data.results || r.data

const TYPE_TABS = [
  { value: 'marks_based', label: 'Marks Based' },
  { value: 'direct',      label: 'Direct Grade' },
]

const emptyForm = { grade_label: '', min_marks: '', max_marks: '', remark: '', display_order: 0 }

export default function GradeMaster() {
  const qc = useQueryClient()
  const [type, setType] = useState('marks_based')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const { data: grades = [], isLoading } = useQuery({
    queryKey: ['grades', type],
    queryFn: () => academicsApi.grades({ grade_type: type }).then(listOf),
  })

  const saveMutation = useMutation({
    mutationFn: (payload) => editing
      ? academicsApi.updateGrade(editing.id, payload)
      : academicsApi.createGrade(payload),
    onSuccess: () => {
      qc.invalidateQueries(['grades'])
      setShowForm(false); setEditing(null); setForm(emptyForm)
      toast.success(editing ? 'Grade updated!' : 'Grade created!')
    },
    onError: (e) => toast.error(e.response?.data?.[0] || e.response?.data?.detail || 'Failed to save'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => academicsApi.deleteGrade(id),
    onSuccess: () => { qc.invalidateQueries(['grades']); toast.success('Deleted!') },
    onError: () => toast.error('Failed to delete'),
  })

  const submit = () => {
    if (!form.grade_label.trim()) { toast.error('Grade label is required'); return }
    const payload = {
      grade_label: form.grade_label,
      remark: form.remark,
      display_order: Number(form.display_order) || 0,
      grade_type: type,
      min_marks: type === 'marks_based' ? (form.min_marks === '' ? null : form.min_marks) : null,
      max_marks: type === 'marks_based' ? (form.max_marks === '' ? null : form.max_marks) : null,
    }
    if (type === 'marks_based' && (payload.min_marks === null || payload.max_marks === null)) {
      toast.error('Min and Max marks are required for Marks Based grades'); return
    }
    saveMutation.mutate(payload)
  }

  const openEdit = (g) => {
    setEditing(g)
    setForm({
      grade_label: g.grade_label || '',
      min_marks: g.min_marks ?? '',
      max_marks: g.max_marks ?? '',
      remark: g.remark || '',
      display_order: g.display_order ?? 0,
    })
    setShowForm(true)
  }
  const openNew = () => { setEditing(null); setForm(emptyForm); setShowForm(true) }

  const marksBased = type === 'marks_based'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Grade Master</h1>
          <p className="page-sub">Define marks-based grade bands and direct-entry grades.</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Grade</button>
      </div>

      {/* Type tabs */}
      <div className="flex gap-2">
        {TYPE_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => { setType(t.value); setShowForm(false) }}
            className={type === t.value ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
          >
            {t.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{editing ? 'Edit' : 'Add'} {marksBased ? 'Marks Based' : 'Direct'} Grade</h3>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-gray-400" /></button>
          </div>
          <div className={`grid gap-4 ${marksBased ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-2 md:grid-cols-3'}`}>
            <div>
              <label className="form-label">Grade Label</label>
              <input className="form-input" value={form.grade_label} onChange={e => setForm(p => ({ ...p, grade_label: e.target.value }))} placeholder="e.g. A1" />
            </div>
            {marksBased && (
              <>
                <div>
                  <label className="form-label">Min Marks</label>
                  <input type="number" className="form-input" value={form.min_marks} onChange={e => setForm(p => ({ ...p, min_marks: e.target.value }))} min={0} step="0.01" />
                </div>
                <div>
                  <label className="form-label">Max Marks</label>
                  <input type="number" className="form-input" value={form.max_marks} onChange={e => setForm(p => ({ ...p, max_marks: e.target.value }))} min={0} step="0.01" />
                </div>
              </>
            )}
            <div>
              <label className="form-label">Remark</label>
              <input className="form-input" value={form.remark} onChange={e => setForm(p => ({ ...p, remark: e.target.value }))} placeholder="e.g. Excellent" />
            </div>
            <div>
              <label className="form-label">Display Order</label>
              <input type="number" className="form-input" value={form.display_order} onChange={e => setForm(p => ({ ...p, display_order: e.target.value }))} min={0} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={submit} disabled={saveMutation.isLoading} className="btn-primary btn-sm">Save</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary btn-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Grade</th>
              {marksBased && <><th>Min Marks</th><th>Max Marks</th></>}
              <th>Remark</th>
              <th>Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={marksBased ? 7 : 5} className="text-center py-8 text-gray-400">Loading...</td></tr>}
            {!isLoading && grades.length === 0 && <tr><td colSpan={marksBased ? 7 : 5} className="text-center py-8 text-gray-400">No grades defined yet</td></tr>}
            {grades.map((g, i) => (
              <tr key={g.id}>
                <td className="text-gray-500">{i + 1}</td>
                <td className="font-medium">{g.grade_label}</td>
                {marksBased && <><td>{g.min_marks}</td><td>{g.max_marks}</td></>}
                <td className="text-gray-600">{g.remark || '—'}</td>
                <td className="text-gray-500">{g.display_order}</td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(g)} className="p-1.5 hover:bg-blue-50 rounded text-blue-600"><Edit size={14} /></button>
                    <button onClick={() => { if (confirm('Delete this grade?')) deleteMutation.mutate(g.id) }} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
