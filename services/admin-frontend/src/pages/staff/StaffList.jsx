import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, Eye, Edit } from 'lucide-react'
import DataTable from '../../components/common/DataTable'
import { staffApi } from '../../services/api'

export default function StaffList() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['staff', search, page],
    queryFn: () => staffApi.list({ search, page }).then(r => r.data),
    keepPreviousData: true,
  })

  const staff = data?.results || data || []
  const total = data?.count || staff.length

  const columns = [
    { key: 'employee_id', label: 'Emp. ID', width: '100px' },
    {
      key: 'full_name',
      label: 'Name',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs font-semibold">
            {row.first_name?.charAt(0)}
          </div>
          <span className="font-medium">{row.full_name || `${row.first_name} ${row.last_name}`}</span>
        </div>
      ),
    },
    { key: 'department_name', label: 'Department' },
    { key: 'designation_name', label: 'Designation' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    {
      key: 'staff_type',
      label: 'Type',
      render: (val) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          val === 'teaching' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
        }`}>
          {val === 'teaching' ? 'Teaching' : 'Non-Teaching'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          val === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {val}
        </span>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button className="p-1.5 hover:bg-blue-50 rounded text-blue-600"><Eye size={14} /></button>
          <button className="p-1.5 hover:bg-green-50 rounded text-green-600"><Edit size={14} /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Staff List</h1>
          <p className="text-sm text-gray-500">Manage all staff members</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Staff
        </button>
      </div>

      <div className="card p-4">
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, employee ID, email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="form-input pl-9"
            />
          </div>
        </div>
        <DataTable
          columns={columns}
          data={staff}
          loading={isLoading}
          emptyText="No staff found"
          pagination={{ page, pageSize: 20, total }}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
