import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Save, Search, RotateCcw } from 'lucide-react'
import { attendanceApi, staffApi } from '../../services/api'
import { format } from 'date-fns'

const STATUS_OPTIONS = [
  { value: 'present',  label: 'P',  color: 'bg-green-500',  text: 'Present' },
  { value: 'absent',   label: 'A',  color: 'bg-red-500',    text: 'Absent' },
  { value: 'late',     label: 'L',  color: 'bg-yellow-500', text: 'Late' },
  { value: 'half_day', label: 'HD', color: 'bg-orange-500', text: 'Half Day' },
  { value: 'leave',    label: 'LE', color: 'bg-blue-500',   text: 'On Leave' },
]

const listOf = (r) => r.data.results || r.data

export default function StaffAttendance() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [date, setDate] = useState(today)
  const [deptId, setDeptId] = useState('')
  const [desigId, setDesigId] = useState('')
  const [staffType, setStaffType] = useState('')
  const [search, setSearch] = useState('')
  const [attendance, setAttendance] = useState({}) // staff_id -> { status, check_in, check_out, remarks }

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => staffApi.departments().then(listOf),
  })
  const { data: designations = [] } = useQuery({
    queryKey: ['designations'],
    queryFn: () => staffApi.designations({ status: 'active' }).then(listOf),
  })

  const rosterParams = {
    date,
    ...(deptId && { department_id: deptId }),
    ...(desigId && { designation_id: desigId }),
    ...(staffType && { staff_type: staffType }),
  }

  const { data: roster = [], isLoading, isFetching } = useQuery({
    queryKey: ['staff-roster', rosterParams],
    queryFn: () => attendanceApi.staffRoster(rosterParams).then(listOf),
    enabled: !!date,
  })

  // Seed editable state whenever the roster (date/filters) changes.
  useEffect(() => {
    const seed = {}
    roster.forEach(s => {
      seed[s.staff_id] = {
        status: s.status || 'present',
        check_in: s.check_in || '',
        check_out: s.check_out || '',
        remarks: s.remarks || '',
      }
    })
    setAttendance(seed)
  }, [roster])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return roster
    return roster.filter(s =>
      s.staff_name?.toLowerCase().includes(q) ||
      s.employee_id?.toLowerCase().includes(q)
    )
  }, [roster, search])

  const update = (id, patch) =>
    setAttendance(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }))

  const markAll = (status) =>
    setAttendance(prev => {
      const next = { ...prev }
      visible.forEach(s => { next[s.staff_id] = { ...next[s.staff_id], status } })
      return next
    })

  const saveMutation = useMutation({
    mutationFn: () =>
      attendanceApi.staffBulkMark({
        date,
        attendance: roster.map(s => ({
          staff: s.staff_id,
          status: attendance[s.staff_id]?.status || 'present',
          check_in: attendance[s.staff_id]?.check_in || null,
          check_out: attendance[s.staff_id]?.check_out || null,
          remarks: attendance[s.staff_id]?.remarks || '',
        })),
      }),
    onSuccess: (r) => toast.success(r.data?.detail || 'Staff attendance saved!'),
    onError: () => toast.error('Failed to save attendance'),
  })

  // Live counts over the visible rows
  const counts = STATUS_OPTIONS.reduce((acc, o) => ({ ...acc, [o.value]: 0 }), {})
  visible.forEach(s => {
    const st = attendance[s.staff_id]?.status
    if (st && counts[st] !== undefined) counts[st]++
  })

  const loading = isLoading || isFetching

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Staff Attendance</h1>
        <p className="text-sm text-gray-500">Mark daily attendance with shift timings for active staff</p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="form-label">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">Department</label>
            <select className="form-input" value={deptId} onChange={e => setDeptId(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Designation</label>
            <select className="form-input" value={desigId} onChange={e => setDesigId(e.target.value)}>
              <option value="">All Designations</option>
              {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Staff Type</label>
            <select className="form-input" value={staffType} onChange={e => setStaffType(e.target.value)}>
              <option value="">All Types</option>
              <option value="teaching">Teaching</option>
              <option value="non_teaching">Non-Teaching</option>
            </select>
          </div>
          <div>
            <label className="form-label">Search</label>
            <div className="relative">
              <Search size={15} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input
                className="form-input pl-8"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Name or Emp ID"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      {!loading && visible.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          <div className="card p-3">
            <div className="text-xl font-bold text-gray-800">{visible.length}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          {STATUS_OPTIONS.map(o => (
            <div key={o.value} className="card p-3">
              <div className="text-xl font-bold text-gray-800">{counts[o.value]}</div>
              <div className="text-xs text-gray-500">{o.text}</div>
            </div>
          ))}
        </div>
      )}

      {loading && <div className="card p-10 text-center text-gray-400">Loading staff roster...</div>}
      {!loading && roster.length === 0 && (
        <div className="card p-10 text-center text-gray-400">No active staff found for the selected filters</div>
      )}

      {!loading && visible.length > 0 && (
        <div className="card p-4">
          {/* Mark All + legend */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm text-gray-600 font-medium">Mark All:</span>
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => markAll(opt.value)}
                className={`px-3 py-1 rounded text-white text-xs font-medium ${opt.color}`}
              >
                {opt.label}
              </button>
            ))}
            <div className="ml-auto flex flex-wrap items-center gap-3 text-xs text-gray-500">
              {STATUS_OPTIONS.map(o => (
                <span key={o.value}>
                  <span className={`inline-block w-3 h-3 rounded mr-1 ${o.color}`}></span>{o.text}
                </span>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-3 py-2 text-left text-gray-600">#</th>
                  <th className="px-3 py-2 text-left text-gray-600">Emp ID</th>
                  <th className="px-3 py-2 text-left text-gray-600">Staff Name</th>
                  <th className="px-3 py-2 text-left text-gray-600">Designation</th>
                  <th className="px-3 py-2 text-left text-gray-600">Department</th>
                  <th className="px-3 py-2 text-center text-gray-600">Status</th>
                  <th className="px-3 py-2 text-center text-gray-600">In</th>
                  <th className="px-3 py-2 text-center text-gray-600">Out</th>
                  <th className="px-3 py-2 text-left text-gray-600">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((s, idx) => {
                  const row = attendance[s.staff_id] || {}
                  return (
                    <tr key={s.staff_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                      <td className="px-3 py-2.5 text-gray-600">{s.employee_id}</td>
                      <td className="px-3 py-2.5 font-medium text-gray-800">{s.staff_name}</td>
                      <td className="px-3 py-2.5 text-gray-600">{s.designation || '—'}</td>
                      <td className="px-3 py-2.5 text-gray-600">{s.department || '—'}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-center gap-1">
                          {STATUS_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => update(s.staff_id, { status: opt.value })}
                              title={opt.text}
                              className={`w-9 h-8 rounded text-white text-xs font-bold transition-opacity ${opt.color} ${
                                row.status === opt.value
                                  ? 'opacity-100 ring-2 ring-offset-1 ring-gray-400'
                                  : 'opacity-35'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="time"
                          value={row.check_in || ''}
                          onChange={e => update(s.staff_id, { check_in: e.target.value })}
                          className="form-input py-1 text-xs w-28"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="time"
                          value={row.check_out || ''}
                          onChange={e => update(s.staff_id, { check_out: e.target.value })}
                          className="form-input py-1 text-xs w-28"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="text"
                          value={row.remarks || ''}
                          onChange={e => update(s.staff_id, { remarks: e.target.value })}
                          placeholder="—"
                          className="form-input py-1 text-xs w-40"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isLoading}
              className="btn-primary flex items-center gap-2"
            >
              <Save size={15} />
              {saveMutation.isLoading ? 'Saving...' : 'Save Attendance'}
            </button>
            <button
              onClick={() => {
                const seed = {}
                roster.forEach(s => { seed[s.staff_id] = { status: s.status || 'present', check_in: s.check_in || '', check_out: s.check_out || '', remarks: s.remarks || '' } })
                setAttendance(seed)
              }}
              className="btn-secondary flex items-center gap-2"
            >
              <RotateCcw size={15} /> Reset
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
