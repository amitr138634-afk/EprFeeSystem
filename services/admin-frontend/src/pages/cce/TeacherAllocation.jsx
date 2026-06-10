import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { ChevronRight, ChevronDown, UserSquare2 } from 'lucide-react'
import { academicsApi } from '../../services/api'

function groupByTeacher(allocations) {
  const map = {}
  allocations.forEach(alloc => {
    const teacherId = alloc.teacher_id ?? alloc.teacher
    if (!teacherId) return

    let teacherName = alloc.teacher_name
    if (!teacherName && alloc.teacher_detail) {
      teacherName = `${alloc.teacher_detail.first_name ?? ''} ${alloc.teacher_detail.last_name ?? ''}`.trim()
    }
    teacherName = teacherName || `Teacher #${teacherId}`

    if (!map[teacherId]) {
      map[teacherId] = {
        teacher_id: teacherId,
        teacher_name: teacherName,
        assignments: [],
      }
    }

    const subjectName = alloc.subject_name ?? alloc.subject_detail?.name ?? `Subject ${alloc.subject_id ?? alloc.subject}`
    const className = alloc.class_name ?? alloc.class_detail?.name ?? `Class ${alloc.class_id ?? alloc.class_ref ?? alloc.class}`
    const sectionName = alloc.section_name ?? alloc.section_detail?.name ?? `${alloc.section_id ?? alloc.section}`

    map[teacherId].assignments.push({
      id: alloc.id,
      subject: subjectName,
      class: className,
      section: sectionName,
    })
  })

  return Object.values(map).sort((a, b) => a.teacher_name.localeCompare(b.teacher_name))
}

function TeacherRow({ group }) {
  const [expanded, setExpanded] = useState(false)

  const uniqueSubjects = [...new Set(group.assignments.map(a => a.subject))]
  const uniqueClasses = [...new Set(group.assignments.map(a => `${a.class} - Sec ${a.section}`))]

  return (
    <>
      <tr
        className="hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {expanded
              ? <ChevronDown size={14} className="text-gray-400 shrink-0" />
              : <ChevronRight size={14} className="text-gray-400 shrink-0" />
            }
            <span className="text-sm font-semibold text-gray-800">{group.teacher_name}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {uniqueSubjects.join(', ') || '—'}
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {uniqueClasses.map(cls => (
              <span key={cls} className="badge badge-blue text-xs">{cls}</span>
            ))}
          </div>
        </td>
        <td className="px-4 py-3 text-center">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-700 text-xs font-bold">
            {group.assignments.length}
          </span>
        </td>
      </tr>
      {expanded && group.assignments.map(a => (
        <tr key={a.id} className="bg-green-50/40 border-l-4 border-l-green-300">
          <td className="px-4 py-2 pl-10 text-xs text-gray-400"></td>
          <td className="px-4 py-2 text-sm font-medium text-gray-700">{a.subject}</td>
          <td className="px-4 py-2 text-sm text-gray-600">
            {a.class} — <span className="text-gray-500">Section {a.section}</span>
          </td>
          <td className="px-4 py-2"></td>
        </tr>
      ))}
    </>
  )
}

export default function TeacherAllocation() {
  const { data: allocations = [], isLoading } = useQuery({
    queryKey: ['subject-allocations-all'],
    queryFn: () => academicsApi.subjectAllocations({}).then(r => r.data.results ?? r.data),
  })

  const groups = groupByTeacher(allocations)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Teacher-wise Allocation</h1>
        <p className="page-sub">Overview of which subjects and classes are assigned to each teacher. Click a row to expand details.</p>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : groups.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserSquare2 size={28} className="text-green-500" />
            </div>
            <h3 className="font-semibold text-gray-700 mb-1">No teacher assignments found</h3>
            <p className="text-sm text-gray-400">Go to <strong>Assign Subjects</strong> to assign subjects to teachers.</p>
          </div>
        ) : (
          <>
            <div className="px-5 py-3 border-b border-gray-100">
              <span className="text-sm text-gray-500">
                <strong className="text-gray-800">{groups.length}</strong> teacher{groups.length !== 1 ? 's' : ''} &nbsp;|&nbsp;
                <strong className="text-gray-800">{allocations.length}</strong> total assignments
              </span>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Teacher</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Subjects</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Classes Assigned</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {groups.map(group => <TeacherRow key={group.teacher_id} group={group} />)}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
