import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'
import { authApi, schoolApi } from '../../services/api'

export default function CreateAdmin() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm()

  const { data: schools } = useQuery({
    queryKey: ['schools-list-for-admin'],
    queryFn: () => schoolApi.list().then((r) => r.data.results || r.data),
  })

  const mutation = useMutation({
    mutationFn: (payload) => authApi.createSchoolAdmin(payload),
    onSuccess: () => {
      toast.success('School admin created')
      navigate('/admins')
    },
    onError: (err) => {
      const d = err.response?.data
      const msg =
        d?.detail ||
        (typeof d === 'object'
          ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
          : 'Failed to create admin')
      toast.error(msg)
    },
  })

  const onSubmit = (data) => {
    mutation.mutate({ ...data, school_id: Number(data.school_id) })
  }

  return (
    <div className="space-y-4 max-w-2xl" data-testid="create-admin-page">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Create School Admin</h1>
          <p className="text-sm text-gray-500">Add a new admin user to an existing school</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-5 space-y-4">
        <div>
          <label className="form-label">
            School <span className="text-red-500">*</span>
          </label>
          <select
            className="form-input"
            data-testid="school-select"
            {...register('school_id', { required: 'School is required' })}
          >
            <option value="">— Select School —</option>
            {(schools || []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
          {errors.school_id && <p className="text-red-500 text-xs mt-1">{errors.school_id.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              className="form-input"
              data-testid="first-name-input"
              {...register('first_name', { required: 'First name is required' })}
            />
            {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
          </div>
          <div>
            <label className="form-label">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              className="form-input"
              data-testid="last-name-input"
              {...register('last_name', { required: 'Last name is required' })}
            />
            {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              className="form-input"
              data-testid="email-input"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' },
              })}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="form-label">Phone</label>
            <input className="form-input" data-testid="phone-input" {...register('phone')} />
          </div>
        </div>

        <div>
          <label className="form-label">
            Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            className="form-input"
            data-testid="password-input"
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Minimum 8 characters' },
            })}
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={mutation.isPending} className="btn-primary" data-testid="submit-btn">
            {mutation.isPending ? 'Creating…' : 'Create Admin'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
