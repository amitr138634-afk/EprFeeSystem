import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { attendanceApi, studentApi } from '../../services/api'

const STATUS_MAP = {
  present: { label: 'P',  bg: 'bg-green-100 text-green-700' },
  absent:  { label: 'A',  bg: 'bg-red-100 text-red-700' },
  late:    { label: 'L',  bg: 'bg-yellow-100 text-yellow-700' },
  leave:   { label: 'LE', bg: 'bg-blue-100 text-blue-700' },
}

const MONTHS = [
  { value: 1,  label: 'January' },  { value: 2,  label: 'February' },
  { value: 3,  label: 'March' },    { value: 4,  label: 'April' },
  { value: 5,  label: 'May' },      { value: 6,  label: 'June' },
  { value: 7,  label: 'July' },     { value: 8,  label: 'August' },
  { value: 9,  label: 'September' },{ value: 10, label: 'October' },
  { value: 11, label: 'November' }, { value: 12, label: 'December' },
]

export default function AttendanceRegister() {
  const now = new Date()
  const [classId,   setClassId]   = useState('')
  const [sectionId, setSectionId] = useState('')
  const [month,     setMonth]     = useState(now.getMonth() + 1)
  const [year,      setYear]      = useState(now.getFullYear())

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => studentApi.classes().then(r => r.data.results || r.data),
  })

  const { data: sections = [] } = useQuery({
    queryKey: ['sections', classId],
    queryFn: () => studentApi.sections({ class_id: classId }).then(r => r.data.results || r.data),
    enabled: !!classId,
  })

  const { data: registerData, isLoading, isFetching } = useQuery({
    queryKey: ['attendance-register', classId, sectionId, month, year],
    queryFn:  () =>
      attendanceApi.register({ class_id: classId, section_id: sectionId, month, year })
        .then(r => r.data),
    enabled: !!classId && !!sectionId,
  })

  const students = registerData?.students || []
  const dates    = registerData?.dates    || []
  const data     = registerData?.data     || {}

  // Compute per-student row counts
  const rowCounts = (studentId) => {
    const row = data[studentId] || {}
    const c = { present: 0, absent: 0, late: 0, leave: 0 }
    dates.forEach(d => { if (row[d] && c[row[d]] !== undefined) c[row[d]]++ })
    return c
  }

  // Compute column (date) totals for the summary footer
  const colTotals = dates.map(d => {
    const c = { present: 0, absent: 0, late: 0, leave: 0 }
    students.forEach(s => {
      const st = data[s.id]?.[d]
      if (st && c[st] !== undefined) c[st]++
    })
    return c
  })

  // Grand totals for summary columns
  const grandTotal = { present: 0, absent: 0, late: 0, leave: 0 }
  students.forEach(s => {
    const c = rowCounts(s.id)
    grandTotal.present += c.present
    grandTotal.absent  += c.absent
    grandTotal.late    += c.late
    grandTotal.leave   += c.leave
  })

  const loading = isLoading || isFetching

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Attendance Register</h1>
        <p className="text-sm text-gray-500">Date-wise monthly attendance for a class and section</p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="form-label">Class</label>
            <select
              value={classId}
              onChange={e => { setClassId(e.target.value); setSectionId('') }}
              className="form-input"
            >
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Section</label>
            <select
              value={sectionId}
              onChange={e => setSectionId(e.target.value)}
              className="form-input"
              disabled={!classId}
            >
              <option value="">Select Section</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Month</label>
            <select value={month} onChange={e => setMonth(Number(e.target.value))} className="form-input">
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Year</label>
            <input
              type="number"
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="form-input"
              min="2000"
              max="2100"
            />
          </div>
        </div>
      </div>

      {/* States */}
      {(!classId || !sectionId) && (
        <div className="card p-10 text-center text-gray-400">
          Select class and section to view the attendance register
        </div>
      )}

      {classId && sectionId && loading && (
        <div className="card p-10 text-center text-gray-400">Loading register...</div>
      )}

      {classId && sectionId && !loading && students.length === 0 && (
        <div className="card p-10 text-center text-gray-400">
          No attendance data found for the selected filters
        </div>
      )}

      {/* Register Table */}
      {classId && sectionId && !loading && students.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-gray-700 text-sm">
              {MONTHS.find(m => m.value === month)?.label} {year} &mdash; {students.length} Students
            </span>
            <div className="flex gap-3 text-xs text-gray-500">
              <span><span className="inline-block w-2.5 h-2.5 rounded bg-green-400 mr-1"></span>Present (P)</span>
              <span><span className="inline-block w-2.5 h-2.5 rounded bg-red-400 mr-1"></span>Absent (A)</span>
              <span><span className="inline-block w-2.5 h-2.5 rounded bg-yellow-400 mr-1"></span>Late (L)</span>
              <span><span className="inline-block w-2.5 h-2.5 rounded bg-blue-400 mr-1"></span>Leave (LE)</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse whitespace-nowrap">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left border-b border-gray-200 min-w-[36px]">#</th>
                  <th className="px-3 py-2 text-left border-b border-gray-200 min-w-[90px]">Adm. No.</th>
                  <th className="px-3 py-2 text-left border-b border-gray-200 min-w-[160px]">Student Name</th>
                  {dates.map(d => (
                    <th key={d} className="px-2 py-2 text-center border-b border-gray-200 w-9">{d}</th>
                  ))}
                  <th className="px-2 py-2 text-center border-b border-gray-200 bg-green-50 text-green-700">P</th>
                  <th className="px-2 py-2 text-center border-b border-gray-200 bg-red-50 text-red-700">A</th>
                  <th className="px-2 py-2 text-center border-b border-gray-200 bg-yellow-50 text-yellow-700">L</th>
                  <th className="px-2 py-2 text-center border-b border-gray-200 bg-blue-50 text-blue-700">LE</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, idx) => {
                  const row  = data[s.id] || {}
                  const cnt  = rowCounts(s.id)
                  return (
                    <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                      <td className="px-3 py-2">{s.admission_no}</td>
                      <td className="px-3 py-2 font-medium text-gray-800">{s.name}</td>
                      {dates.map(d => {
                        const status = row[d]
                        const style  = STATUS_MAP[status]
                        return (
                          <td key={d} className="px-1 py-2 text-center">
                            {style ? (
                              <span className={`inline-block px-1 py-0.5 rounded font-semibold ${style.bg}`}>
                                {style.label}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-2 py-2 text-center text-green-700 font-semibold bg-green-50">{cnt.present}</td>
                      <td className="px-2 py-2 text-center text-red-700 font-semibold bg-red-50">{cnt.absent}</td>
                      <td className="px-2 py-2 text-center text-yellow-700 font-semibold bg-yellow-50">{cnt.late}</td>
                      <td className="px-2 py-2 text-center text-blue-700 font-semibold bg-blue-50">{cnt.leave}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-gray-100 font-semibold border-t-2 border-gray-300">
                <tr>
                  <td colSpan={3} className="px-3 py-2 text-gray-700">Totals</td>
                  {colTotals.map((c, i) => (
                    <td key={i} className="px-1 py-2 text-center text-green-700">
                      {c.present > 0 ? c.present : <span className="text-gray-300">—</span>}
                    </td>
                  ))}
                  <td className="px-2 py-2 text-center text-green-700 bg-green-50">{grandTotal.present}</td>
                  <td className="px-2 py-2 text-center text-red-700 bg-red-50">{grandTotal.absent}</td>
                  <td className="px-2 py-2 text-center text-yellow-700 bg-yellow-50">{grandTotal.late}</td>
                  <td className="px-2 py-2 text-center text-blue-700 bg-blue-50">{grandTotal.leave}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
