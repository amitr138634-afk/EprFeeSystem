import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { staffApi } from '../../services/api'

const listOf = (r) => r.data.results || r.data

export default function LeaveBalance() {
  const [search, setSearch] = useState('')
  const [deptId, setDeptId] = useState('')

  const params = {
    ...(search && { search }),
    ...(deptId && { department_id: deptId }),
  }

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['leaveBalance', params],
    queryFn: () => staffApi.leaveBalance(params).then(listOf),
  })
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => staffApi.departments().then(listOf),
  })

  // Leave-type columns are uniform across staff (backend iterates all types).
  const leaveCols = rows[0]?.balances?.map(b => ({ id: b.leave_type_id, name: b.leave_type })) || []

  const handleExport = () => {
    const header = ['Emp ID', 'Staff Name', 'Department', ...leaveCols.flatMap(c => [`${c.name} Allotted`, `${c.name} Used`, `${c.name} Remaining`])]
    const csv = [
      header.join(','),
      ...rows.map(r => [
        r.employee_id, `"${r.staff_name}"`, `"${r.department || ''}"`,
        ...r.balances.flatMap(b => [b.allowed, b.used, b.remaining]),
      ].join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'leave-balance.csv'
    a.click()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Leave Balance</h1><p className="page-sub">Staff leave allotment and usage summary</p></div>
        <button onClick={handleExport} className="btn-secondary flex items-center gap-2"><Download size={16} /> Export</button>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="form-label">Search Staff</label>
            <input className="form-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or Emp ID" />
          </div>
          <div>
            <label className="form-label">Department</label>
            <select className="form-input" value={deptId} onChange={e => setDeptId(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Emp ID</th>
                <th className="px-3 py-2 text-left">Staff Name</th>
                <th className="px-3 py-2 text-left">Department</th>
                {leaveCols.map(c => (
                  <th key={c.id} className="px-3 py-2 text-center" title="Allotted / Used / Remaining">{c.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={4 + leaveCols.length} className="text-center py-8 text-gray-400">Loading...</td></tr>}
              {!isLoading && rows.length === 0 && <tr><td colSpan={4 + leaveCols.length} className="text-center py-8 text-gray-400">No records found</td></tr>}
              {rows.map((r, i) => (
                <tr key={r.staff_id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2.5 text-gray-400">{i + 1}</td>
                  <td className="px-3 py-2.5 text-gray-600">{r.employee_id}</td>
                  <td className="px-3 py-2.5 font-medium text-gray-800">{r.staff_name}</td>
                  <td className="px-3 py-2.5 text-gray-600">{r.department || '—'}</td>
                  {r.balances.map(b => (
                    <td key={b.leave_type_id} className="px-3 py-2.5 text-center">
                      <span className="text-gray-500">{b.allowed}</span>
                      <span className="text-gray-300"> / </span>
                      <span className="text-gray-500">{b.used}</span>
                      <span className="text-gray-300"> / </span>
                      <span className={b.remaining <= 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>{b.remaining}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {leaveCols.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
            Each cell shows Allotted / Used / <span className="text-gray-600">Remaining</span>
          </div>
        )}
      </div>
    </div>
  )
}
