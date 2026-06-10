import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Check, X, AlertTriangle, PenLine, ToggleLeft, ToggleRight } from 'lucide-react'

const STORAGE_KEY = 'erp_signatures'

function loadSignatures() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveSignatures(sigs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sigs))
}

const EMPTY_FORM = { name: '', designation: '', is_active: true }

function DeleteConfirm({ label, onConfirm, onCancel }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
      <AlertTriangle size={14} className="text-red-500 shrink-0" />
      <span className="text-xs text-red-700">Delete <strong>{label}</strong>?</span>
      <button
        onClick={onConfirm}
        className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded"
      >
        Yes
      </button>
      <button onClick={onCancel} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
    </div>
  )
}

function SignatureRow({ sig, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [form, setForm] = useState({ name: sig.name, designation: sig.designation, is_active: sig.is_active })

  function handleSave() {
    if (!form.name.trim() || !form.designation.trim()) return
    onUpdate(sig.id, form)
    setEditing(false)
  }

  if (editing) {
    return (
      <tr className="bg-blue-50">
        <td className="px-4 py-2">
          <input
            autoFocus
            className="form-input text-sm py-1"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
          />
        </td>
        <td className="px-4 py-2">
          <input
            className="form-input text-sm py-1"
            value={form.designation}
            onChange={e => setForm(p => ({ ...p, designation: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
          />
        </td>
        <td className="px-4 py-2 text-center">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
            className="w-4 h-4 text-blue-600 rounded"
          />
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-1">
            <button
              onClick={handleSave}
              disabled={!form.name.trim() || !form.designation.trim()}
              className="p-1.5 bg-green-100 hover:bg-green-200 rounded text-green-700 disabled:opacity-40"
            >
              <Check size={13} />
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
      <td className="px-4 py-3 text-sm font-medium text-gray-800">{sig.name}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{sig.designation}</td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => onUpdate(sig.id, { ...sig, is_active: !sig.is_active })}
          className="inline-flex items-center gap-1.5 text-xs"
          title="Toggle active"
        >
          {sig.is_active
            ? <><ToggleRight size={20} className="text-green-500" /><span className="badge badge-green">Active</span></>
            : <><ToggleLeft size={20} className="text-gray-400" /><span className="badge badge-gray">Inactive</span></>
          }
        </button>
      </td>
      <td className="px-4 py-3">
        {confirming ? (
          <DeleteConfirm
            label={sig.name}
            onConfirm={() => { onDelete(sig.id); setConfirming(false) }}
            onCancel={() => setConfirming(false)}
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

function AddSignatureForm({ onAdd, onDone }) {
  const [form, setForm] = useState(EMPTY_FORM)

  function handleAdd() {
    if (!form.name.trim() || !form.designation.trim()) return
    onAdd(form)
    setForm(EMPTY_FORM)
  }

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Add Signature</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Name <span className="text-red-500">*</span></label>
          <input
            autoFocus
            className="form-input"
            placeholder="e.g. Rajesh Kumar"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <div>
          <label className="form-label">Designation <span className="text-red-500">*</span></label>
          <input
            className="form-input"
            placeholder="e.g. Principal"
            value={form.designation}
            onChange={e => setForm(p => ({ ...p, designation: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
        </div>
      </div>
      <div className="flex items-center gap-6 mt-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm text-gray-700">Active on report cards</span>
        </label>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleAdd}
          disabled={!form.name.trim() || !form.designation.trim()}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          <Plus size={14} /> Add Signature
        </button>
        <button onClick={onDone} className="btn-secondary">Cancel</button>
      </div>
    </div>
  )
}

export default function SignatureMaster() {
  const [signatures, setSignatures] = useState(loadSignatures)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    saveSignatures(signatures)
  }, [signatures])

  function handleAdd(form) {
    const newSig = { id: Date.now(), ...form }
    setSignatures(prev => [...prev, newSig])
  }

  function handleUpdate(id, data) {
    setSignatures(prev => prev.map(s => s.id === id ? { ...s, ...data } : s))
  }

  function handleDelete(id) {
    setSignatures(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Signature Master</h1>
          <p className="page-sub">Configure signatory names and designations that appear on report cards.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Signature
        </button>
      </div>

      {showForm && <AddSignatureForm onAdd={handleAdd} onDone={() => setShowForm(false)} />}

      <div className="card overflow-hidden">
        {signatures.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <PenLine size={28} className="text-indigo-500" />
            </div>
            <h3 className="font-semibold text-gray-700 mb-1">No signatures configured</h3>
            <p className="text-sm text-gray-400 mb-4">Add signatories like Principal, Class Teacher that appear on report cards.</p>
            <button onClick={() => setShowForm(true)} className="btn-primary inline-flex items-center gap-2">
              <Plus size={14} /> Add First Signature
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Designation</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {signatures.map(sig => (
                  <SignatureRow
                    key={sig.id}
                    sig={sig}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {signatures.length > 0 && (
        <p className="text-xs text-gray-400 px-1">
          Signatures are stored locally in your browser. Only active signatures appear on report cards.
        </p>
      )}
    </div>
  )
}
