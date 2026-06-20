import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, X, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { academicsApi, studentsApi } from '../../services/api'

const listOf = (r) => r.data.results || r.data
const emptyForm = { name: '', display_order: 0, is_active: true, class_id: '', section_ids: [] }

// Section ids this activity is assigned to, for one specific class.
const sectionsForClass = (activity, classId) =>
  (activity?.assignments || [])
    .filter(asn => String(asn.class_id) === String(classId))
    .map(asn => String(asn.section_id))

export default function CoScholasticSubjectMaster() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['co-scholastic-assignments'],
    queryFn: () => academicsApi.coScholasticAssignments().then(r => r.data),
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
    mutationFn: async () => {
      // 1. Create or update the activity itself.
      let subjectId = editing?.id
      const subjectPayload = { name: form.name.trim(), display_order: Number(form.display_order) || 0, is_active: form.is_active }
      if (editing) {
        await academicsApi.updateCoScholasticSubject(editing.id, subjectPayload)
      } else {
        const res = await academicsApi.createCoScholasticSubject(subjectPayload)
        subjectId = res.data.id
      }
      // 2. If a class is picked, replace that class's assigned sections with
      // exactly what's checked — unchecking a previously-assigned section
      // here removes it.
      if (form.class_id) {
        await academicsApi.saveCoScholasticAssignments({
          subject_id: subjectId, class_id: form.class_id, section_ids: form.section_ids.map(Number),
        })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries(['co-scholastic-assignments'])
      setShowForm(false); setEditing(null); setForm(emptyForm)
      toast.success(editing ? 'Updated!' : 'Activity created!')
    },
    onError: () => toast.error('Failed to save'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => academicsApi.deleteCoScholasticSubject(id),
    onSuccess: () => { qc.invalidateQueries(['co-scholastic-assignments']); toast.success('Deleted!') },
    onError: () => toast.error('Failed to delete'),
  })

  const toggleSection = (id) => {
    const sid = String(id)
    setForm(p => ({ ...p, section_ids: p.section_ids.includes(sid) ? p.section_ids.filter(x => x !== sid) : [...p.section_ids, sid] }))
  }

  // Switching the class while editing re-derives which sections are
  // currently assigned for that class, so the checkboxes reflect reality
  // (and unchecking one removes it on save) instead of always starting empty.
  const changeClass = (classId) => {
    setForm(p => ({ ...p, class_id: classId, section_ids: classId ? sectionsForClass(editing, classId) : [] }))
  }

  const submit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Name is required'); return }
    saveMutation.mutate()
  }

  const openEdit = (a) => {
    const firstClassId = a.assignments[0]?.class_id ? String(a.assignments[0].class_id) : ''
    setEditing(a)
    setForm({
      name: a.name || '', display_order: a.display_order ?? 0, is_active: a.is_active,
      class_id: firstClassId, section_ids: firstClassId ? sectionsForClass(a, firstClassId) : [],
    })
    setShowForm(true)
  }
  const openNew = () => { setEditing(null); setForm(emptyForm); setShowForm(true) }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Co-Scholastic Subject Master</h1>
          <p className="page-sub">Activities like Art, Music, Sports — always graded as Direct Grade.</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Activity</button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{editing ? 'Edit' : 'Add'} Activity</h3>
            <button type="button" onClick={() => setShowForm(false)}><X size={16} className="text-gray-400" /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Class {editing && <span className="text-gray-400 font-normal">(switch to manage a different class's sections)</span>}</label>
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

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div>
              <label className="form-label">Activity Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Art / Music" />
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
            <tr><th>#</th><th>Activity</th><th>Order</th><th>Status</th><th>Assigned To</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td></tr>}
            {!isLoading && activities.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">No activities defined yet</td></tr>}
            {activities.map((a, i) => (
              <tr key={a.id}>
                <td className="text-gray-500">{i + 1}</td>
                <td className="font-medium">{a.name}</td>
                <td className="text-gray-500">{a.display_order}</td>
                <td>{a.is_active ? <span className="badge badge-green">Active</span> : <span className="badge badge-gray">Inactive</span>}</td>
                <td>
                  {a.assignments.length === 0 ? (
                    <span className="text-gray-400 text-xs">Not assigned</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {a.assignments.map(asn => (
                        <span key={`${asn.class_id}-${asn.section_id}`} className="badge-purple">
                          {asn.class_name}-{asn.section_name}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(a)} className="p-1.5 hover:bg-blue-50 rounded text-blue-600" title="Edit (name, order, active, class/sections)"><Edit size={14} /></button>
                    <button onClick={() => { if (confirm(`Delete "${a.name}"? This also removes all its class/section assignments.`)) deleteMutation.mutate(a.id) }} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 size={14} /></button>
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
