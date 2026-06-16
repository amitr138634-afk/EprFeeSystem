import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Eye, EyeOff, ArrowRight, Check, IndianRupee, Calendar } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { authApi } from '../../services/api'
import api from '../../services/api'
import { Eye, EyeOff, ArrowRight, Check, IndianRupee } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { authApi } from '../../services/api'
import { notify } from '../../lib/notify'

const SERVICES = [
  'Fee Collection',
  'Books & Uniforms',
  'Transport',
  'Front Desk',
  'Receipts & History',
  'Reports',
]

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState('')
  const { register, handleSubmit, formState: { errors } } = useForm()
  const { register, handleSubmit, setError, clearErrors, formState: { errors } } = useForm()

  // Surface a message left by the auth redirect (e.g. "session expired").
  useEffect(() => {
    const msg = sessionStorage.getItem('auth_message')
    if (msg) {
      notify.error(msg)
      sessionStorage.removeItem('auth_message')
    }
  }, [])

  // Fetch available sessions on mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await api.get('/masters/sessions/')
        const sessionData = Array.isArray(res.data) ? res.data : (res.data.results || [])
        setSessions(sessionData)
        // Select first (latest) session by default
        if (sessionData.length > 0) {
          setSelectedSession(sessionData[0].id)
        }
      } catch (err) {
        console.error('Failed to load sessions:', err)
        // Don't show error to user on login page, just log it
      }
    }
    fetchSessions()
  }, [])

  const onSubmit = async (data) => {
    setLoading(true)
    clearErrors()
    try {
      const loginData = { ...data }
      if (selectedSession) {
        loginData.session_id = selectedSession
      }
      const res = await authApi.login(loginData)
      
      // Extract current_session from response
      const currentSession = res.data.current_session || null
      
      login(res.data.user, { access: res.data.access, refresh: res.data.refresh }, currentSession)
      toast.success(`Welcome back, ${res.data.user.full_name}!`)
      const res = await authApi.login(data)
      login(res.data.user, { access: res.data.access, refresh: res.data.refresh })
      notify.success(`Welcome back, ${res.data.user.full_name}!`, { title: 'Signed in' })
      navigate('/')
    } catch (err) {
      const resp = err.response?.data || {}
      const code = Array.isArray(resp.code) ? resp.code[0] : resp.code
      const message = (Array.isArray(resp.detail) ? resp.detail[0] : resp.detail)
        || 'Unable to sign in. Please check your credentials and try again.'

      if (code === 'user_not_found') {
        setError('email', { type: 'server', message: 'No account found with this username or email.' })
      } else if (code === 'wrong_password') {
        setError('password', { type: 'server', message: 'Incorrect password. Please try again.' })
      } else if (code === 'inactive') {
        setError('email', { type: 'server', message })
      }
      notify.error(message, { title: 'Sign-in failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* Left — light green service banner (big screens) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-center px-14 xl:px-24 bg-green-50 border-r border-green-100">
        <div className="max-w-xl">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-green-600 flex items-center justify-center shadow-sm">
              <IndianRupee size={24} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg leading-none">Shyam ERP Services</p>
              <p className="text-green-700 text-xs tracking-[0.2em] uppercase mt-1.5">Fee Panel</p>
            </div>
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold text-gray-900 leading-[1.1] mb-5">
            Complete fee<br />
            <span className="text-green-600">management, simplified</span>
          </h1>
          <p className="text-gray-600 text-base leading-relaxed mb-10 max-w-md">
            Collect fees and manage books, uniforms, transport and front desk —
            all from one place, with instant receipts and reports.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {SERVICES.map((s) => (
              <div key={s} className="flex items-center gap-3 bg-white/70 border border-green-100 rounded-xl px-4 py-3">
                <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                  <Check size={14} className="text-green-700" />
                </div>
                <span className="text-sm font-medium text-gray-700">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex items-center justify-center bg-white p-6">
        <div className="w-full max-w-sm">

          {/* Compact brand on small screens */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center">
              <IndianRupee size={20} className="text-white" />
            </div>
            <p className="font-bold text-lg text-gray-900">Shyam ERP Services</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Sign in</h2>
            <p className="text-gray-500 text-sm mt-1">Welcome back — enter your credentials to continue.</p>
          </div>

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

            {sessions.length > 0 && (
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <Calendar size={14} />
                  Academic Session
                </label>
                <select
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
                  className="form-input"
                >
                  {sessions.map(session => (
                    <option key={session.id} value={session.id}>
                      {session.session_year}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-1">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
                : <>Sign In <ArrowRight size={15} /></>
              }
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            © 2026 Shyam ERP Services · Secure · Multi-Tenant
          </p>
        </div>
      </div>
    </div>
  )
}
