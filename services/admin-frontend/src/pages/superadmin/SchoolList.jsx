import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Plus, Eye, Edit, ToggleLeft, ToggleRight, X, Building2, Mail, Phone, MapPin, Database, Calendar, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import DataTable from '../../components/common/DataTable'
import { schoolApi, authApi } from '../../services/api'

/* ── View Modal ─────────────────────────────────────────────────────────── */
function ViewModal({ school, onClose }) {
  const { data: admins } = useQuery({
    queryKey: ['school-admins-for', school.id],
    queryFn: () => authApi.listSchoolAdmins({ school_id: school.id }).then(r => r.data.results || r.data),
  })

  const schoolAdmins = (admins || []).filter(a => a.school_id === school.id)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold">
              {school.code?.charAt(0)}
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">{school.name}</h2>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${school.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {school.status}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Building2, label: 'School Code', value: school.code },
              { icon: Mail,      label: 'Email',       value: school.email },
              { icon: Phone,     label: 'Phone',       value: school.phone },
              { icon: MapPin,    label: 'City',        value: `${school.city}, ${school.state} ${school.pincode}` },
              { icon: Database,  label: 'Database',    value: school.db_name },
              { icon: Users,     label: 'Max Students', value: school.max_students },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <Icon size={15} className="text-blue-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 font-medium">{label}</p>
                  <p className="text-sm text-gray-800 font-semibold truncate">{value || '—'}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Address */}
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-400 font-medium mb-1">Address</p>
            <p className="text-sm text-gray-800">{school.address || '—'}</p>
          </div>

          {/* Subscription */}
          {(school.subscription_start || school.subscription_end) && (
            <div className="flex gap-3">
              <div className="flex-1 p-3 bg-blue-50 rounded-xl">
                <p className="text-xs text-blue-400 font-medium">Subscription Start</p>
                <p className="text-sm text-blue-800 font-semibold">{school.subscription_start || '—'}</p>
              </div>
              <div className="flex-1 p-3 bg-blue-50 rounded-xl">
                <p className="text-xs text-blue-400 font-medium">Subscription End</p>
                <p className="text-sm text-blue-800 font-semibold">{school.subscription_end || '—'}</p>
              </div>
            </div>
          )}

          {/* School Admins */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Users size={14} /> School Admins
            </p>
            {schoolAdmins.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No admins assigned</p>
            ) : (
              <div className="space-y-2">
                {schoolAdmins.map(a => (
                  <div key={a.id} className="flex items-center gap-3 p-3 bg-violet-50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-violet-200 text-violet-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {(a.full_name || a.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{a.full_name}</p>
                      <p className="text-xs text-gray-500">{a.email}</p>
                      {a.username && <p className="text-xs text-violet-600 font-mono">@{a.username}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Edit Modal ─────────────────────────────────────────────────────────── */
function EditModal({ school, onClose, onSaved }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: school })
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data) => schoolApi.update(school.id, data),
    onSuccess: () => {
      qc.invalidateQueries(['schools'])
      toast.success('School updated')
      onSaved()
    },
    onError: (err) => {
      const d = err.response?.data
      const msg = d?.detail || (typeof d === 'object' ? Object.values(d).flat().join(' | ') : 'Update failed')
      toast.error(msg)
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Edit School</h2>
            <p className="text-xs text-gray-400">{school.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(mutation.mutate)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">School Name <span className="text-red-500">*</span></label>
              <input className="form-input" {...register('name', { required: 'Required' })} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" className="form-input" {...register('email')} />
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input className="form-input" {...register('phone')} />
            </div>
            <div className="col-span-2">
              <label className="form-label">Address</label>
              <input className="form-input" {...register('address')} />
            </div>
            <div>
              <label className="form-label">City</label>
              <input className="form-input" {...register('city')} />
            </div>
            <div>
              <label className="form-label">State</label>
              <input className="form-input" {...register('state')} />
            </div>
            <div>
              <label className="form-label">Pincode</label>
              <input className="form-input" {...register('pincode')} />
            </div>
            <div>
              <label className="form-label">Max Students</label>
              <input type="number" className="form-input" {...register('max_students')} />
            </div>
            <div>
              <label className="form-label">Subscription Start</label>
              <input type="date" className="form-input" {...register('subscription_start')} />
            </div>
            <div>
              <label className="form-label">Subscription End</label>
              <input type="date" className="form-input" {...register('subscription_end')} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={mutation.isPending} className="btn-primary">
              {mutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Main Page ──────────────────────────────────────────────────────────── */
export default function SchoolList() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [viewSchool, setViewSchool] = useState(null)
  const [editSchool, setEditSchool] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['schools'],
    queryFn: () => schoolApi.list().then(r => r.data.results || r.data),
  })

  const toggleMutation = useMutation({
    mutationFn: (id) => schoolApi.toggleStatus(id),
    onSuccess: () => {
      qc.invalidateQueries(['schools'])
      toast.success('School status updated')
    },
  })

  const schools = data || []

  const columns = [
    { key: 'code', label: 'Code', width: '80px' },
    { key: 'name', label: 'School Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'city', label: 'City' },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          val === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
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
          <button
            onClick={() => setViewSchool(row)}
            title="View details"
            className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => setEditSchool(row)}
            title="Edit school"
            className="p-1.5 hover:bg-green-50 rounded-lg text-green-600 transition-colors"
          >
            <Edit size={15} />
          </button>
          <button
            onClick={() => toggleMutation.mutate(row.id)}
            title={row.status === 'active' ? 'Deactivate' : 'Activate'}
            className={`p-1.5 rounded-lg transition-colors ${row.status === 'active' ? 'hover:bg-red-50 text-red-500' : 'hover:bg-green-50 text-green-600'}`}
          >
            {row.status === 'active' ? <ToggleLeft size={18} /> : <ToggleRight size={18} />}
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Schools</h1>
          <p className="text-sm text-gray-500">Manage all registered schools</p>
        </div>
        <button onClick={() => navigate('/schools/create')} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Create School
        </button>
      </div>

      <div className="card p-4">
        <DataTable
          columns={columns}
          data={schools}
          loading={isLoading}
          emptyText="No schools registered"
        />
      </div>

      {viewSchool && <ViewModal school={viewSchool} onClose={() => setViewSchool(null)} />}
      {editSchool && (
        <EditModal
          school={editSchool}
          onClose={() => setEditSchool(null)}
          onSaved={() => setEditSchool(null)}
        />
      )}
    </div>
  )
}
