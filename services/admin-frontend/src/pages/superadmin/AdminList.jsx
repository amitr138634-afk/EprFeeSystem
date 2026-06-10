import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Plus, Mail, Phone, Building2, Trash2, KeyRound, X, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import DataTable from '../../components/common/DataTable'
import { authApi, schoolApi } from '../../services/api'

/* ── Reset Password Modal ───────────────────────────────────────────────── */
function ResetPasswordModal({ admin, onClose }) {
  const { register, handleSubmit, formState: { errors }, watch } = useForm()
  const [showPw, setShowPw] = useState(false)

  const mutation = useMutation({
    mutationFn: ({ new_password }) => authApi.resetAdminPassword(admin.id, new_password),
    onSuccess: () => { toast.success('Password updated'); onClose() },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to update password'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center">
              <KeyRound size={17} className="text-orange-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Reset Password</h2>
              <p className="text-xs text-gray-400">{admin.full_name || admin.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(mutation.mutate)} className="p-6 space-y-4">
          <div>
            <label className="form-label">New Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                className="form-input pr-10"
                placeholder="Min 8 characters"
                {...register('new_password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Minimum 8 characters' },
                })}
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.new_password && <p className="text-red-500 text-xs mt-1">{errors.new_password.message}</p>}
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors">
              {mutation.isPending ? 'Updating…' : 'Update Password'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Delete Confirm Modal ───────────────────────────────────────────────── */
function DeleteModal({ admin, onClose, onDeleted }) {
  const mutation = useMutation({
    mutationFn: () => authApi.deleteSchoolAdmin(admin.id),
    onSuccess: () => { toast.success('Admin deleted'); onDeleted() },
    onError: (err) => toast.error(err.response?.data?.detail || 'Delete failed'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex flex-col items-center text-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle size={26} className="text-red-500" />
          </div>
          <h2 className="font-bold text-gray-900 text-lg">Delete Admin?</h2>
          <p className="text-gray-500 text-sm">
            Are you sure you want to delete <span className="font-semibold text-gray-800">{admin.full_name || admin.email}</span>?
            This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors"
          >
            {mutation.isPending ? 'Deleting…' : 'Yes, Delete'}
          </button>
          <button onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  )
}

/* ── Main Page ──────────────────────────────────────────────────────────── */
export default function AdminList() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [resetAdmin, setResetAdmin] = useState(null)
  const [deleteAdmin, setDeleteAdmin] = useState(null)

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
    {
      key: 'full_name',
      label: 'Name',
      render: (v, row) => (
        <div>
          <p className="font-medium text-gray-800">{v}</p>
          {row.username && <p className="text-xs text-violet-600 font-mono">@{row.username}</p>}
        </div>
      ),
    },
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
      render: (v) => v ? (
        <span className="inline-flex items-center gap-1 text-gray-700">
          <Phone size={13} className="text-gray-400" /> {v}
        </span>
      ) : <span className="text-gray-400">—</span>,
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
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {v ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (v) => v ? format(new Date(v), 'd MMM yyyy') : '—',
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setResetAdmin(row)}
            title="Reset password"
            className="p-1.5 hover:bg-orange-50 rounded-lg text-orange-500 transition-colors"
          >
            <KeyRound size={15} />
          </button>
          <button
            onClick={() => setDeleteAdmin(row)}
            title="Delete admin"
            className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
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

      {resetAdmin && <ResetPasswordModal admin={resetAdmin} onClose={() => setResetAdmin(null)} />}
      {deleteAdmin && (
        <DeleteModal
          admin={deleteAdmin}
          onClose={() => setDeleteAdmin(null)}
          onDeleted={() => { setDeleteAdmin(null); qc.invalidateQueries(['school-admins']) }}
        />
      )}
    </div>
  )
}
