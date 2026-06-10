import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Pencil, Check, X, Award } from 'lucide-react'
import toast from 'react-hot-toast'
import { academicsApi } from '../../services/api'

const BLANK = { grade: '', min_percent: '', max_percent: '', grade_point: '', remark: '' }

export default function GradeScale() {
  const qc = useQueryClient()
  const [form, setForm] = useState(BLANK)
  const [editId, setEditId] = useState(null)
  const [editRow, setEditRow] = useState(BLANK)
  const [confirmId, setConfirmId] = useState(null)

  const { data: grades = [], isLoading } = useQuery({
    queryKey: ['grade-scale'],
    queryFn: () => academicsApi.gradeScale().then(r => r.data.results ?? r.data),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['grade-scale'] })

  const createMut = useMutation({
    mutationFn: (data) => academicsApi.createGradeScale(data),
    onSuccess: () => { invalidate(); setForm(BLANK); toast.success('Grade added') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to add grade'),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => academicsApi.updateGradeScale(id, data),
    onSuccess: () => { invalidate(); setEditId(null); toast.success('Grade updated') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to update grade'),
  })
  const deleteMut = useMutation({
    mutationFn: (id) => academicsApi.deleteGradeScale(id),
    onSuccess: () => { invalidate(); setConfirmId(null); toast.success('Grade deleted') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to delete grade'),
  })

  const toPayload = (d) => ({
    grade: d.grade.trim().toUpperCase(),
    min_percent: Number(d.min_percent),
    max_percent: Number(d.max_percent),
    grade_point: d.grade_point === '' ? 0 : Number(d.grade_point),
    remark: d.remark.trim(),
  })

  const submit = (e) => {
    e.preventDefault()
    if (!form.grade || form.min_percent === '' || form.max_percent === '') {
      return toast.error('Grade, min % and max % are required')
    }
    createMut.mutate(toPayload(form))
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Grade Scale</h1>
        <p className="page-sub">Define grade bands used to compute the overall grade on report cards.</p>
      </div>

      {/* Add form */}
      <form onSubmit={submit} className="card p-5">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
          <div>
            <label className="form-label">Grade</label>
            <input className="form-input uppercase" placeholder="A1" value={form.grade}
              onChange={e => setForm(p => ({ ...p, grade: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Min %</label>
            <input type="number" step="0.01" className="form-input" placeholder="90" value={form.min_percent}
              onChange={e => setForm(p => ({ ...p, min_percent: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Max %</label>
            <input type="number" step="0.01" className="form-input" placeholder="100" value={form.max_percent}
              onChange={e => setForm(p => ({ ...p, max_percent: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Grade Point</label>
            <input type="number" step="0.01" className="form-input" placeholder="10" value={form.grade_point}
              onChange={e => setForm(p => ({ ...p, grade_point: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Remark</label>
            <input className="form-input" placeholder="Outstanding" value={form.remark}
              onChange={e => setForm(p => ({ ...p, remark: e.target.value }))} />
          </div>
          <button type="submit" disabled={createMut.isPending} className="btn-primary flex items-center justify-center gap-1.5">
            <Plus size={15} /> Add
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Grade</th><th>Min %</th><th>Max %</th><th>Grade Point</th><th>Remark</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">Loading…</td></tr>
            ) : grades.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">
                <Award size={28} className="mx-auto mb-2 text-gray-300" />No grade bands defined yet.
              </td></tr>
            ) : grades.map(g => editId === g.id ? (
              <tr key={g.id} className="bg-green-50/40">
                <td><input className="form-input py-1 w-16 uppercase" value={editRow.grade} onChange={e => setEditRow(p => ({ ...p, grade: e.target.value }))} /></td>
                <td><input type="number" step="0.01" className="form-input py-1 w-20" value={editRow.min_percent} onChange={e => setEditRow(p => ({ ...p, min_percent: e.target.value }))} /></td>
                <td><input type="number" step="0.01" className="form-input py-1 w-20" value={editRow.max_percent} onChange={e => setEditRow(p => ({ ...p, max_percent: e.target.value }))} /></td>
                <td><input type="number" step="0.01" className="form-input py-1 w-20" value={editRow.grade_point} onChange={e => setEditRow(p => ({ ...p, grade_point: e.target.value }))} /></td>
                <td><input className="form-input py-1" value={editRow.remark} onChange={e => setEditRow(p => ({ ...p, remark: e.target.value }))} /></td>
                <td className="text-right whitespace-nowrap">
                  <button onClick={() => updateMut.mutate({ id: g.id, data: toPayload(editRow) })} className="btn-ghost btn-sm text-green-600"><Check size={15} /></button>
                  <button onClick={() => setEditId(null)} className="btn-ghost btn-sm text-gray-400"><X size={15} /></button>
                </td>
              </tr>
            ) : (
              <tr key={g.id}>
                <td><span className="badge badge-green">{g.grade}</span></td>
                <td>{g.min_percent}</td>
                <td>{g.max_percent}</td>
                <td>{g.grade_point}</td>
                <td className="text-gray-500">{g.remark || '—'}</td>
                <td className="text-right whitespace-nowrap">
                  {confirmId === g.id ? (
                    <>
                      <span className="text-xs text-gray-500 mr-2">Delete?</span>
                      <button onClick={() => deleteMut.mutate(g.id)} className="btn-ghost btn-sm text-red-600"><Check size={15} /></button>
                      <button onClick={() => setConfirmId(null)} className="btn-ghost btn-sm text-gray-400"><X size={15} /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditId(g.id); setEditRow({ grade: g.grade, min_percent: g.min_percent, max_percent: g.max_percent, grade_point: g.grade_point, remark: g.remark || '' }) }} className="btn-ghost btn-sm text-gray-500"><Pencil size={15} /></button>
                      <button onClick={() => setConfirmId(g.id)} className="btn-ghost btn-sm text-red-500"><Trash2 size={15} /></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
