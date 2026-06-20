import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, X, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { staffApi } from '../../services/api'

const STATUS_FILTERS = ['All', 'Pending', 'Approved', 'Rejected']
const listOf = (r) => r.data.results || r.data

const statusBadge = (status) => {
  if (status === 'approved') return <span className="badge badge-green">Approved</span>
  if (status === 'pending') return <span className="badge badge-yellow">Pending</span>
  if (status === 'rejected') return <span className="badge badge-red">Rejected</span>
  return <span className="badge badge-gray">{status}</span>
}

const emptyForm = { staff: '', leave_type: '', from_date: '', to_date: '', reason: '' }

export default function LeaveRequests() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('All')
  const [deptId, setDeptId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const params = {
    ...(statusFilter !== 'All' && { status: statusFilter.toLowerCase() }),
    ...(deptId && { department_id: deptId }),
  }

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['leaveRequests', params],
    queryFn: () => staffApi.leaveRequests(params).then(listOf),
  })
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => staffApi.departments().then(listOf),
  })
  const { data: leaveTypes = [] } = useQuery({
    queryKey: ['leaveTypes'],
    queryFn: () => staffApi.leaveTypes().then(listOf),
  })
  const { data: staffList = [] } = useQuery({
    queryKey: ['staff-active-list'],
    queryFn: () => staffApi.list({ status: 'active' }).then(listOf),
  })

  const actionMutation = useMutation({
    mutationFn: ({ id, action }) => staffApi.leaveAction(id, action),
    onSuccess: () => { qc.invalidateQueries(['leaveRequests']); toast.success('Action applied!') },
    onError: () => toast.error('Failed to apply action'),
  })

  const createMutation = useMutation({
    mutationFn: (data) => staffApi.createLeaveRequest(data),
    onSuccess: () => {
      qc.invalidateQueries(['leaveRequests'])
      setShowForm(false); setForm(emptyForm)
      toast.success('Leave request submitted!')
    },
    onError: () => toast.error('Failed to submit request'),
  })

  const submit = () => {
    if (!form.staff || !form.leave_type || !form.from_date || !form.to_date) {
      toast.error('Please fill staff, leave type and dates')
      return
    }
    createMutation.mutate(form)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Leave Requests</h1><p className="page-sub">Review and manage staff leave requests</p></div>
        <button onClick={() => { setForm(emptyForm); setShowForm(v => !v) }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Request
        </button>
      </div>

      {showForm && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">New Leave Request</h3>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="form-label">Staff</label>
              <select className="form-input" value={form.staff} onChange={e => setForm(p=>({...p,staff:e.target.value}))}>
                <option value="">Select Staff</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.employee_id})</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Leave Type</label>
              <select className="form-input" value={form.leave_type} onChange={e => setForm(p=>({...p,leave_type:e.target.value}))}>
                <option value="">Select Type</option>
                {leaveTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">From Date</label>
              <input type="date" className="form-input" value={form.from_date} onChange={e => setForm(p=>({...p,from_date:e.target.value}))} />
            </div>
            <div>
              <label className="form-label">To Date</label>
              <input type="date" className="form-input" value={form.to_date} onChange={e => setForm(p=>({...p,to_date:e.target.value}))} />
            </div>
            <div>
              <label className="form-label">Reason</label>
              <input className="form-input" value={form.reason} onChange={e => setForm(p=>({...p,reason:e.target.value}))} placeholder="Reason" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={submit} disabled={createMutation.isLoading} className="btn-primary btn-sm">Submit</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary btn-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="card p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="form-label">Status</label>
            <div className="flex gap-2">
              {STATUS_FILTERS.map(f => (
                <button key={f} onClick={() => setStatusFilter(f)} className={statusFilter === f ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}>{f}</button>
              ))}
            </div>
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

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th><th>Staff Name</th><th>Department</th><th>Leave Type</th>
              <th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={10} className="text-center py-8 text-gray-400">Loading...</td></tr>}
            {!isLoading && requests.length === 0 && <tr><td colSpan={10} className="text-center py-8 text-gray-400">No leave requests found</td></tr>}
            {requests.map((d, i) => (
              <tr key={d.id}>
                <td className="text-gray-500">{i+1}</td>
                <td className="font-medium">{d.staff_name}</td>
                <td className="text-gray-600">{d.department_name || '—'}</td>
                <td>{d.leave_type_name}</td>
                <td>{d.from_date}</td>
                <td>{d.to_date}</td>
                <td>{d.days}</td>
                <td className="max-w-xs truncate">{d.reason}</td>
                <td>{statusBadge(d.status)}</td>
                <td>
                  {d.status === 'pending' ? (
                    <div className="flex gap-1">
                      <button onClick={() => actionMutation.mutate({ id: d.id, action: 'approve' })} disabled={actionMutation.isLoading} className="p-1.5 hover:bg-green-50 rounded text-green-600" title="Approve"><Check size={14}/></button>
                      <button onClick={() => actionMutation.mutate({ id: d.id, action: 'reject' })} disabled={actionMutation.isLoading} className="p-1.5 hover:bg-red-50 rounded text-red-500" title="Reject"><X size={14}/></button>
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
