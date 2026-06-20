import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { academicsApi } from '../../services/api'

const listOf = (r) => r.data.results || r.data
const emptyForm = { name: '', code: '', display_order: 0 }

export default function TestMaster() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const { data: tests = [], isLoading } = useQuery({
    queryKey: ['tests'],
    queryFn: () => academicsApi.tests().then(listOf),
  })

  const saveMutation = useMutation({
    mutationFn: (payload) => editing
      ? academicsApi.updateTest(editing.id, payload)
      : academicsApi.createTest(payload),
    onSuccess: () => {
      qc.invalidateQueries(['tests'])
      setShowForm(false); setEditing(null); setForm(emptyForm)
      toast.success(editing ? 'Test updated!' : 'Test created!')
    },
    onError: () => toast.error('Failed to save'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => academicsApi.deleteTest(id),
    onSuccess: () => { qc.invalidateQueries(['tests']); toast.success('Deleted!') },
    onError: () => toast.error('Failed to delete'),
  })

  const submit = () => {
    if (!form.name.trim()) { toast.error('Test name is required'); return }
    saveMutation.mutate({ name: form.name, code: form.code, display_order: Number(form.display_order) || 0 })
  }

  const openEdit = (t) => {
    setEditing(t)
    setForm({ name: t.name || '', code: t.code || '', display_order: t.display_order ?? 0 })
    setShowForm(true)
  }
  const openNew = () => { setEditing(null); setForm(emptyForm); setShowForm(true) }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Test Master</h1>
          <p className="page-sub">Define tests used as columns in Assign Subject &amp; Test.</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Test</button>
      </div>

      {showForm && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{editing ? 'Edit' : 'Add'} Test</h3>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Test Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. FA1 / Unit Test 1" />
            </div>
            <div>
              <label className="form-label">Code</label>
              <input className="form-input" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g. FA1" />
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
            <tr><th>#</th><th>Test Name</th><th>Code</th><th>Order</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="text-center py-8 text-gray-400">Loading...</td></tr>}
            {!isLoading && tests.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">No tests defined yet</td></tr>}
            {tests.map((t, i) => (
              <tr key={t.id}>
                <td className="text-gray-500">{i + 1}</td>
                <td className="font-medium">{t.name}</td>
                <td className="text-gray-600">{t.code || '—'}</td>
                <td className="text-gray-500">{t.display_order}</td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(t)} className="p-1.5 hover:bg-blue-50 rounded text-blue-600"><Edit size={14} /></button>
                    <button onClick={() => { if (confirm('Delete this test?')) deleteMutation.mutate(t.id) }} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 size={14} /></button>
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
