import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowRight, Copy, Tag, Bus, MapPin, Building2, User } from 'lucide-react'
import { feeApi, transportApi, masterApi } from '../../services/api'

const TABS = ['Students', 'Fee Heads', 'Transport']
const listOf = (r) => r.data.results || r.data

function SessionColumn({ title, children }) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</p>
      <div className="card p-4 space-y-2 min-h-[140px]">{children}</div>
    </div>
  )
}

function StudentsTab() {
  const qc = useQueryClient()
  const [classId, setClassId] = useState('')
  const [section, setSection] = useState('')
  const [targetClassId, setTargetClassId] = useState('')
  const [targetSection, setTargetSection] = useState('')

  // All classes ever defined (not just the active session's) — Promote
  // Student needs to offer every class as a possible target, since the
  // active session may only have a handful configured so far.
  const { data: classes = [] } = useQuery({
    queryKey: ['classes-promote-student'],
    queryFn: () => masterApi.classes({ all_sessions: 1 }).then(listOf),
  })
  const { data: sections = [] } = useQuery({
    queryKey: ['sections-promote-student'],
    queryFn: () => masterApi.getSectionMaster().then(listOf),
  })

  const params = { class_name: classId, ...(section && { section }) }
  const { data: students = [], isLoading } = useQuery({
    queryKey: ['promote-class-students', params],
    queryFn: () => feeApi.promoteClassStudents(params).then(r => r.data),
    enabled: !!classId,
  })

  // Target options must only offer classes/sections that come AFTER the
  // selected one (same order the lists are already shown in) — promoting
  // backwards into an earlier class/section doesn't make sense.
  const classIndex = classes.findIndex(c => String(c.id) === String(classId))
  const targetClassOptions = classIndex >= 0 ? classes.slice(classIndex + 1) : classes
  const sectionIndex = section ? sections.findIndex(s => String(s.id) === String(section)) : -1
  const targetSectionOptions = sectionIndex >= 0 ? sections.slice(sectionIndex + 1) : sections

  const cloneMutation = useMutation({
    mutationFn: () => feeApi.cloneClassStudents({
      class_name: classId, section,
      target_class_name: targetClassId, target_section: targetSection,
    }),
    onSuccess: (res) => {
      toast.success(res.data?.detail || 'Students cloned to the new class!')
      qc.invalidateQueries(['promote-class-students'])
      setTargetClassId('')
      setTargetSection('')
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to clone students'),
  })

  const noChange = String(targetClassId) === String(classId) && String(targetSection || '') === String(section || '')

  return (
    <div className="space-y-5">
      <div className="card p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Class</label>
            <select className="form-select" value={classId} onChange={e => { setClassId(e.target.value); setTargetClassId('') }}>
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Section</label>
            <select className="form-select" value={section} onChange={e => { setSection(e.target.value); setTargetSection('') }}>
              <option value="">All Sections</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.section}</option>)}
            </select>
          </div>
        </div>

        {classId && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <div>
              <label className="form-label">Clone Into Class</label>
              <select className="form-select" value={targetClassId} onChange={e => setTargetClassId(e.target.value)}>
                <option value="">Select Target Class</option>
                {targetClassOptions.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Clone Into Section</label>
              <select className="form-select" value={targetSection} onChange={e => setTargetSection(e.target.value)}>
                <option value="">Keep Same Section</option>
                {targetSectionOptions.map(s => <option key={s.id} value={s.id}>{s.section}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {!classId ? (
        <div className="card p-8 text-center text-sm text-gray-400">Select a class to see its students.</div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th></th><th>Admission No</th><th>Student Name</th><th>Class</th><th>Section</th></tr>
              </thead>
              <tbody>
                {isLoading && <tr><td colSpan={5} className="text-center py-8 text-gray-400">Loading...</td></tr>}
                {!isLoading && students.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">No students found</td></tr>}
                {students.map(s => (
                  <tr key={s.id}>
                    <td><div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-500"><User size={13} /></div></td>
                    <td className="font-medium text-gray-900">{s.admission_no}</td>
                    <td>{s.student_name}</td>
                    <td>{s.class_name}</td>
                    <td>{s.section}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => cloneMutation.mutate()}
              disabled={cloneMutation.isPending || !targetClassId || students.length === 0 || noChange}
              className="btn-primary"
            >
              <Copy size={16} /> Clone {students.length} Student{students.length !== 1 ? 's' : ''} to New Class
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function FeeHeadsTab() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['promote-fee-heads'],
    queryFn: () => feeApi.promoteFeeHeads().then(r => r.data),
  })

  const cloneMutation = useMutation({
    mutationFn: () => feeApi.cloneFeeHeads(),
    onSuccess: (res) => {
      toast.success(res.data?.detail || 'Fee heads cloned!')
      qc.invalidateQueries(['promote-fee-heads'])
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to clone fee heads'),
  })

  if (isLoading) return <div className="card p-8 text-center text-sm text-gray-400">Loading...</div>
  if (!data) return null

  const { current_session, next_session, current_heads, next_heads } = data

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-5">
        <SessionColumn title={`Current Session — ${current_session}`}>
          {current_heads.length === 0 ? (
            <p className="text-sm text-gray-400">No fee heads defined</p>
          ) : current_heads.map(h => (
            <div key={h.position} className="flex items-center gap-2 text-sm py-1">
              <Tag size={13} className="text-gray-400" />
              <span className="text-gray-700">{h.name}</span>
            </div>
          ))}
        </SessionColumn>

        <div className="flex flex-col items-center gap-2 shrink-0">
          <button
            onClick={() => cloneMutation.mutate()}
            disabled={cloneMutation.isPending || current_heads.length === 0}
            className="btn-primary btn-sm"
            title="Clone current session's fee heads into next session"
          >
            <Copy size={14} /> Clone
          </button>
          <ArrowRight size={18} className="text-gray-300" />
        </div>

        <SessionColumn title={`Next Session — ${next_session}`}>
          {next_heads.length === 0 ? (
            <p className="text-sm text-gray-400">Not cloned yet</p>
          ) : next_heads.map(h => (
            <div key={h.position} className="flex items-center gap-2 text-sm py-1">
              <Tag size={13} className="text-green-500" />
              <span className="text-gray-700">{h.name}</span>
            </div>
          ))}
        </SessionColumn>
      </div>
    </div>
  )
}

function TransportLists({ vehicles, routes, stops }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold text-gray-400 flex items-center gap-1 mb-1.5"><Bus size={12} /> Buses ({vehicles.length})</p>
        {vehicles.length === 0 ? <p className="text-xs text-gray-400">None</p> : vehicles.map(v => (
          <p key={v.id} className="text-sm text-gray-700">{v.bus_no} <span className="text-gray-400">({v.registration_no})</span></p>
        ))}
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 flex items-center gap-1 mb-1.5"><MapPin size={12} /> Routes ({routes.length})</p>
        {routes.length === 0 ? <p className="text-xs text-gray-400">None</p> : routes.map(r => (
          <p key={r.id} className="text-sm text-gray-700">{r.name} <span className="text-gray-400">{r.bus_no ? `· ${r.bus_no}` : ''}</span></p>
        ))}
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 flex items-center gap-1 mb-1.5"><Building2 size={12} /> Stops ({stops.length})</p>
        {stops.length === 0 ? <p className="text-xs text-gray-400">None</p> : stops.map(s => (
          <p key={s.id} className="text-sm text-gray-700">{s.name} <span className="text-gray-400">· {s.route_name} · ₹{s.monthly_fee}</span></p>
        ))}
      </div>
    </div>
  )
}

function TransportTab() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['promote-transport'],
    queryFn: () => transportApi.promoteTransport().then(r => r.data),
  })

  const cloneMutation = useMutation({
    mutationFn: () => transportApi.cloneTransport(),
    onSuccess: (res) => {
      toast.success(res.data?.detail || 'Transport setup cloned!')
      qc.invalidateQueries(['promote-transport'])
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to clone transport setup'),
  })

  if (isLoading) return <div className="card p-8 text-center text-sm text-gray-400">Loading...</div>
  if (!data) return null

  const { current_session, next_session, current, next } = data
  const hasCurrent = current.vehicles.length > 0 || current.routes.length > 0 || current.stops.length > 0

  return (
    <div className="flex items-start gap-5">
      <SessionColumn title={`Current Session — ${current_session}`}>
        <TransportLists {...current} />
      </SessionColumn>

      <div className="flex flex-col items-center gap-2 shrink-0">
        <button
          onClick={() => cloneMutation.mutate()}
          disabled={cloneMutation.isPending || !hasCurrent}
          className="btn-primary btn-sm"
          title="Clone current session's buses, routes & stops into next session"
        >
          <Copy size={14} /> Clone
        </button>
        <ArrowRight size={18} className="text-gray-300" />
      </div>

      <SessionColumn title={`Next Session — ${next_session}`}>
        <TransportLists {...next} />
      </SessionColumn>
    </div>
  )
}

export default function PromoteStudent() {
  const [tab, setTab] = useState(TABS[0])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Promote Student</h1>
        <p className="text-sm text-gray-500 mt-1">Carry forward setup from the current session into the next one</p>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${tab === t ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Students' && <StudentsTab />}
      {tab === 'Fee Heads' && <FeeHeadsTab />}
      {tab === 'Transport' && <TransportTab />}
    </div>
  )
}
