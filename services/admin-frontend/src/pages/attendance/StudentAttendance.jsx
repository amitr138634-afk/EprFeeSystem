import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Save } from 'lucide-react'
import { studentApi, attendanceApi } from '../../services/api'
import { format } from 'date-fns'

const STATUS_OPTIONS = [
  { value: 'present', label: 'P', color: 'bg-green-500' },
  { value: 'absent', label: 'A', color: 'bg-red-500' },
  { value: 'late', label: 'L', color: 'bg-yellow-500' },
  { value: 'leave', label: 'LE', color: 'bg-blue-500' },
]

export default function StudentAttendance() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [date, setDate] = useState(today)
  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [attendance, setAttendance] = useState({})

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => studentApi.classes().then(r => r.data.results || r.data),
  })

  const { data: sections = [] } = useQuery({
    queryKey: ['sections', classId],
    queryFn: () => studentApi.sections({ class_id: classId }).then(r => r.data.results || r.data),
    enabled: !!classId,
  })

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students-for-attendance', classId, sectionId],
    queryFn: () => studentApi.list({ class_id: classId, section_id: sectionId, status: 'active' }).then(r => {
      const list = r.data.results || r.data
      const initial = {}
      list.forEach(s => { initial[s.id] = 'present' })
      setAttendance(initial)
      return list
    }),
    enabled: !!classId && !!sectionId,
  })

  const saveMutation = useMutation({
    mutationFn: () => attendanceApi.bulkMark({
      date,
      class_id: Number(classId),
      section_id: Number(sectionId),
      attendances: students.map(s => ({
        student_id: s.id,
        status: attendance[s.id] || 'present',
      })),
    }),
    onSuccess: () => toast.success('Attendance saved successfully!'),
    onError: () => toast.error('Failed to save attendance'),
  })

  const markAll = (status) => {
    const updated = {}
    students.forEach(s => { updated[s.id] = status })
    setAttendance(updated)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Student Attendance</h1>
          <p className="text-sm text-gray-500">Mark daily attendance</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="form-label">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">Class</label>
            <select value={classId} onChange={e => { setClassId(e.target.value); setSectionId('') }} className="form-input">
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Section</label>
            <select value={sectionId} onChange={e => setSectionId(e.target.value)} className="form-input" disabled={!classId}>
              <option value="">Select Section</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {students.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-4">
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
              <div className="ml-auto flex items-center gap-3 text-xs text-gray-500">
                <span><span className="inline-block w-3 h-3 bg-green-500 rounded mr-1"></span>Present</span>
                <span><span className="inline-block w-3 h-3 bg-red-500 rounded mr-1"></span>Absent</span>
                <span><span className="inline-block w-3 h-3 bg-yellow-500 rounded mr-1"></span>Late</span>
                <span><span className="inline-block w-3 h-3 bg-blue-500 rounded mr-1"></span>Leave</span>
              </div>
            </div>

            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="table-header px-3 py-2 text-left">#</th>
                  <th className="table-header px-3 py-2 text-left">Adm. No.</th>
                  <th className="table-header px-3 py-2 text-left">Student Name</th>
                  <th className="table-header px-3 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, idx) => (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2.5 text-gray-500">{idx + 1}</td>
                    <td className="px-3 py-2.5">{s.admission_no}</td>
                    <td className="px-3 py-2.5 font-medium">{s.full_name || `${s.first_name} ${s.last_name}`}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-center gap-1">
                        {STATUS_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setAttendance(p => ({ ...p, [s.id]: opt.value }))}
                            className={`w-8 h-8 rounded text-white text-xs font-bold transition-opacity ${opt.color} ${
                              attendance[s.id] === opt.value ? 'opacity-100 ring-2 ring-offset-1 ring-gray-400' : 'opacity-40'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isLoading}
              className="btn-primary flex items-center gap-2"
            >
              <Save size={15} />
              {saveMutation.isLoading ? 'Saving...' : 'Save Attendance'}
            </button>
          </>
        )}

        {!classId && (
          <p className="text-center text-gray-400 py-10">Select class and section to mark attendance</p>
        )}
      </div>
    </div>
  )
}
