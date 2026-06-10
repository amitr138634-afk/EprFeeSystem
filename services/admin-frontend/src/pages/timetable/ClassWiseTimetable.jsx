import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { timetableApi, studentApi, staffApi } from '../../services/api'

const DAYS = [
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
]

const EMPTY_CELL_FORM = { subject_id: '', teacher_id: '' }

export default function ClassWiseTimetable() {
  const qc = useQueryClient()
  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [cellModal, setCellModal] = useState(null) // { period_id, day }
  const [cellForm, setCellForm] = useState(EMPTY_CELL_FORM)

  // Data queries
  const { data: classes = [] } = useQuery({
    queryKey: ['student-classes'],
    queryFn: () => studentApi.classes().then(r => r.data),
  })

  const { data: sections = [] } = useQuery({
    queryKey: ['student-sections', classId],
    queryFn: () => studentApi.sections({ class_id: classId }).then(r => r.data),
    enabled: !!classId,
  })

  const { data: periods = [] } = useQuery({
    queryKey: ['timetable-periods'],
    queryFn: () => timetableApi.periods().then(r => r.data),
  })

  const { data: subjects = [] } = useQuery({
    queryKey: ['timetable-subjects'],
    queryFn: () => timetableApi.subjects().then(r => r.data),
  })

  const { data: staffData } = useQuery({
    queryKey: ['staff-all'],
    queryFn: () => staffApi.list({ page_size: 500 }).then(r => r.data),
  })
  const teachers = (staffData?.results || staffData || []).filter(s => s.staff_type === 'teaching' || !s.staff_type)

  const { data: timetable = [], isLoading: ttLoading } = useQuery({
    queryKey: ['timetable-class', classId, sectionId],
    queryFn: () => timetableApi.list({ class_id: classId, section_id: sectionId }).then(r => r.data),
    enabled: !!classId && !!sectionId,
  })

  const createMutation = useMutation({
    mutationFn: (data) => timetableApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries(['timetable-class', classId, sectionId])
      toast.success('Entry added')
      setCellModal(null)
      setCellForm(EMPTY_CELL_FORM)
    },
    onError: () => toast.error('Failed to add entry'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => timetableApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries(['timetable-class', classId, sectionId])
      toast.success('Entry removed')
    },
    onError: () => toast.error('Failed to remove entry'),
  })

  // Build lookup: {period_id}_{day} -> entry
  const cellMap = {}
  timetable.forEach(entry => {
    cellMap[`${entry.period_id}_${entry.day}`] = entry
  })

  const sortedPeriods = [...periods].sort((a, b) => (a.order ?? 999) - (b.order ?? 999))

  function openAddModal(period_id, day) {
    setCellModal({ period_id, day })
    setCellForm(EMPTY_CELL_FORM)
  }

  function handleAddEntry(e) {
    e.preventDefault()
    if (!cellForm.subject_id) { toast.error('Select a subject'); return }
    createMutation.mutate({
      class_id: parseInt(classId),
      section_id: parseInt(sectionId),
      day: cellModal.day,
      period_id: cellModal.period_id,
      subject_id: parseInt(cellForm.subject_id),
      teacher_id: cellForm.teacher_id ? parseInt(cellForm.teacher_id) : undefined,
    })
  }

  const classesList = classes?.results || classes || []
  const sectionsList = sections?.results || sections || []

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-800">Class Wise Timetable</h1>
        <p className="text-sm text-gray-500">View and manage timetable by class and section</p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="form-label">Class</label>
            <select
              className="form-select w-44"
              value={classId}
              onChange={e => { setClassId(e.target.value); setSectionId('') }}
            >
              <option value="">Select Class</option>
              {classesList.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Section</label>
            <select
              className="form-select w-44"
              value={sectionId}
              onChange={e => setSectionId(e.target.value)}
              disabled={!classId}
            >
              <option value="">Select Section</option>
              {sectionsList.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      {classId && sectionId ? (
        <div className="card">
          {ttLoading ? (
            <div className="p-8 text-center text-gray-400">Loading timetable...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-3 py-2 text-left text-gray-600 font-semibold w-28">Period</th>
                    {DAYS.map(d => (
                      <th key={d.value} className="border border-gray-200 px-3 py-2 text-center text-gray-600 font-semibold min-w-[130px]">
                        {d.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedPeriods.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="border border-gray-200 text-center py-6 text-gray-400">
                        No periods defined. Set up periods in Period Master first.
                      </td>
                    </tr>
                  ) : (
                    sortedPeriods.map(period => (
                      <tr key={period.id} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-3 py-2 font-medium text-gray-700 bg-gray-50">
                          <div className="font-semibold">{period.name}</div>
                          {period.start_time && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              {period.start_time?.slice(0,5)} – {period.end_time?.slice(0,5)}
                            </div>
                          )}
                        </td>
                        {DAYS.map(day => {
                          const entry = cellMap[`${period.id}_${day.value}`]
                          return (
                            <td key={day.value} className="border border-gray-200 px-2 py-2 text-center">
                              {entry ? (
                                <div className="relative group">
                                  <div className="bg-blue-50 rounded p-1.5 text-left">
                                    <div className="font-medium text-blue-800 text-xs leading-tight">
                                      {entry.subject_name || entry.subject?.name || '—'}
                                    </div>
                                    {(entry.teacher_name || entry.teacher?.full_name) && (
                                      <div className="text-gray-500 text-xs mt-0.5 truncate">
                                        {entry.teacher_name || entry.teacher?.full_name}
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    className="absolute -top-1.5 -right-1.5 hidden group-hover:flex items-center justify-center w-4 h-4 bg-red-500 rounded-full text-white"
                                    onClick={() => {
                                      if (window.confirm('Remove this entry?')) deleteMutation.mutate(entry.id)
                                    }}
                                    title="Remove"
                                  >
                                    <X size={9} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  className="w-full h-full flex items-center justify-center text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded py-2 transition-colors"
                                  onClick={() => openAddModal(period.id, day.value)}
                                  title="Add entry"
                                >
                                  <Plus size={16} />
                                </button>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="card p-10 text-center text-gray-400">
          Select a class and section to view the timetable
        </div>
      )}

      {/* Add Entry Modal */}
      {cellModal && (
        <div className="modal-overlay" onClick={() => setCellModal(null)}>
          <div className="modal-box max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Timetable Entry</h2>
              <button onClick={() => setCellModal(null)} className="p-1 hover:bg-gray-100 rounded">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddEntry}>
              <div className="modal-body space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-3">
                    <span className="font-medium">{DAYS.find(d => d.value === cellModal.day)?.label}</span>
                    {' · '}
                    <span className="font-medium">{sortedPeriods.find(p => p.id === cellModal.period_id)?.name}</span>
                  </p>
                </div>
                <div>
                  <label className="form-label">Subject <span className="text-red-500">*</span></label>
                  <select
                    className="form-select"
                    value={cellForm.subject_id}
                    onChange={e => setCellForm(f => ({ ...f, subject_id: e.target.value }))}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Teacher</label>
                  <select
                    className="form-select"
                    value={cellForm.teacher_id}
                    onChange={e => setCellForm(f => ({ ...f, teacher_id: e.target.value }))}
                  >
                    <option value="">Select Teacher (optional)</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.full_name || `${t.first_name} ${t.last_name}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setCellModal(null)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary">Add Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
