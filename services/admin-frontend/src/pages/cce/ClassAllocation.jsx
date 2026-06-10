import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, ChevronDown, LayoutGrid } from 'lucide-react'
import { academicsApi } from '../../services/api'

function groupByClassSection(allocations) {
  const map = {}
  allocations.forEach(alloc => {
    const classId = alloc.class_id ?? alloc.class_ref ?? alloc.class
    const sectionId = alloc.section_id ?? alloc.section
    const className = alloc.class_name ?? alloc.class_detail?.name ?? `Class ${classId}`
    const sectionName = alloc.section_name ?? alloc.section_detail?.name ?? `Section ${sectionId}`
    const key = `${classId}-${sectionId}`
    if (!map[key]) {
      map[key] = {
        key,
        class_id: classId,
        section_id: sectionId,
        class_name: className,
        section_name: sectionName,
        subjects: [],
      }
    }
    const subjectName = alloc.subject_name ?? alloc.subject_detail?.name ?? `Subject ${alloc.subject_id ?? alloc.subject}`
    map[key].subjects.push({
      id: alloc.id,
      name: subjectName,
      teacher: alloc.teacher_name ?? alloc.teacher_detail
        ? `${alloc.teacher_detail?.first_name ?? ''} ${alloc.teacher_detail?.last_name ?? ''}`.trim()
        : null,
    })
  })
  return Object.values(map).sort((a, b) => a.class_name.localeCompare(b.class_name) || a.section_name.localeCompare(b.section_name))
}

function GroupRow({ group }) {
  const [expanded, setExpanded] = useState(false)

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
            <span className="text-sm font-semibold text-gray-800">{group.class_name}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className="badge badge-blue text-xs">Section {group.section_name}</span>
        </td>
        <td className="px-4 py-3">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
            {group.subjects.length}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {group.subjects.map(s => s.name).join(', ')}
        </td>
      </tr>
      {expanded && group.subjects.map(sub => (
        <tr key={sub.id} className="bg-blue-50/40 border-l-4 border-l-blue-300">
          <td className="px-4 py-2 pl-10 text-xs text-gray-400" colSpan={1}></td>
          <td className="px-4 py-2 text-sm text-gray-700 font-medium">{sub.name}</td>
          <td className="px-4 py-2" colSpan={2}>
            <span className="text-xs text-gray-500">
              {sub.teacher ? <>Teacher: <span className="font-medium text-gray-700">{sub.teacher}</span></> : <span className="italic text-gray-400">No teacher assigned</span>}
            </span>
          </td>
        </tr>
      ))}
    </>
  )
}

export default function ClassAllocation() {
  const { data: allocations = [], isLoading } = useQuery({
    queryKey: ['subject-allocations-all'],
    queryFn: () => academicsApi.subjectAllocations({}).then(r => r.data.results ?? r.data),
  })

  const groups = groupByClassSection(allocations)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Class-wise Allocation</h1>
        <p className="page-sub">Overview of subjects allocated to each class and section. Click a row to expand subjects.</p>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : groups.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LayoutGrid size={28} className="text-blue-500" />
            </div>
            <h3 className="font-semibold text-gray-700 mb-1">No allocations found</h3>
            <p className="text-sm text-gray-400">Go to <strong>Assign Subjects</strong> to allocate subjects to class sections.</p>
          </div>
        ) : (
          <>
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                <strong className="text-gray-800">{groups.length}</strong> class-section{groups.length !== 1 ? 's' : ''} &nbsp;|&nbsp;
                <strong className="text-gray-800">{allocations.length}</strong> total assignments
              </span>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Class</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Section</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Subjects</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject Names</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {groups.map(group => <GroupRow key={group.key} group={group} />)}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
