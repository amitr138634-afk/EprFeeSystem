import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { staffApi } from '../../services/api'

export default function LeaveBalance() {
  const [search, setSearch] = useState('')

  const { data: balances = [], isLoading } = useQuery({
    queryKey: ['leaveBalance', search],
    queryFn: () => staffApi.leaveBalance(search ? { search } : {}).then(r => r.data.results || r.data),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Leave Balance</h1><p className="page-sub">Staff leave allotment and usage summary</p></div>
      </div>

      <div className="card p-4">
        <div className="flex gap-4 items-end">
          <div>
            <label className="form-label">Search Staff</label>
            <input
              className="form-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name..."
            />
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Staff Name</th>
              <th>Leave Type</th>
              <th>Allotted</th>
              <th>Used</th>
              <th>Remaining</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td></tr>}
            {!isLoading && balances.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">No records found</td></tr>}
            {balances.map((d, i) => (
              <tr key={d.id || i}>
                <td className="text-gray-500">{i+1}</td>
                <td className="font-medium">{d.staff_name}</td>
                <td>{d.leave_type}</td>
                <td>{d.allotted}</td>
                <td>{d.used}</td>
                <td>
                  <span className={d.remaining <= 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                    {d.remaining}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
