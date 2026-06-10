import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, Check, X, Loader2, AlertTriangle, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { academicsApi } from '../../services/api'

const EMPTY_FORM = { min_percentage: '', max_percentage: '', remark: '', grade: '' }

function DeleteConfirm({ label, onConfirm, onCancel, isPending }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
      <AlertTriangle size={14} className="text-red-500 shrink-0" />
      <span className="text-xs text-red-700">Delete <strong>{label}</strong>?</span>
      <button
        onClick={onConfirm}
        disabled={isPending}
        className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded disabled:opacity-50"
      >
        {isPending ? <Loader2 size={11} className="animate-spin" /> : 'Yes'}
      </button>
      <button onClick={onCancel} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
    </div>
  )
}

function GradeBadgeColor(grade) {
  if (!grade) return 'badge-gray'
  const g = grade.toUpperCase()
  if (g.startsWith('A')) return 'badge-green'
  if (g.startsWith('B')) return 'badge-blue'
  if (g.startsWith('C')) return 'badge-yellow'
  return 'badge-gray'
}

function RemarkRow({ rem }) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [form, setForm] = useState({
    min_percentage: rem.min_percentage,
    max_percentage: rem.max_percentage,
    remark: rem.remark,
    grade: rem.grade,
  })

  const updateMut = useMutation({
    mutationFn: () => academicsApi.updateRemark(rem.id, {
      ...form,
      min_percentage: Number(form.min_percentage),
      max_percentage: Number(form.max_percentage),
    }),
    onSuccess: () => { qc.invalidateQueries(['remarks']); setEditing(false); toast.success('Remark updated') },
    onError: () => toast.error('Failed to update remark'),
  })

  const deleteMut = useMutation({
    mutationFn: () => academicsApi.deleteRemark(rem.id),
    onSuccess: () => { qc.invalidateQueries(['remarks']); toast.success('Remark deleted') },
    onError: () => toast.error('Failed to delete remark'),
  })

  if (editing) {
    return (
      <tr className="bg-blue-50">
        <td className="px-4 py-2">
          <input
            type="number"
            autoFocus
            className="form-input text-sm py-1 w-24"
            value={form.min_percentage}
            onChange={e => setForm(p => ({ ...p, min_percentage: e.target.value }))}
          />
        </td>
        <td className="px-4 py-2">
          <input
            type="number"
            className="form-input text-sm py-1 w-24"
            value={form.max_percentage}
            onChange={e => setForm(p => ({ ...p, max_percentage: e.target.value }))}
          />
        </td>
        <td className="px-4 py-2">
          <input
            className="form-input text-sm py-1 uppercase w-20"
            value={form.grade}
            onChange={e => setForm(p => ({ ...p, grade: e.target.value.toUpperCase() }))}
            placeholder="A+"
          />
        </td>
        <td className="px-4 py-2">
          <input
            className="form-input text-sm py-1"
            value={form.remark}
            onChange={e => setForm(p => ({ ...p, remark: e.target.value }))}
            placeholder="Excellent"
          />
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => updateMut.mutate()}
              disabled={updateMut.isPending}
              className="p-1.5 bg-green-100 hover:bg-green-200 rounded text-green-700"
            >
              {updateMut.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            </button>
            <button onClick={() => setEditing(false)} className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-500">
              <X size={13} />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="hover:bg-gray-50 group">
      <td className="px-4 py-3 text-sm text-gray-700">{rem.min_percentage}%</td>
      <td className="px-4 py-3 text-sm text-gray-700">{rem.max_percentage}%</td>
      <td className="px-4 py-3">
        <span className={`badge ${GradeBadgeColor(rem.grade)} font-semibold`}>{rem.grade || '—'}</span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-800 font-medium">{rem.remark}</td>
      <td className="px-4 py-3">
        {confirming ? (
          <DeleteConfirm
            label={rem.remark}
            onConfirm={() => deleteMut.mutate()}
            onCancel={() => setConfirming(false)}
            isPending={deleteMut.isPending}
          />
        ) : (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setEditing(true)} className="p-1.5 hover:bg-blue-50 rounded text-blue-500">
              <Edit2 size={14} />
            </button>
            <button onClick={() => setConfirming(true)} className="p-1.5 hover:bg-red-50 rounded text-red-400">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

function AddRemarkForm({ onDone }) {
  const qc = useQueryClient()
  const [form, setForm] = useState(EMPTY_FORM)

  const createMut = useMutation({
    mutationFn: () => academicsApi.createRemark({
      ...form,
      min_percentage: Number(form.min_percentage),
      max_percentage: Number(form.max_percentage),
    }),
    onSuccess: () => { qc.invalidateQueries(['remarks']); setForm(EMPTY_FORM); toast.success('Remark created') },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to create remark'),
  })

  const valid = form.min_percentage !== '' && form.max_percentage !== '' && form.remark.trim()

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Add Grade Remark</h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div>
          <label className="form-label">Min Percentage (%) <span className="text-red-500">*</span></label>
          <input
            autoFocus
            type="number"
            className="form-input"
            placeholder="0"
            min="0"
            max="100"
            value={form.min_percentage}
            onChange={e => setForm(p => ({ ...p, min_percentage: e.target.value }))}
          />
        </div>
        <div>
          <label className="form-label">Max Percentage (%) <span className="text-red-500">*</span></label>
          <input
            type="number"
            className="form-input"
            placeholder="100"
            min="0"
            max="100"
            value={form.max_percentage}
            onChange={e => setForm(p => ({ ...p, max_percentage: e.target.value }))}
          />
        </div>
        <div>
          <label className="form-label">Grade</label>
          <input
            className="form-input uppercase"
            placeholder="A+"
            value={form.grade}
            onChange={e => setForm(p => ({ ...p, grade: e.target.value.toUpperCase() }))}
          />
        </div>
        <div>
          <label className="form-label">Remark <span className="text-red-500">*</span></label>
          <input
            className="form-input"
            placeholder="Excellent"
            value={form.remark}
            onChange={e => setForm(p => ({ ...p, remark: e.target.value }))}
          />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => createMut.mutate()}
          disabled={!valid || createMut.isPending}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          {createMut.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Plus size={14} /> Add Remark</>}
        </button>
        <button onClick={onDone} className="btn-secondary">Cancel</button>
      </div>
    </div>
  )
}

export default function RemarkMaster() {
  const [showForm, setShowForm] = useState(false)

  const { data: remarks = [], isLoading } = useQuery({
    queryKey: ['remarks'],
    queryFn: () => academicsApi.remarks().then(r => r.data.results ?? r.data),
  })

  const sorted = [...remarks].sort((a, b) => b.min_percentage - a.min_percentage)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Grade Remark Master</h1>
          <p className="page-sub">Configure grade labels and remarks for percentage ranges used in report cards.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Remark
        </button>
      </div>

      {showForm && <AddRemarkForm onDone={() => setShowForm(false)} />}

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Star size={28} className="text-purple-500" />
            </div>
            <h3 className="font-semibold text-gray-700 mb-1">No remarks configured</h3>
            <p className="text-sm text-gray-400 mb-4">Add grade remarks like "Excellent (90-100%)" to use on report cards.</p>
            <button onClick={() => setShowForm(true)} className="btn-primary inline-flex items-center gap-2">
              <Plus size={14} /> Add First Remark
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Min %</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Max %</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Grade</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Remark</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map(rem => <RemarkRow key={rem.id} rem={rem} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
