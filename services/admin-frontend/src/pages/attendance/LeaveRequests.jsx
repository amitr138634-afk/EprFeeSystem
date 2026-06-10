import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { staffApi } from '../../services/api'

const STATUS_FILTERS = ['All', 'Pending', 'Approved', 'Rejected']

const statusBadge = (status) => {
  if (status === 'approved') return <span className="badge badge-green">Approved</span>
  if (status === 'pending') return <span className="badge badge-yellow">Pending</span>
  if (status === 'rejected') return <span className="badge badge-red">Rejected</span>
  return <span className="badge badge-gray">{status}</span>
}

export default function LeaveRequests() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('All')

  const params = statusFilter !== 'All' ? { status: statusFilter.toLowerCase() } : {}

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['leaveRequests', statusFilter],
    queryFn: () => staffApi.leaveRequests(params).then(r => r.data.results || r.data),
  })

  const actionMutation = useMutation({
    mutationFn: ({ id, action }) => staffApi.leaveAction(id, action),
    onSuccess: () => {
      qc.invalidateQueries(['leaveRequests'])
      toast.success('Action applied!')
    },
    onError: () => toast.error('Failed to apply action'),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Leave Requests</h1><p className="page-sub">Review and manage staff leave requests</p></div>
      </div>

      <div className="flex gap-2">
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={statusFilter === f ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Staff Name</th>
              <th>Leave Type</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Days</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={9} className="text-center py-8 text-gray-400">Loading...</td></tr>}
            {!isLoading && requests.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-gray-400">No leave requests found</td></tr>}
            {requests.map((d, i) => (
              <tr key={d.id}>
                <td className="text-gray-500">{i+1}</td>
                <td className="font-medium">{d.staff_name}</td>
                <td>{d.leave_type}</td>
                <td>{d.start_date}</td>
                <td>{d.end_date}</td>
                <td>{d.days}</td>
                <td className="max-w-xs truncate">{d.reason}</td>
                <td>{statusBadge(d.status)}</td>
                <td>
                  {d.status === 'pending' ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => actionMutation.mutate({ id: d.id, action: 'approve' })}
                        disabled={actionMutation.isLoading}
                        className="p-1.5 hover:bg-green-50 rounded text-green-600"
                        title="Approve"
                      >
                        <Check size={14}/>
                      </button>
                      <button
                        onClick={() => actionMutation.mutate({ id: d.id, action: 'reject' })}
                        disabled={actionMutation.isLoading}
                        className="p-1.5 hover:bg-red-50 rounded text-red-500"
                        title="Reject"
                      >
                        <X size={14}/>
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
