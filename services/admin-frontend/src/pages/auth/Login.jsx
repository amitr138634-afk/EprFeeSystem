import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Eye, EyeOff, GraduationCap, Users, BarChart3, Shield, ArrowRight } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { authApi } from '../../services/api'

const FEATURES = [
  { icon: GraduationCap, title: 'Student Management', desc: 'Track admissions, attendance & performance' },
  { icon: Users,         title: 'Multi-Tenant',       desc: 'One platform for unlimited schools' },
  { icon: BarChart3,     title: 'Reports & Analytics', desc: 'Collections, receipts and analytics' },
  { icon: Shield,        title: 'Role-Based Access',   desc: 'Super admin, school admin & staff' },
]

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await authApi.login(data)
      login(res.data.user, { access: res.data.access, refresh: res.data.refresh })
      toast.success(`Welcome back, ${res.data.user.full_name}!`)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* Left — branding */}
      <div className="hidden lg:flex lg:w-[55%] flex-col justify-between p-12 bg-gray-900 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
            <GraduationCap size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-base leading-none">Shyam ERP Solutions</p>
            <p className="text-gray-400 text-xs tracking-widest uppercase mt-0.5">Admin Panel</p>
          </div>
        </div>

        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Manage your school<br />
            <span className="text-green-400">smarter & faster</span>
          </h1>
          <p className="text-gray-400 text-base mb-10 max-w-md leading-relaxed">
            A complete multi-tenant ERP for schools — admissions, attendance, fees, timetable and more in one place.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/8 hover:bg-white/8 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={16} className="text-green-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{title}</p>
                  <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-gray-600 text-xs">© 2026 Shyam ERP Solutions · Secure · Multi-Tenant</p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center">
              <GraduationCap size={18} className="text-white" />
            </div>
            <p className="font-bold text-lg text-gray-900">Shyam ERP Solutions</p>
          </div>

          <div className="card p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Sign in</h2>
            <p className="text-gray-500 text-sm mb-7">Enter your credentials to continue</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="form-label">Username or Email</label>
                <input
                  type="text"
                  autoComplete="username"
                  className="form-input"
                  placeholder="admin@school.com"
                  {...register('email', { required: 'Required' })}
                />
                {errors.email && <p className="form-error">{errors.email.message}</p>}
              </div>

              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="form-input pr-10"
                    placeholder="••••••••"
                    {...register('password', { required: 'Required' })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="form-error">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-1"
              >
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
                  : <>Sign In <ArrowRight size={15} /></>
                }
              </button>
            </form>

            <div className="mt-5 p-3.5 rounded-lg bg-green-50 border border-green-100">
              <p className="text-xs font-semibold text-green-800 mb-1">Default Super Admin</p>
              <p className="text-xs text-green-700">Email: <span className="font-mono">superadmin@erp.com</span></p>
              <p className="text-xs text-green-700">Password: <span className="font-mono">Admin@123</span></p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-5">
            Shyam ERP Solutions · Secure Login
          </p>
        </div>
      </div>
    </div>
  )
}
