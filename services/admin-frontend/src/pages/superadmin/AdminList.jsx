import { useQuery } from '@tanstack/react-query'
import { Plus, Mail, Phone, Building2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DataTable from '../../components/common/DataTable'
import { authApi, schoolApi } from '../../services/api'
import { format } from 'date-fns'

export default function AdminList() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['school-admins'],
    queryFn: () => authApi.listSchoolAdmins().then((r) => r.data.results || r.data),
  })

  const { data: schools } = useQuery({
    queryKey: ['schools-mini'],
    queryFn: () => schoolApi.list().then((r) => r.data.results || r.data),
  })

  const schoolMap = Object.fromEntries((schools || []).map((s) => [s.id, s]))

  const admins = data || []

  const columns = [
    { key: 'full_name', label: 'Name' },
    {
      key: 'email',
      label: 'Email',
      render: (v) => (
        <span className="inline-flex items-center gap-1 text-gray-700">
          <Mail size={13} className="text-gray-400" /> {v}
        </span>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (v) =>
        v ? (
          <span className="inline-flex items-center gap-1 text-gray-700">
            <Phone size={13} className="text-gray-400" /> {v}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: 'school_id',
      label: 'School',
      render: (v) => (
        <span className="inline-flex items-center gap-1 text-gray-700">
          <Building2 size={13} className="text-gray-400" />
          {schoolMap[v]?.name || `#${v}`}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (v) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            v ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {v ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (v) => (v ? format(new Date(v), 'd MMM yyyy') : '—'),
    },
  ]

  return (
    <div className="space-y-4" data-testid="admin-list-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">School Admins</h1>
          <p className="text-sm text-gray-500">All school-admin accounts across every school</p>
        </div>
        <button
          onClick={() => navigate('/admins/create')}
          data-testid="create-admin-btn"
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Create Admin
        </button>
      </div>

      <div className="card p-4">
        <DataTable
          columns={columns}
          data={admins}
          loading={isLoading}
          emptyText="No school admins yet"
        />
      </div>
    </div>
  )
}
