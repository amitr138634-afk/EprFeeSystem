import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Loader2, ClipboardList, AlertTriangle, Check, X as XIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { academicsApi, studentsApi } from '../../services/api'

const listOf = (r) => r.data.results || r.data
const cellKey = (kind, id) => `${kind}_${id}`

export default function EnterMarks() {
  const [mode, setMode] = useState('view') // 'view' | 'edit' — page loads in View Mode by default
  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [testId, setTestId] = useState('')
  const [type, setType] = useState('') // 'scholastic' | 'co_scholastic'
  const [selectedSubjects, setSelectedSubjects] = useState([]) // [{id, kind, name, evaluation_mode, max_marks}]

  const [grid, setGrid] = useState(null) // {columns, students, grades_direct}
  const [cells, setCells] = useState({}) // `${student_id}:${kind}_${id}` -> {marks_obtained, grade}
  const [cellStatus, setCellStatus] = useState({}) // same key -> 'saving' | 'saved' | 'error'
  const [remarkCells, setRemarkCells] = useState({}) // student_id -> remark_id

  /* ── Dropdown chain ───────────────────────────────────────────────────── */
  const { data: classes = [] } = useQuery({
    queryKey: ['classMasters'],
    queryFn: () => studentsApi.classMasters().then(listOf),
  })
  const { data: sections = [] } = useQuery({
    queryKey: ['sectionMasters', classId],
    queryFn: () => studentsApi.sectionMasters({ class_id: classId }).then(listOf),
    enabled: !!classId,
  })
  const { data: tests = [] } = useQuery({
    queryKey: ['marksFeedingTests', classId, sectionId],
    queryFn: () => academicsApi.marksFeedingTests({ class_id: classId, section_id: sectionId }).then(r => r.data),
    enabled: !!(classId && sectionId),
  })
  const { data: subjectOptions = [] } = useQuery({
    queryKey: ['marksFeedingSubjects', classId, sectionId, testId, type],
    queryFn: () => academicsApi.marksFeedingSubjects({ class_id: classId, section_id: sectionId, test_id: testId, type }).then(r => r.data),
    enabled: !!(classId && sectionId && testId && (type === 'scholastic' || type === 'co_scholastic')),
  })
  // Remark dropdown options — only remarks mapped to this class + section.
  const { data: remarkOptions = [] } = useQuery({
    queryKey: ['marksFeedingRemarks', classId, sectionId],
    queryFn: () => academicsApi.marksFeedingRemarks({ class_id: classId, section_id: sectionId }).then(r => r.data),
    enabled: !!(classId && sectionId),
  })

  // Each dropdown resets everything below it.
  const onClassChange = (v) => { setClassId(v); setSectionId(''); setTestId(''); setType(''); setSelectedSubjects([]); setGrid(null) }
  const onSectionChange = (v) => { setSectionId(v); setTestId(''); setType(''); setSelectedSubjects([]); setGrid(null) }
  const onTestChange = (v) => { setTestId(v); setType(''); setSelectedSubjects([]); setGrid(null) }
  const onTypeChange = (v) => { setType(v); setSelectedSubjects([]); setGrid(null) }

  const toggleSubject = (opt) => {
    setSelectedSubjects(prev => {
      const exists = prev.some(s => s.kind === opt.kind && s.id === opt.id)
      return exists ? prev.filter(s => !(s.kind === opt.kind && s.id === opt.id)) : [...prev, opt]
    })
    setGrid(null)
  }
  const toggleSelectAll = () => {
    setSelectedSubjects(prev => prev.length === subjectOptions.length ? [] : [...subjectOptions])
    setGrid(null)
  }

  // General Info needs no subject selection — class/section/test/type is enough.
  const allSelected = classId && sectionId && testId && type &&
    (type === 'general_info' || selectedSubjects.length > 0)

  /* ── Load grid ────────────────────────────────────────────────────────── */
  const loadGridMut = useMutation({
    mutationFn: () => {
      const subject_ids = selectedSubjects.filter(s => s.kind === 'subject').map(s => s.id).join(',')
      const co_scholastic_ids = selectedSubjects.filter(s => s.kind === 'co_scholastic').map(s => s.id).join(',')
      return academicsApi.marksFeedingGrid({ class_id: classId, section_id: sectionId, test_id: testId, subject_ids, co_scholastic_ids, type }).then(r => r.data)
    },
    onSuccess: (data) => {
      setGrid(data)
      setMode('view') // every freshly loaded sheet opens in View Mode
      const initial = {}
      const initialRemarks = {}
      data.students.forEach(s => {
        Object.entries(s.marks).forEach(([key, val]) => {
          initial[`${s.student_id}:${key}`] = val
        })
        if (s.remark_id != null) initialRemarks[s.student_id] = s.remark_id
      })
      setCells(initial)
      setRemarkCells(initialRemarks)
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to load grid'),
  })

  const setCell = (studentId, kind, id, field, value) => {
    const k = `${studentId}:${cellKey(kind, id)}`
    setCells(prev => ({ ...prev, [k]: { ...(prev[k] || {}), [field]: value } }))
  }

  /* ── Auto-save one cell on blur/select — no separate Save button ───────── */
  const saveCellMut = useMutation({
    mutationFn: ({ studentId, kind, id, marksObtained, grade }) =>
      academicsApi.saveMarksFeedingGrid({
        class_id: classId, section_id: sectionId, test_id: testId,
        entries: [{
          student_id: studentId, kind, ref_id: id,
          marks_obtained: marksObtained === '' || marksObtained === undefined ? null : marksObtained,
          grade: grade || null,
        }],
      }),
    onMutate: ({ studentId, kind, id }) => {
      const k = `${studentId}:${cellKey(kind, id)}`
      setCellStatus(prev => ({ ...prev, [k]: 'saving' }))
    },
    onSuccess: (res, { studentId, kind, id }) => {
      const k = `${studentId}:${cellKey(kind, id)}`
      setCellStatus(prev => ({ ...prev, [k]: 'saved' }))
      if (res.data.warnings?.length) {
        res.data.warnings.forEach(w => toast(w, { icon: '⚠️', duration: 6000 }))
      }
    },
    onError: (err, { studentId, kind, id }) => {
      const k = `${studentId}:${cellKey(kind, id)}`
      setCellStatus(prev => ({ ...prev, [k]: 'error' }))
      const errors = err.response?.data?.errors
      toast.error(errors ? errors.join(' • ') : (err.response?.data?.detail || 'Failed to save'))
    },
  })

  const saveCell = (studentId, kind, id) => {
    const k = `${studentId}:${cellKey(kind, id)}`
    const cell = cells[k] || {}
    saveCellMut.mutate({ studentId, kind, id, marksObtained: cell.marks_obtained, grade: cell.grade })
  }

  /* ── Auto-save the per-student remark selection ───────────────────────── */
  const saveRemarkMut = useMutation({
    mutationFn: ({ studentId, remarkId }) =>
      academicsApi.saveMarksFeedingGrid({
        class_id: classId, section_id: sectionId, test_id: testId,
        student_remarks: [{ student_id: studentId, remark_id: remarkId || null }],
      }),
    onMutate: ({ studentId }) => setCellStatus(prev => ({ ...prev, [`${studentId}:remark`]: 'saving' })),
    onSuccess: (res, { studentId }) => setCellStatus(prev => ({ ...prev, [`${studentId}:remark`]: 'saved' })),
    onError: (err, { studentId }) => {
      setCellStatus(prev => ({ ...prev, [`${studentId}:remark`]: 'error' }))
      toast.error(err.response?.data?.detail || 'Failed to save remark')
    },
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Marks Feeding</h1>
        <p className="page-sub">Configuration comes entirely from Assign Subject & Test — pick class, section, test, type and subjects to load the sheet.</p>
      </div>

      {/* 5 dependency dropdowns */}
      <div className="card p-5">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <label className="form-label">Class</label>
            <select className="form-select" value={classId} onChange={e => onClassChange(e.target.value)}>
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Section</label>
            <select className="form-select" value={sectionId} onChange={e => onSectionChange(e.target.value)} disabled={!classId}>
              <option value="">Select Section</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.section_name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Test</label>
            <select className="form-select" value={testId} onChange={e => onTestChange(e.target.value)} disabled={!sectionId}>
              <option value="">Select Test</option>
              {tests.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Type</label>
            <select className="form-select" value={type} onChange={e => onTypeChange(e.target.value)} disabled={!testId}>
              <option value="">Select Type</option>
              <option value="scholastic">Scholastic</option>
              <option value="co_scholastic">Co-Scholastic</option>
              <option value="general_info">General Info</option>
            </select>
          </div>
        </div>

        {type === 'general_info' && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-400">General Info captures only the per-student remark — no subjects to select. Click Submit to load the sheet.</p>
          </div>
        )}

        {(type === 'scholastic' || type === 'co_scholastic') && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <label className="form-label mb-0">Subjects</label>
              {subjectOptions.length > 0 && (
                <button onClick={toggleSelectAll} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                  {selectedSubjects.length === subjectOptions.length ? 'Clear All' : 'Select All'}
                </button>
              )}
            </div>
            {subjectOptions.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">No {type === 'scholastic' ? 'scholastic' : 'co-scholastic'} subjects configured for this class/section/test in Assign Subject & Test.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {subjectOptions.map(opt => {
                  const checked = selectedSubjects.some(s => s.kind === opt.kind && s.id === opt.id)
                  return (
                    <label
                      key={`${opt.kind}-${opt.id}`}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm cursor-pointer ${
                        checked ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <input type="checkbox" className="hidden" checked={checked} onChange={() => toggleSubject(opt)} />
                      {opt.name}
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={() => loadGridMut.mutate()}
            disabled={!allSelected || loadGridMut.isPending}
            className="btn-primary"
          >
            {loadGridMut.isPending ? <><Loader2 size={14} className="animate-spin" /> Loading...</> : 'Submit'}
          </button>
        </div>
      </div>

      {/* Grid */}
      {!grid && !loadGridMut.isPending && (
        <div className="card p-12 text-center">
          <ClipboardList size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Select all 5 filters above and click Submit to load the marks sheet.</p>
        </div>
      )}

      {grid && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-end gap-3 px-5 py-4 border-b border-gray-100">
            <span className="text-xs text-gray-400">
              {mode === 'view' ? 'Viewing read-only — switch to Edit Mode to make changes' : 'Marks save automatically as you fill each cell'}
            </span>
            <select
              value={mode}
              onChange={e => setMode(e.target.value)}
              className="form-input py-1 text-xs w-32"
            >
              <option value="view">View Mode</option>
              <option value="edit">Edit Mode</option>
            </select>
          </div>

          {grid.students.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400 flex flex-col items-center gap-2">
              <AlertTriangle size={28} className="text-yellow-400" />
              No active students found for this class/section.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="sticky left-0 z-20 bg-gray-50 px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Sr No</th>
                    <th className="sticky left-[50px] z-20 bg-gray-50 px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Admission No</th>
                    <th className="sticky left-[170px] z-20 bg-gray-50 px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Student Name</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Class</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Section</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Roll No</th>
                    {grid.columns.map(col => (
                      <th key={`${col.kind}-${col.id}`} className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">
                        {col.name}
                        {col.max_marks != null && <span className="block text-gray-400 font-normal">/ {col.max_marks}</span>}
                      </th>
                    ))}
                    {type === 'general_info' && (
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Remark</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {grid.students.map((s, idx) => (
                    <tr key={s.student_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="sticky left-0 z-10 bg-white px-3 py-2 text-gray-500">{idx + 1}</td>
                      <td className="sticky left-[50px] z-10 bg-white px-3 py-2 font-mono text-gray-700 whitespace-nowrap">{s.admission_no}</td>
                      <td className="sticky left-[170px] z-10 bg-white px-3 py-2 font-medium text-gray-900 whitespace-nowrap">{s.student_name}</td>
                      <td className="px-3 py-2 text-gray-600">{s.class_name}</td>
                      <td className="px-3 py-2 text-gray-600">{s.section_name}</td>
                      <td className="px-3 py-2 text-gray-600">{s.roll_no || '—'}</td>
                      {grid.columns.map(col => {
                        const k = `${s.student_id}:${cellKey(col.kind, col.id)}`
                        const cell = cells[k] || {}
                        return (
                          <td key={`${col.kind}-${col.id}`} className="px-3 py-2 text-center">
                            {mode === 'view' ? (
                              <span className="text-gray-700">
                                {col.evaluation_mode === 'direct' ? (cell.grade || '—') : (cell.marks_obtained ?? '—')}
                              </span>
                            ) : (
                              <div className="relative inline-block">
                                {col.evaluation_mode === 'direct' ? (
                                  <select
                                    className="form-input py-1 text-xs w-20 mx-auto"
                                    value={cell.grade || ''}
                                    onChange={e => {
                                      setCell(s.student_id, col.kind, col.id, 'grade', e.target.value)
                                      saveCellMut.mutate({ studentId: s.student_id, kind: col.kind, id: col.id, marksObtained: cell.marks_obtained, grade: e.target.value })
                                    }}
                                  >
                                    <option value="">—</option>
                                    {grid.grades_direct.map(g => <option key={g.id} value={g.grade_label}>{g.grade_label}</option>)}
                                  </select>
                                ) : (
                                  <input
                                    type="number"
                                    min="0"
                                    max={col.max_marks ?? undefined}
                                    step="0.01"
                                    className="form-input py-1 text-xs w-20 text-center mx-auto"
                                    value={cell.marks_obtained ?? ''}
                                    onChange={e => setCell(s.student_id, col.kind, col.id, 'marks_obtained', e.target.value === '' ? '' : Number(e.target.value))}
                                    onBlur={() => saveCell(s.student_id, col.kind, col.id)}
                                    placeholder="—"
                                  />
                                )}
                                {cellStatus[k] === 'saving' && <Loader2 size={11} className="absolute -right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
                                {cellStatus[k] === 'saved' && <Check size={11} className="absolute -right-3 top-1/2 -translate-y-1/2 text-green-500" />}
                                {cellStatus[k] === 'error' && <XIcon size={11} className="absolute -right-3 top-1/2 -translate-y-1/2 text-red-500" />}
                              </div>
                            )}
                          </td>
                        )
                      })}
                      {/* Remark dropdown — General Info only; saved per student, per test */}
                      {type === 'general_info' && (
                        <td className="px-3 py-2 text-center">
                          {mode === 'view' ? (
                            <span className="text-gray-700">
                              {remarkOptions.find(r => r.id === remarkCells[s.student_id])?.text || '—'}
                            </span>
                          ) : (() => {
                            const rk = `${s.student_id}:remark`
                            return (
                              <div className="relative inline-block">
                                <select
                                  className="form-input py-1 text-xs w-44"
                                  value={remarkCells[s.student_id] ?? ''}
                                  onChange={e => {
                                    const remarkId = e.target.value ? Number(e.target.value) : ''
                                    setRemarkCells(prev => ({ ...prev, [s.student_id]: remarkId }))
                                    saveRemarkMut.mutate({ studentId: s.student_id, remarkId })
                                  }}
                                >
                                  <option value="">—</option>
                                  {remarkOptions.map(r => <option key={r.id} value={r.id}>{r.text}</option>)}
                                </select>
                                {cellStatus[rk] === 'saving' && <Loader2 size={11} className="absolute -right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
                                {cellStatus[rk] === 'saved' && <Check size={11} className="absolute -right-3 top-1/2 -translate-y-1/2 text-green-500" />}
                                {cellStatus[rk] === 'error' && <XIcon size={11} className="absolute -right-3 top-1/2 -translate-y-1/2 text-red-500" />}
                              </div>
                            )
                          })()}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
