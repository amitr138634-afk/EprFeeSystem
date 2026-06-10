import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, Check, X, Loader2, AlertTriangle, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { academicsApi } from '../../services/api'

const EMPTY_FORM = { name: '', code: '', max_marks: '', passing_marks: '', is_graded: false }

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

function ExamTypeRow({ et }) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [form, setForm] = useState({
    name: et.name,
    code: et.code,
    max_marks: et.max_marks,
    passing_marks: et.passing_marks,
    is_graded: et.is_graded,
  })

  const updateMut = useMutation({
    mutationFn: () => academicsApi.updateExamType(et.id, {
      ...form,
      max_marks: Number(form.max_marks),
      passing_marks: Number(form.passing_marks),
    }),
    onSuccess: () => { qc.invalidateQueries(['exam-types']); setEditing(false); toast.success('Exam type updated') },
    onError: (err) => toast.error(err.response?.data?.name?.[0] || 'Failed to update'),
  })

  const deleteMut = useMutation({
    mutationFn: () => academicsApi.deleteExamType(et.id),
    onSuccess: () => { qc.invalidateQueries(['exam-types']); toast.success('Exam type deleted') },
    onError: () => toast.error('Failed to delete exam type'),
  })

  if (editing) {
    return (
      <tr className="bg-blue-50">
        <td className="px-4 py-2">
          <input
            autoFocus
            className="form-input text-sm py-1"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          />
        </td>
        <td className="px-4 py-2">
          <input
            className="form-input text-sm py-1 uppercase"
            value={form.code}
            onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
          />
        </td>
        <td className="px-4 py-2">
          <input
            type="number"
            className="form-input text-sm py-1 w-24"
            value={form.max_marks}
            onChange={e => setForm(p => ({ ...p, max_marks: e.target.value }))}
          />
        </td>
        <td className="px-4 py-2">
          <input
            type="number"
            className="form-input text-sm py-1 w-24"
            value={form.passing_marks}
            onChange={e => setForm(p => ({ ...p, passing_marks: e.target.value }))}
          />
        </td>
        <td className="px-4 py-2 text-center">
          <input
            type="checkbox"
            checked={form.is_graded}
            onChange={e => setForm(p => ({ ...p, is_graded: e.target.checked }))}
            className="w-4 h-4 text-blue-600 rounded"
          />
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => updateMut.mutate()}
              disabled={updateMut.isPending}
              className="p-1.5 bg-green-100 hover:bg-green-200 rounded text-green-700"
              title="Save"
            >
              {updateMut.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            </button>
            <button onClick={() => setEditing(false)} className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-500" title="Cancel">
              <X size={13} />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="hover:bg-gray-50 group">
      <td className="px-4 py-3 font-medium text-gray-800 text-sm">{et.name}</td>
      <td className="px-4 py-3">
        <span className="badge badge-blue font-mono text-xs">{et.code}</span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">{et.max_marks}</td>
      <td className="px-4 py-3 text-sm text-gray-700">{et.passing_marks}</td>
      <td className="px-4 py-3 text-center">
        {et.is_graded
          ? <span className="badge badge-green text-xs">Graded</span>
          : <span className="badge badge-gray text-xs">Marks</span>
        }
      </td>
      <td className="px-4 py-3">
        {confirming ? (
          <DeleteConfirm
            label={et.name}
            onConfirm={() => deleteMut.mutate()}
            onCancel={() => setConfirming(false)}
            isPending={deleteMut.isPending}
          />
        ) : (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setEditing(true)} className="p-1.5 hover:bg-blue-50 rounded text-blue-500" title="Edit">
              <Edit2 size={14} />
            </button>
            <button onClick={() => setConfirming(true)} className="p-1.5 hover:bg-red-50 rounded text-red-400" title="Delete">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

function AddExamTypeForm({ onDone }) {
  const qc = useQueryClient()
  const [form, setForm] = useState(EMPTY_FORM)

  const createMut = useMutation({
    mutationFn: () => academicsApi.createExamType({
      ...form,
      max_marks: Number(form.max_marks),
      passing_marks: Number(form.passing_marks),
    }),
    onSuccess: () => { qc.invalidateQueries(['exam-types']); setForm(EMPTY_FORM); toast.success('Exam type created') },
    onError: (err) => toast.error(err.response?.data?.name?.[0] || err.response?.data?.code?.[0] || 'Failed to create'),
  })

  const valid = form.name.trim() && form.code.trim() && form.max_marks && form.passing_marks

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Add Exam Type</h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div>
          <label className="form-label">Name <span className="text-red-500">*</span></label>
          <input
            autoFocus
            className="form-input"
            placeholder="e.g. Unit Test 1"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="form-label">Code <span className="text-red-500">*</span></label>
          <input
            className="form-input uppercase"
            placeholder="e.g. UT1"
            value={form.code}
            onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
          />
        </div>
        <div>
          <label className="form-label">Max Marks <span className="text-red-500">*</span></label>
          <input
            type="number"
            className="form-input"
            placeholder="100"
            min="0"
            value={form.max_marks}
            onChange={e => setForm(p => ({ ...p, max_marks: e.target.value }))}
          />
        </div>
        <div>
          <label className="form-label">Passing Marks <span className="text-red-500">*</span></label>
          <input
            type="number"
            className="form-input"
            placeholder="33"
            min="0"
            value={form.passing_marks}
            onChange={e => setForm(p => ({ ...p, passing_marks: e.target.value }))}
          />
        </div>
      </div>
      <div className="flex items-center gap-6 mt-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_graded}
            onChange={e => setForm(p => ({ ...p, is_graded: e.target.checked }))}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm text-gray-700">Grade-based evaluation</span>
        </label>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => createMut.mutate()}
          disabled={!valid || createMut.isPending}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          {createMut.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Plus size={14} /> Add Exam Type</>}
        </button>
        <button onClick={onDone} className="btn-secondary">Cancel</button>
      </div>
    </div>
  )
}

export default function ExamTypes() {
  const [showForm, setShowForm] = useState(false)

  const { data: examTypes = [], isLoading } = useQuery({
    queryKey: ['exam-types'],
    queryFn: () => academicsApi.examTypes().then(r => r.data.results ?? r.data),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Exam Types</h1>
          <p className="page-sub">Define examination types such as Unit Tests, Half-Yearly, Annual, etc.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Exam Type
        </button>
      </div>

      {showForm && <AddExamTypeForm onDone={() => setShowForm(false)} />}

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : examTypes.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText size={28} className="text-blue-500" />
            </div>
            <h3 className="font-semibold text-gray-700 mb-1">No exam types yet</h3>
            <p className="text-sm text-gray-400 mb-4">Add your school's exam types to start entering marks.</p>
            <button onClick={() => setShowForm(true)} className="btn-primary inline-flex items-center gap-2">
              <Plus size={14} /> Add First Exam Type
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Max Marks</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Passing Marks</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {examTypes.map(et => <ExamTypeRow key={et.id} et={et} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
