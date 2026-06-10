import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserCheck, Plus, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { timetableApi, studentApi, staffApi } from '../../services/api'

const DAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

const EMPTY_FORM = {
  date: todayISO(),
  original_teacher_id: '',
  substitute_teacher_id: '',
  period_id: '',
  class_id: '',
  section_id: '',
  reason: '',
}

export default function SubstituteTeacher() {
  const qc = useQueryClient()
  const [form, setForm] = useState(EMPTY_FORM)
  const [filterDate, setFilterDate] = useState(todayISO())

  // Staff
  const { data: staffData } = useQuery({
    queryKey: ['staff-all'],
    queryFn: () => staffApi.list({ page_size: 500 }).then(r => r.data),
  })
  const allStaff = staffData?.results || staffData || []
  const teachers = allStaff.filter(s => s.staff_type === 'teaching' || !s.staff_type)

  // Periods
  const { data: periods = [] } = useQuery({
    queryKey: ['timetable-periods'],
    queryFn: () => timetableApi.periods().then(r => r.data),
  })

  // Classes
  const { data: classesRaw } = useQuery({
    queryKey: ['student-classes'],
    queryFn: () => studentApi.classes().then(r => r.data),
  })
  const classes = classesRaw?.results || classesRaw || []

  // Sections (dependent on class_id in form)
  const { data: sectionsRaw } = useQuery({
    queryKey: ['student-sections', form.class_id],
    queryFn: () => studentApi.sections({ class_id: form.class_id }).then(r => r.data),
    enabled: !!form.class_id,
  })
  const sections = sectionsRaw?.results || sectionsRaw || []

  // Existing substitutes filtered by date
  const { data: substitutes = [], isLoading: subLoading, refetch } = useQuery({
    queryKey: ['substitutes', filterDate],
    queryFn: () => timetableApi.substitutes({ date: filterDate }).then(r => r.data),
    enabled: !!filterDate,
  })

  const createMutation = useMutation({
    mutationFn: (data) => timetableApi.createSubstitute(data),
    onSuccess: () => {
      qc.invalidateQueries(['substitutes', filterDate])
      toast.success('Substitute assigned successfully')
      setForm(EMPTY_FORM)
    },
    onError: () => toast.error('Failed to assign substitute'),
  })

  function handleSubmit(e) {
    e.preventDefault()
    const { date, original_teacher_id, substitute_teacher_id, period_id } = form
    if (!date || !original_teacher_id || !substitute_teacher_id || !period_id) {
      toast.error('Date, both teachers and period are required')
      return
    }
    if (original_teacher_id === substitute_teacher_id) {
      toast.error('Original and substitute teacher cannot be the same')
      return
    }
    createMutation.mutate({
      date,
      original_teacher_id: parseInt(original_teacher_id),
      substitute_teacher_id: parseInt(substitute_teacher_id),
      period_id: parseInt(period_id),
      class_id: form.class_id ? parseInt(form.class_id) : undefined,
      section_id: form.section_id ? parseInt(form.section_id) : undefined,
      reason: form.reason || undefined,
    })
  }

  function setField(key, value) {
    setForm(f => {
      const next = { ...f, [key]: value }
      if (key === 'class_id') next.section_id = ''
      return next
    })
  }

  const sortedPeriods = [...periods].sort((a, b) => (a.order ?? 999) - (b.order ?? 999))

  function teacherName(t) {
    return t?.full_name || (t ? `${t.first_name} ${t.last_name}` : '—')
  }

  function findTeacher(id) {
    return teachers.find(t => String(t.id) === String(id))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-800">Substitute Teacher</h1>
        <p className="text-sm text-gray-500">Assign substitute teachers for absent staff</p>
      </div>

      {/* Add Substitute Form */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <UserCheck size={18} className="text-blue-500" />
          <h2 className="text-base font-semibold text-gray-700">Assign Substitute</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Date */}
            <div>
              <label className="form-label">Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                className="form-input"
                value={form.date}
                onChange={e => setField('date', e.target.value)}
              />
            </div>

            {/* Original Teacher */}
            <div>
              <label className="form-label">Absent Teacher <span className="text-red-500">*</span></label>
              <select
                className="form-select"
                value={form.original_teacher_id}
                onChange={e => setField('original_teacher_id', e.target.value)}
              >
                <option value="">Select teacher...</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{teacherName(t)}</option>
                ))}
              </select>
            </div>

            {/* Substitute Teacher */}
            <div>
              <label className="form-label">Substitute Teacher <span className="text-red-500">*</span></label>
              <select
                className="form-select"
                value={form.substitute_teacher_id}
                onChange={e => setField('substitute_teacher_id', e.target.value)}
              >
                <option value="">Select substitute...</option>
                {teachers
                  .filter(t => String(t.id) !== String(form.original_teacher_id))
                  .map(t => (
                    <option key={t.id} value={t.id}>{teacherName(t)}</option>
                  ))}
              </select>
            </div>

            {/* Period */}
            <div>
              <label className="form-label">Period <span className="text-red-500">*</span></label>
              <select
                className="form-select"
                value={form.period_id}
                onChange={e => setField('period_id', e.target.value)}
              >
                <option value="">Select period...</option>
                {sortedPeriods.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.start_time ? ` (${p.start_time.slice(0,5)}–${p.end_time?.slice(0,5)})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Class */}
            <div>
              <label className="form-label">Class</label>
              <select
                className="form-select"
                value={form.class_id}
                onChange={e => setField('class_id', e.target.value)}
              >
                <option value="">Select class (optional)</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div>
              <label className="form-label">Section</label>
              <select
                className="form-select"
                value={form.section_id}
                onChange={e => setField('section_id', e.target.value)}
                disabled={!form.class_id}
              >
                <option value="">Select section (optional)</option>
                {sections.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Reason - full width */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="form-label">Reason</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Medical leave, Emergency..."
                value={form.reason}
                onChange={e => setField('reason', e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={16} />
              {createMutation.isPending ? 'Assigning...' : 'Assign Substitute'}
            </button>
          </div>
        </form>
      </div>

      {/* Substitutes List */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">Substitute Assignments</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="form-label mb-0 text-xs">Filter by date:</label>
            <input
              type="date"
              className="form-input py-1 text-sm w-40"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Absent Teacher</th>
                <th>Substitute</th>
                <th>Period</th>
                <th>Class / Section</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {subLoading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : substitutes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    No substitute assignments for{' '}
                    {filterDate ? new Date(filterDate + 'T00:00:00').toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'this date'}
                  </td>
                </tr>
              ) : (
                substitutes.map((s, i) => {
                  const origTeacher = findTeacher(s.original_teacher_id) || s.original_teacher
                  const subTeacher = findTeacher(s.substitute_teacher_id) || s.substitute_teacher
                  const classLabel = s.class_name || s.class?.name || ''
                  const sectionLabel = s.section_name || s.section?.name || ''
                  return (
                    <tr key={s.id}>
                      <td className="text-gray-500">{i + 1}</td>
                      <td className="text-gray-700 font-medium">
                        {new Date(s.date + 'T00:00:00').toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </td>
                      <td>
                        <span className="text-red-600 font-medium">
                          {typeof origTeacher === 'object' ? teacherName(origTeacher) : origTeacher || '—'}
                        </span>
                      </td>
                      <td>
                        <span className="text-green-700 font-medium">
                          {typeof subTeacher === 'object' ? teacherName(subTeacher) : subTeacher || '—'}
                        </span>
                      </td>
                      <td className="text-gray-600">
                        {s.period_name || s.period?.name || `Period ${s.period_id}`}
                      </td>
                      <td className="text-gray-600">
                        {classLabel ? `${classLabel}${sectionLabel ? ` - ${sectionLabel}` : ''}` : (
                          <span className="text-gray-300 italic text-xs">Not specified</span>
                        )}
                      </td>
                      <td className="text-gray-500 text-sm max-w-[200px] truncate" title={s.reason}>
                        {s.reason || <span className="text-gray-300 italic text-xs">—</span>}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
