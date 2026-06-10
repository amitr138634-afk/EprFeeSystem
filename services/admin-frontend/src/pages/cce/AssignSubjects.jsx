import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Loader2, AlertTriangle, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { academicsApi, studentApi, timetableApi, staffApi } from '../../services/api'

function DeleteConfirm({ label, onConfirm, onCancel, isPending }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
      <AlertTriangle size={14} className="text-red-500 shrink-0" />
      <span className="text-xs text-red-700">Remove <strong>{label}</strong>?</span>
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

function AllocationRow({ alloc, subjects, staff }) {
  const qc = useQueryClient()
  const [confirming, setConfirming] = useState(false)

  const subject = subjects.find(s => s.id === (alloc.subject_id ?? alloc.subject))
  const teacher = staff.find(t => t.id === (alloc.teacher_id ?? alloc.teacher))

  const deleteMut = useMutation({
    mutationFn: () => academicsApi.deleteSubjectAllocation(alloc.id),
    onSuccess: () => { qc.invalidateQueries(['subject-allocations']); toast.success('Subject removed') },
    onError: () => toast.error('Failed to remove subject'),
  })

  return (
    <tr className="hover:bg-gray-50 group">
      <td className="px-4 py-3 text-sm font-medium text-gray-800">
        {subject?.name ?? alloc.subject_name ?? '—'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {teacher
          ? `${teacher.first_name ?? ''} ${teacher.last_name ?? ''}`.trim() || teacher.name
          : alloc.teacher_name ?? '—'}
      </td>
      <td className="px-4 py-3">
        {confirming ? (
          <DeleteConfirm
            label={subject?.name ?? 'this subject'}
            onConfirm={() => deleteMut.mutate()}
            onCancel={() => setConfirming(false)}
            isPending={deleteMut.isPending}
          />
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="p-1.5 hover:bg-red-50 rounded text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remove"
          >
            <Trash2 size={14} />
          </button>
        )}
      </td>
    </tr>
  )
}

function AddSubjectForm({ classId, sectionId, existingSubjectIds, subjects, staff }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ subject_id: '', teacher_id: '' })

  const availableSubjects = subjects.filter(s => !existingSubjectIds.includes(s.id))

  const createMut = useMutation({
    mutationFn: () => academicsApi.createSubjectAllocation({
      class_id: Number(classId),
      section_id: Number(sectionId),
      subject_id: Number(form.subject_id),
      teacher_id: Number(form.teacher_id),
    }),
    onSuccess: () => { qc.invalidateQueries(['subject-allocations']); setForm({ subject_id: '', teacher_id: '' }); toast.success('Subject assigned') },
    onError: (err) => toast.error(err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Failed to assign subject'),
  })

  const valid = form.subject_id && form.teacher_id

  return (
    <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50">
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Assign New Subject</p>
      <div className="flex items-end gap-3 flex-wrap">
        <div className="min-w-[200px]">
          <label className="form-label">Subject</label>
          <select
            className="form-select"
            value={form.subject_id}
            onChange={e => setForm(p => ({ ...p, subject_id: e.target.value }))}
          >
            <option value="">Select Subject</option>
            {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="min-w-[200px]">
          <label className="form-label">Teacher</label>
          <select
            className="form-select"
            value={form.teacher_id}
            onChange={e => setForm(p => ({ ...p, teacher_id: e.target.value }))}
          >
            <option value="">Select Teacher</option>
            {staff.map(t => (
              <option key={t.id} value={t.id}>
                {`${t.first_name ?? ''} ${t.last_name ?? ''}`.trim() || t.name || `Staff #${t.id}`}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => createMut.mutate()}
          disabled={!valid || createMut.isPending}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          {createMut.isPending ? <><Loader2 size={14} className="animate-spin" /> Assigning…</> : <><Plus size={14} /> Assign</>}
        </button>
      </div>
      {availableSubjects.length === 0 && (
        <p className="text-xs text-gray-400 mt-2">All available subjects have been assigned to this section.</p>
      )}
    </div>
  )
}

export default function AssignSubjects() {
  const [filters, setFilters] = useState({ class_id: '', section_id: '' })

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => studentApi.classes().then(r => r.data.results ?? r.data),
  })

  const { data: sections = [] } = useQuery({
    queryKey: ['sections', filters.class_id],
    queryFn: () => studentApi.sections({ class_id: filters.class_id }).then(r => r.data.results ?? r.data),
    enabled: !!filters.class_id,
  })

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => timetableApi.subjects().then(r => r.data.results ?? r.data),
  })

  const { data: staff = [] } = useQuery({
    queryKey: ['staff-list'],
    queryFn: () => staffApi.list().then(r => r.data.results ?? r.data),
  })

  const allSelected = filters.class_id && filters.section_id

  const { data: allocations = [], isLoading } = useQuery({
    queryKey: ['subject-allocations', filters.class_id, filters.section_id],
    queryFn: () => academicsApi.subjectAllocations({ class_id: filters.class_id, section_id: filters.section_id }).then(r => r.data.results ?? r.data),
    enabled: !!allSelected,
  })

  const existingSubjectIds = allocations.map(a => a.subject_id ?? a.subject)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Assign Subjects</h1>
        <p className="page-sub">Assign subjects and their teachers to a class section.</p>
      </div>

      {/* Filters */}
      <div className="card p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Class</label>
            <select
              className="form-select"
              value={filters.class_id}
              onChange={e => setFilters(p => ({ ...p, class_id: e.target.value, section_id: '' }))}
            >
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Section</label>
            <select
              className="form-select"
              value={filters.section_id}
              onChange={e => setFilters(p => ({ ...p, section_id: e.target.value }))}
              disabled={!filters.class_id}
            >
              <option value="">Select Section</option>
              {sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Allocations */}
      {!allSelected ? (
        <div className="card p-12 text-center">
          <BookOpen size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Select a class and section to manage subject assignments.</p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">
              {allocations.length} subject{allocations.length !== 1 ? 's' : ''} assigned
            </p>
          </div>

          {allocations.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              No subjects assigned to this section yet. Use the form below to add subjects.
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Teacher</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allocations.map(alloc => (
                    <AllocationRow
                      key={alloc.id}
                      alloc={alloc}
                      subjects={subjects}
                      staff={staff}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <AddSubjectForm
            classId={filters.class_id}
            sectionId={filters.section_id}
            existingSubjectIds={existingSubjectIds}
            subjects={subjects}
            staff={staff}
          />
        </div>
      )}
    </div>
  )
}
