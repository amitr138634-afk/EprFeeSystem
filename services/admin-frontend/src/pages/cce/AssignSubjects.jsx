import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Save, BookOpen, ArrowRight, ArrowLeft, Award } from 'lucide-react'
import toast from 'react-hot-toast'
import { academicsApi, studentsApi } from '../../services/api'

const listOf = (r) => (Array.isArray(r.data) ? r.data : r.data.results || r.data.data || [])

const SCHOLASTIC_MODES = [
  { value: 'marks',       label: 'Marks' },
  { value: 'marks_grade', label: 'Marks Based Grade' },
]

export default function AssignSubjects() {
  const navigate = useNavigate()
  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')
  // { [subject_id]: { mode, is_co, cells: { [test_id]: maxMarksString } } }
  const [grid, setGrid] = useState({})

  const { data: classes = [] } = useQuery({
    queryKey: ['classMasters'],
    queryFn: () => studentsApi.classMasters().then(listOf),
  })
  const { data: sections = [] } = useQuery({
    queryKey: ['sectionMasters', classId],
    queryFn: () => studentsApi.sectionMasters({ class_id: classId }).then(listOf),
    enabled: !!classId,
  })

  const selected = classId && sectionId

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['assign-subject-test', classId, sectionId],
    queryFn: () => academicsApi.assignSubjectTest({ class_id: classId, section_id: sectionId }).then(r => r.data),
    enabled: !!selected,
  })

  const subjects = data?.subjects || []
  const tests = data?.tests || []
  const coMaster = data?.co_scholastic_master || []

  useEffect(() => {
    if (!data) return
    const bySubject = {}
    ;(data.assignments || []).forEach(a => { bySubject[a.subject_id] = a })
    const next = {}
    subjects.forEach(s => {
      const a = bySubject[s.id]
      const cells = {}
      tests.forEach(t => {
        const v = a?.cells?.[t.id]
        cells[t.id] = v === null || v === undefined ? '' : String(v)
      })
      next[s.id] = {
        mode: a?.evaluation_mode && a.evaluation_mode !== 'direct' ? a.evaluation_mode : 'marks',
        is_co: !!a?.is_co_scholastic,
        cells,
      }
    })
    setGrid(next)
  }, [data])  // eslint-disable-line react-hooks/exhaustive-deps

  const setMode = (id, mode) =>
    setGrid(prev => ({ ...prev, [id]: { ...prev[id], mode } }))

  const setCell = (id, testId, value) =>
    setGrid(prev => ({ ...prev, [id]: { ...prev[id], cells: { ...prev[id].cells, [testId]: value } } }))

  const moveToCo = (id) =>
    setGrid(prev => ({ ...prev, [id]: { ...prev[id], is_co: true, cells: Object.fromEntries(tests.map(t => [t.id, ''])) } }))

  const moveToScholastic = (id) =>
    setGrid(prev => ({ ...prev, [id]: { ...prev[id], is_co: false, mode: 'marks' } }))

  const saveMutation = useMutation({
    mutationFn: () => academicsApi.saveAssignSubjectTest({
      class_id: classId,
      section_id: sectionId,
      rows: subjects.map(s => {
        const row = grid[s.id] || { mode: 'marks', is_co: false, cells: {} }
        return {
          subject_id: s.id,
          is_co_scholastic: row.is_co,
          evaluation_mode: row.is_co ? 'direct' : row.mode,
          cells: row.is_co ? [] : tests.map(t => ({ test_id: t.id, max_marks: row.cells[t.id] === '' ? null : row.cells[t.id] })),
        }
      }),
    }),
    onSuccess: (r) => toast.success(r.data?.detail || 'Saved!'),
    onError: () => toast.error('Failed to save'),
  })

  const loading = isLoading || isFetching
  const scholastic = subjects.filter(s => !grid[s.id]?.is_co)
  const movedCo = subjects.filter(s => grid[s.id]?.is_co)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Assign Subject &amp; Test</h1>
          <p className="page-sub">Configure Scholastic &amp; Co-Scholastic subjects, evaluation mode and max marks per class-section.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/masters/subjects')} className="btn-secondary flex items-center gap-2"><Plus size={15} /> Add Subject</button>
          <button onClick={() => navigate('/cce/test-master')} className="btn-secondary flex items-center gap-2"><Plus size={15} /> Add Test</button>
        </div>
      </div>

      {/* Class / Section filters */}
      <div className="card p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Class</label>
            <select className="form-input" value={classId} onChange={e => { setClassId(e.target.value); setSectionId('') }}>
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Section</label>
            <select className="form-input" value={sectionId} onChange={e => setSectionId(e.target.value)} disabled={!classId}>
              <option value="">Select Section</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.section_name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {!selected ? (
        <div className="card p-12 text-center">
          <BookOpen size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Select a class and section to configure subjects &amp; tests.</p>
        </div>
      ) : loading ? (
        <div className="card p-12 text-center text-gray-400">Loading grid...</div>
      ) : (
        <>
          {/* ── Scholastic ─────────────────────────────────────────── */}
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <BookOpen size={16} className="text-blue-600" />
              <h2 className="font-semibold text-gray-800">Scholastic Subjects</h2>
              <span className="text-xs text-gray-400">from Timetable</span>
            </div>

            {subjects.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm text-gray-500">No subjects found in the timetable for this class-section.</p>
                <p className="text-xs text-gray-400 mt-1">Subjects appear here only after they are mapped in the <strong>Timetable</strong>.</p>
              </div>
            ) : (
              <>
                {tests.length === 0 && (
                  <div className="px-4 py-2 bg-amber-50 text-amber-700 text-xs border-b border-amber-100">
                    No tests defined yet. Click <strong>Add Test</strong> to create tests — they appear as columns here.
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                        <th className="px-3 py-2 text-left sticky left-0 bg-gray-50 z-10 min-w-[150px]">Subject</th>
                        <th className="px-3 py-2 text-left min-w-[220px]">Mode</th>
                        <th className="px-3 py-2 text-center min-w-[150px]">Move to Co-Scholastic</th>
                        {tests.map(t => <th key={t.id} className="px-3 py-2 text-center min-w-[90px]">{t.name}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {scholastic.length === 0 && (
                        <tr><td colSpan={3 + tests.length} className="px-3 py-6 text-center text-gray-400 text-xs">All timetable subjects moved to Co-Scholastic.</td></tr>
                      )}
                      {scholastic.map(s => {
                        const row = grid[s.id] || { mode: 'marks', cells: {} }
                        return (
                          <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-3 py-2.5 font-medium text-gray-800 sticky left-0 bg-white z-10">{s.name}</td>
                            <td className="px-3 py-2.5">
                              <select
                                value={row.mode}
                                onChange={e => setMode(s.id, e.target.value)}
                                className="form-input py-1 text-xs w-44"
                              >
                                {SCHOLASTIC_MODES.map(m => (
                                  <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <button onClick={() => moveToCo(s.id)} className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium">
                                Move <ArrowRight size={12} />
                              </button>
                            </td>
                            {tests.map(t => (
                              <td key={t.id} className="px-3 py-2.5 text-center">
                                <input
                                  type="number" min={0} step="0.01"
                                  value={row.cells[t.id] ?? ''}
                                  onChange={e => setCell(s.id, t.id, e.target.value)}
                                  placeholder="Max"
                                  className="form-input py-1 text-xs w-20 text-center"
                                />
                              </td>
                            ))}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* ── Co-Scholastic ──────────────────────────────────────── */}
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <Award size={16} className="text-purple-600" />
              <h2 className="font-semibold text-gray-800">Co-Scholastic Subjects</h2>
              <span className="text-xs text-gray-400">Direct Grade only · no marks</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                    <th className="px-3 py-2 text-left">Subject / Activity</th>
                    <th className="px-3 py-2 text-left">Source</th>
                    <th className="px-3 py-2 text-left">Mode</th>
                    <th className="px-3 py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {movedCo.length === 0 && coMaster.length === 0 && (
                    <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400 text-xs">
                      No co-scholastic subjects. Move a timetable subject here, or assign a <strong>Co-Scholastic Subject Master</strong> activity to this class-section.
                    </td></tr>
                  )}
                  {movedCo.map(s => (
                    <tr key={`mv-${s.id}`} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-medium text-gray-800">{s.name}</td>
                      <td className="px-3 py-2.5"><span className="badge badge-blue text-xs">Timetable (moved)</span></td>
                      <td className="px-3 py-2.5 text-gray-600">Direct Grade</td>
                      <td className="px-3 py-2.5 text-center">
                        <button onClick={() => moveToScholastic(s.id)} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                          <ArrowLeft size={12} /> Move to Scholastic
                        </button>
                      </td>
                    </tr>
                  ))}
                  {coMaster.map(s => (
                    <tr key={`ms-${s.id}`} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-medium text-gray-800">{s.name}</td>
                      <td className="px-3 py-2.5"><span className="badge badge-gray text-xs">Master</span></td>
                      <td className="px-3 py-2.5 text-gray-600">Direct Grade</td>
                      <td className="px-3 py-2.5 text-center text-xs text-gray-400">managed in master</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isLoading || subjects.length === 0} className="btn-primary flex items-center gap-2">
              <Save size={15} /> {saveMutation.isLoading ? 'Saving...' : 'Save'}
            </button>
            <span className="text-xs text-gray-400">
              Co-scholastic grades come from Grade Master (Direct Grade) during Marks Feeding. Master activities only appear here once assigned to this class-section in Co-Scholastic Subject Master.
            </span>
          </div>
        </>
      )}
    </div>
  )
}
