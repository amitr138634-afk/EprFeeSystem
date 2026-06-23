import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, X, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { academicsApi, studentsApi } from '../../services/api'

const listOf = (r) => r.data.results || r.data
const emptyForm = { text: '', display_order: 0, is_active: true, class_id: '', section_ids: [] }

export default function RemarkMaster() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const { data: remarks = [], isLoading } = useQuery({
    queryKey: ['remarks'],
    queryFn: () => academicsApi.remarks().then(listOf),
  })
  const { data: classes = [] } = useQuery({
    queryKey: ['classMasters'],
    queryFn: () => studentsApi.classMasters().then(listOf),
  })
  const { data: sections = [] } = useQuery({
    queryKey: ['sectionMasters', form.class_id],
    queryFn: () => studentsApi.sectionMasters({ class_id: form.class_id }).then(listOf),
    enabled: !!form.class_id,
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        text: form.text.trim(),
        class_ref: Number(form.class_id),
        section_ids: form.section_ids.map(Number),
        is_active: form.is_active,
        display_order: Number(form.display_order) || 0,
      }
      return editing
        ? academicsApi.updateRemark(editing.id, payload)
        : academicsApi.createRemark(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries(['remarks'])
      setShowForm(false); setEditing(null); setForm(emptyForm)
      toast.success(editing ? 'Updated!' : 'Remark created!')
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to save'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => academicsApi.deleteRemark(id),
    onSuccess: () => { qc.invalidateQueries(['remarks']); toast.success('Deleted!') },
    onError: () => toast.error('Failed to delete'),
  })

  const toggleSection = (id) => {
    const sid = String(id)
    setForm(p => ({ ...p, section_ids: p.section_ids.includes(sid) ? p.section_ids.filter(x => x !== sid) : [...p.section_ids, sid] }))
  }

  // Switching the class clears section selections (sections belong to a class).
  const changeClass = (classId) => {
    setForm(p => ({ ...p, class_id: classId, section_ids: [] }))
  }

  const submit = (e) => {
    e.preventDefault()
    if (!form.text.trim()) { toast.error('Remark text is required'); return }
    if (!form.class_id) { toast.error('Select a class'); return }
    if (form.section_ids.length === 0) { toast.error('Select at least one section'); return }
    saveMutation.mutate()
  }

  const openEdit = (r) => {
    setEditing(r)
    setForm({
      text: r.text || '', display_order: r.display_order ?? 0, is_active: r.is_active,
      class_id: r.class_ref ? String(r.class_ref) : '',
      section_ids: (r.sections || []).map(s => String(s.id)),
    })
    setShowForm(true)
  }
  const openNew = () => { setEditing(null); setForm(emptyForm); setShowForm(true) }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Remark Master</h1>
          <p className="page-sub">Predefined remarks per class &amp; section. Teachers pick one per student in Marks Feeding.</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Remark</button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{editing ? 'Edit' : 'Add'} Remark</h3>
            <button type="button" onClick={() => setShowForm(false)}><X size={16} className="text-gray-400" /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Class</label>
              <select className="form-select" value={form.class_id} onChange={e => changeClass(e.target.value)}>
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Sections</label>
              {!form.class_id ? (
                <p className="text-sm text-gray-400 py-2">Select a class first.</p>
              ) : sections.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">No sections found for this class.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {sections.map(s => (
                    <label
                      key={s.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm cursor-pointer ${
                        form.section_ids.includes(String(s.id)) ? 'bg-purple-50 border-purple-400 text-purple-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <input type="checkbox" className="hidden" checked={form.section_ids.includes(String(s.id))} onChange={() => toggleSection(s.id)} />
                      {s.section_name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="md:col-span-1">
              <label className="form-label">Remark Text</label>
              <input className="form-input" value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))} placeholder="e.g. Excellent performance" />
            </div>
            <div>
              <label className="form-label">Display Order</label>
              <input type="number" className="form-input" value={form.display_order} onChange={e => setForm(p => ({ ...p, display_order: e.target.value }))} min={0} />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} />
                Active
              </label>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button type="submit" disabled={saveMutation.isLoading} className="btn-primary btn-sm flex items-center gap-1.5"><Save size={14} /> Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary btn-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr><th>#</th><th>Remark</th><th>Class</th><th>Sections</th><th>Order</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td></tr>}
            {!isLoading && remarks.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">No remarks defined yet</td></tr>}
            {remarks.map((r, i) => (
              <tr key={r.id}>
                <td className="text-gray-500">{i + 1}</td>
                <td className="font-medium">{r.text}</td>
                <td className="text-gray-600">{r.class_name}</td>
                <td>
                  {(r.sections || []).length === 0 ? (
                    <span className="text-gray-400 text-xs">No sections</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {r.sections.map(s => <span key={s.id} className="badge-purple">{s.section_name}</span>)}
                    </div>
                  )}
                </td>
                <td className="text-gray-500">{r.display_order}</td>
                <td>{r.is_active ? <span className="badge badge-green">Active</span> : <span className="badge badge-gray">Inactive</span>}</td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(r)} className="p-1.5 hover:bg-blue-50 rounded text-blue-600" title="Edit"><Edit size={14} /></button>
                    <button onClick={() => { if (confirm(`Delete "${r.text}"?`)) deleteMutation.mutate(r.id) }} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 size={14} /></button>
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
