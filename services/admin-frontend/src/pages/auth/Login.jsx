import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Eye, EyeOff, GraduationCap, Users, BarChart3, Shield, ArrowRight } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { authApi } from '../../services/api'

const FEATURES = [
  { icon: GraduationCap, title: 'Student Management', desc: 'Track admissions, attendance & performance' },
  { icon: Users, title: 'Multi-Tenant', desc: 'One platform for unlimited schools' },
  { icon: BarChart3, title: 'Fee & Reports', desc: 'Collections, receipts and analytics' },
  { icon: Shield, title: 'Role-Based Access', desc: 'Super admin, school admin, staff & teachers' },
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
      const msg = err.response?.data?.detail || 'Invalid credentials'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e2a4a 100%)' }}>

        {/* Background decorative circles */}
        <div className="absolute top-[-80px] right-[-80px] w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
        <div className="absolute bottom-[-60px] left-[-60px] w-72 h-72 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #60a5fa, transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #93c5fd, transparent)' }} />

        {/* Top logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(59,130,246,0.25)', border: '1px solid rgba(59,130,246,0.4)' }}>
              <GraduationCap size={26} className="text-blue-400" />
            </div>
            <div>
              <p className="text-white font-bold text-xl tracking-tight">School ERP</p>
              <p className="text-blue-400 text-xs uppercase tracking-widest">Management System</p>
            </div>
          </div>
        </div>

        {/* Centre hero */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
            Manage your school<br />
            <span className="text-blue-400">smarter & faster</span>
          </h1>
          <p className="text-slate-400 text-base mb-10 max-w-md">
            A complete multi-tenant ERP platform for schools — admissions, attendance, fees, timetable and more in one place.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title}
                className="flex items-start gap-3 p-4 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'rgba(59,130,246,0.2)' }}>
                  <Icon size={17} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{title}</p>
                  <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10">
          <p className="text-slate-500 text-xs">
            © 2026 School ERP System · Secure · Multi-Tenant · Cloud Ready
          </p>
        </div>
      </div>

      {/* ── Right login panel ── */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-[420px]">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <GraduationCap size={22} className="text-white" />
            </div>
            <p className="font-bold text-xl text-gray-900">School ERP</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
              <p className="text-gray-500 text-sm mt-1">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Username or Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Username or Email
                </label>
                <input
                  type="text"
                  autoComplete="username"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  placeholder="Enter username or email"
                  {...register('email', { required: 'Username or email is required' })}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    placeholder="Enter your password"
                    {...register('password', { required: 'Password is required' })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-colors mt-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>Sign In <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            {/* Default credentials hint */}
            <div className="mt-6 p-3.5 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-xs text-blue-700 font-semibold mb-1">Default Super Admin</p>
              <p className="text-xs text-blue-600">Email: <span className="font-mono">superadmin@erp.com</span></p>
              <p className="text-xs text-blue-600">Password: <span className="font-mono">Admin@123</span></p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-5">
            Multi-Tenant School ERP · Secure Login
          </p>
        </div>
      </div>
    </div>
  )
}
