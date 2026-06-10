import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'
import { schoolApi } from '../../services/api'

export default function CreateSchool() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm()

  const mutation = useMutation({
    mutationFn: (data) => schoolApi.create(data),
    onSuccess: () => {
      toast.success('School created successfully!')
      navigate('/schools')
    },
    onError: (err) => {
      const msg = err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to create school'
      toast.error(msg)
    },
  })

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Create New School</h1>
          <p className="text-sm text-gray-500">Register a new school with admin credentials</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(mutation.mutate)} className="space-y-5">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-700 mb-4">School Information</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: 'name', label: 'School Name', full: true, required: true },
              { name: 'code', label: 'School Code', required: true },
              { name: 'email', label: 'School Email', type: 'email', required: true },
              { name: 'phone', label: 'Phone', required: true },
              { name: 'address', label: 'Address', full: true },
              { name: 'city', label: 'City' },
              { name: 'state', label: 'State' },
              { name: 'pincode', label: 'Pincode' },
              { name: 'subscription_start', label: 'Subscription Start', type: 'date' },
              { name: 'subscription_end', label: 'Subscription End', type: 'date' },
            ].map(f => (
              <div key={f.name} className={f.full ? 'col-span-2' : ''}>
                <label className="form-label">{f.label} {f.required && <span className="text-red-500">*</span>}</label>
                <input
                  type={f.type || 'text'}
                  className="form-input"
                  {...register(f.name, { required: f.required ? `${f.label} is required` : false })}
                />
                {errors[f.name] && <p className="text-red-500 text-xs mt-1">{errors[f.name].message}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-700 mb-4">School Admin Credentials</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">First Name <span className="text-red-500">*</span></label>
              <input className="form-input" {...register('admin_first_name', { required: 'Required' })} />
            </div>
            <div>
              <label className="form-label">Last Name <span className="text-red-500">*</span></label>
              <input className="form-input" {...register('admin_last_name', { required: 'Required' })} />
            </div>
            <div>
              <label className="form-label">Admin Email <span className="text-red-500">*</span></label>
              <input type="email" className="form-input" {...register('admin_email', { required: 'Required' })} />
            </div>
            <div>
              <label className="form-label">Password <span className="text-red-500">*</span></label>
              <input type="password" className="form-input" {...register('admin_password', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })} />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={mutation.isLoading} className="btn-primary">
            {mutation.isLoading ? 'Creating...' : 'Create School'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  )
}
