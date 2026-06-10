import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, Check, X, Loader2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { studentApi } from '../../services/api'

/* ── Inline editable text ─────────────────────────────────────────────── */
function InlineEdit({ value, onSave, onCancel }) {
  const [val, setVal] = useState(value)
  return (
    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
      <input
        autoFocus
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onSave(val); if (e.key === 'Escape') onCancel() }}
        className="border border-blue-400 rounded px-2 py-0.5 text-sm w-32 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button onClick={() => onSave(val)} className="p-1 hover:bg-green-100 rounded text-green-600"><Check size={13} /></button>
      <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded text-gray-400"><X size={13} /></button>
    </div>
  )
}

/* ── Delete confirm ───────────────────────────────────────────────────── */
function DeleteConfirm({ label, onConfirm, onCancel, isPending }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5" onClick={e => e.stopPropagation()}>
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

/* ── Section row ──────────────────────────────────────────────────────── */
function SectionRow({ section, classId }) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const updateMut = useMutation({
    mutationFn: (name) => studentApi.updateSection(section.id, { name, class_ref: classId }),
    onSuccess: () => { qc.invalidateQueries(['classes']); setEditing(false) },
    onError: () => toast.error('Failed to update section'),
  })
  const deleteMut = useMutation({
    mutationFn: () => studentApi.deleteSection(section.id),
    onSuccess: () => { qc.invalidateQueries(['classes']); toast.success('Section deleted') },
    onError: () => toast.error('Failed to delete section'),
  })

  return (
    <div className="flex items-center justify-between py-1.5 px-3 hover:bg-gray-50 rounded-lg group">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
        {editing
          ? <InlineEdit value={section.name} onSave={updateMut.mutate} onCancel={() => setEditing(false)} />
          : <span className="text-sm text-gray-700">Section {section.name}</span>
        }
      </div>
      {!editing && !confirming && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)} className="p-1 hover:bg-blue-50 rounded text-blue-500"><Edit2 size={13} /></button>
          <button onClick={() => setConfirming(true)} className="p-1 hover:bg-red-50 rounded text-red-400"><Trash2 size={13} /></button>
        </div>
      )}
      {confirming && (
        <DeleteConfirm
          label={`Section ${section.name}`}
          onConfirm={() => deleteMut.mutate()}
          onCancel={() => setConfirming(false)}
          isPending={deleteMut.isPending}
        />
      )}
    </div>
  )
}

/* ── Add section inline form ──────────────────────────────────────────── */
function AddSectionForm({ classId, onDone }) {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const createMut = useMutation({
    mutationFn: () => studentApi.createSection({ name: name.trim(), class_ref: classId }),
    onSuccess: () => { qc.invalidateQueries(['classes']); setName(''); onDone?.() },
    onError: (err) => toast.error(err.response?.data?.name?.[0] || 'Failed to add section'),
  })
  return (
    <div className="flex items-center gap-2 mt-2 px-3">
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && name.trim()) createMut.mutate(); if (e.key === 'Escape') onDone?.() }}
        placeholder="Section name  e.g. A"
        className="border border-blue-300 rounded-lg px-2 py-1.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <button
        onClick={() => createMut.mutate()}
        disabled={!name.trim() || createMut.isPending}
        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {createMut.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Add
      </button>
      <button onClick={onDone} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={14} /></button>
    </div>
  )
}

/* ── Class card ───────────────────────────────────────────────────────── */
function ClassCard({ cls }) {
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [editingOrder, setEditingOrder] = useState(false)
  const [addingSection, setAddingSection] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const updateMut = useMutation({
    mutationFn: (data) => studentApi.updateClass(cls.id, data),
    onSuccess: () => { qc.invalidateQueries(['classes']); setEditingName(false); setEditingOrder(false) },
    onError: () => toast.error('Failed to update class'),
  })
  const deleteMut = useMutation({
    mutationFn: () => studentApi.deleteClass(cls.id),
    onSuccess: () => { qc.invalidateQueries(['classes']); toast.success('Class deleted') },
    onError: () => toast.error('Cannot delete — students may be assigned to this class'),
  })

  const sections = cls.sections || []

  return (
    <div className="card overflow-hidden">
      {/* Class header row */}
      <div
        className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => !editingName && !editingOrder && !confirming && setExpanded(v => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {expanded
            ? <ChevronDown size={16} className="text-gray-400 shrink-0" />
            : <ChevronRight size={16} className="text-gray-400 shrink-0" />
          }
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
            {cls.order || '—'}
          </div>
          {editingName
            ? <InlineEdit value={cls.name} onSave={(name) => updateMut.mutate({ name })} onCancel={() => setEditingName(false)} />
            : <span className="font-semibold text-gray-800 text-sm">{cls.name}</span>
          }
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {sections.length} section{sections.length !== 1 ? 's' : ''}
          </span>

          {!editingName && !confirming && (
            <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
              <button onClick={() => setEditingName(true)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500" title="Rename class"><Edit2 size={14} /></button>
              <button onClick={() => setConfirming(true)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400" title="Delete class"><Trash2 size={14} /></button>
            </div>
          )}
          {confirming && (
            <div onClick={e => e.stopPropagation()}>
              <DeleteConfirm
                label={cls.name}
                onConfirm={() => deleteMut.mutate()}
                onCancel={() => setConfirming(false)}
                isPending={deleteMut.isPending}
              />
            </div>
          )}
        </div>
      </div>

      {/* Sections panel */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50">
          {sections.length === 0 && !addingSection && (
            <p className="text-xs text-gray-400 text-center py-2">No sections yet — add one below</p>
          )}
          <div className="space-y-0.5">
            {sections.map(sec => (
              <SectionRow key={sec.id} section={sec} classId={cls.id} />
            ))}
          </div>

          {addingSection
            ? <AddSectionForm classId={cls.id} onDone={() => setAddingSection(false)} />
            : (
              <button
                onClick={() => setAddingSection(true)}
                className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Plus size={13} /> Add Section
              </button>
            )
          }
        </div>
      )}
    </div>
  )
}

/* ── Add Class Form ───────────────────────────────────────────────────── */
function AddClassForm({ onDone }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', order: '' })

  const createMut = useMutation({
    mutationFn: () => studentApi.createClass({ name: form.name.trim(), order: parseInt(form.order) || 0 }),
    onSuccess: () => { qc.invalidateQueries(['classes']); setForm({ name: '', order: '' }); onDone?.() },
    onError: (err) => toast.error(err.response?.data?.name?.[0] || 'Failed to create class'),
  })

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Add New Class</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">Class Name <span className="text-red-500">*</span></label>
          <input
            autoFocus
            className="form-input"
            placeholder="e.g. Class 1"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && form.name.trim() && createMut.mutate()}
          />
        </div>
        <div>
          <label className="form-label">Order (sort position)</label>
          <input
            type="number"
            className="form-input"
            placeholder="e.g. 1"
            value={form.order}
            onChange={e => setForm(p => ({ ...p, order: e.target.value }))}
          />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => createMut.mutate()}
          disabled={!form.name.trim() || createMut.isPending}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          {createMut.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Plus size={14} /> Add Class</>}
        </button>
        <button onClick={onDone} className="btn-secondary">Cancel</button>
      </div>
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────────────────────── */
export default function ClassMaster() {
  const [showForm, setShowForm] = useState(false)

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: () => studentApi.classes().then(r => r.data.results || r.data),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Class &amp; Section Master</h1>
          <p className="text-sm text-gray-500">Set up classes and sections before adding students</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Class
        </button>
      </div>

      {showForm && <AddClassForm onDone={() => setShowForm(false)} />}

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      )}

      {!isLoading && classes.length === 0 && !showForm && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Plus size={28} className="text-blue-500" />
          </div>
          <h3 className="font-semibold text-gray-700 mb-1">No classes yet</h3>
          <p className="text-sm text-gray-400 mb-4">Add your school's classes (e.g. Class 1, Class 2 …) and their sections here first.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus size={14} /> Add First Class
          </button>
        </div>
      )}

      <div className="space-y-2">
        {classes.map(cls => <ClassCard key={cls.id} cls={cls} />)}
      </div>
    </div>
  )
}
