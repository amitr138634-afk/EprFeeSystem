import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowDownCircle, User } from 'lucide-react'
import { feeApi, masterApi } from '../../services/api'

const listOf = (r) => r.data.results || r.data

export default function DemoteStudent() {
  const qc = useQueryClient()
  const [classId, setClassId] = useState('')
  const [section, setSection] = useState('')
  const [targetClassId, setTargetClassId] = useState('')
  const [targetSection, setTargetSection] = useState('')

  // All classes ever defined (not just the active session's) — demoting
  // commonly targets a class from a prior session's setup.
  const { data: classes = [] } = useQuery({
    queryKey: ['classes-demote-student'],
    queryFn: () => masterApi.classes({ all_sessions: 1 }).then(listOf),
  })
  const { data: sections = [] } = useQuery({
    queryKey: ['sections-demote-student'],
    queryFn: () => masterApi.getSectionMaster().then(listOf),
  })

  const params = { class_name: classId, ...(section && { section }) }
  const { data: students = [], isLoading } = useQuery({
    queryKey: ['demote-class-students', params],
    queryFn: () => feeApi.promoteClassStudents(params).then(r => r.data),
    enabled: !!classId,
  })

  // Demote is the reverse of Promote — target options must only offer
  // classes/sections that come BEFORE the selected one.
  const classIndex = classes.findIndex(c => String(c.id) === String(classId))
  const targetClassOptions = classIndex >= 0 ? classes.slice(0, classIndex) : classes
  const sectionIndex = section ? sections.findIndex(s => String(s.id) === String(section)) : -1
  const targetSectionOptions = sectionIndex >= 0 ? sections.slice(0, sectionIndex) : sections

  const demoteMutation = useMutation({
    mutationFn: () => feeApi.cloneClassStudents({
      class_name: classId, section,
      target_class_name: targetClassId, target_section: targetSection,
    }),
    onSuccess: (res) => {
      toast.success(res.data?.detail?.replace('cloned', 'demoted') || 'Students demoted to the new class!')
      qc.invalidateQueries(['demote-class-students'])
      setTargetClassId('')
      setTargetSection('')
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to demote students'),
  })

  const noChange = String(targetClassId) === String(classId) && String(targetSection || '') === String(section || '')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Demote Student</h1>
        <p className="text-sm text-gray-500 mt-1">Move a promoted class/section back to a lower class/section</p>
      </div>

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
              <label className="form-label">Demote Into Class</label>
              <select className="form-select" value={targetClassId} onChange={e => setTargetClassId(e.target.value)}>
                <option value="">Select Target Class</option>
                {targetClassOptions.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Demote Into Section</label>
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
              onClick={() => demoteMutation.mutate()}
              disabled={demoteMutation.isPending || !targetClassId || students.length === 0 || noChange}
              className="btn-primary"
            >
              <ArrowDownCircle size={16} /> Demote {students.length} Student{students.length !== 1 ? 's' : ''} to New Class
            </button>
          </div>
        </>
      )}
    </div>
  )
}
