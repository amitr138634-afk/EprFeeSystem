import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Building2, Users, ShieldCheck, Plus, ArrowRight, ToggleLeft, ToggleRight, CheckCircle2, XCircle } from 'lucide-react'
import { schoolApi, authApi } from '../../services/api'
import useAuthStore from '../../store/authStore'

function StatCard({ icon: Icon, label, value, sub, color, onClick }) {
  const colors = {
    blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',   text: 'text-blue-600' },
    green:  { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-600',  text: 'text-green-600' },
    orange: { bg: 'bg-orange-50', icon: 'bg-orange-100 text-orange-600', text: 'text-orange-600' },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', text: 'text-purple-600' },
  }
  const c = colors[color] || colors.blue
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-5 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${c.icon}`}>
        <Icon size={26} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-0.5">{value ?? '—'}</p>
        {sub && <p className={`text-xs mt-0.5 font-medium ${c.text}`}>{sub}</p>}
      </div>
    </div>
  )
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const { data: schoolsData } = useQuery({
    queryKey: ['schools'],
    queryFn: () => schoolApi.list().then(r => r.data.results || r.data),
  })

  const { data: adminsData } = useQuery({
    queryKey: ['school-admins'],
    queryFn: () => authApi.listSchoolAdmins().then(r => r.data.results || r.data),
  })

  const schools = schoolsData || []
  const admins  = adminsData  || []
  const active  = schools.filter(s => s.status === 'active').length
  const inactive = schools.length - active

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Here's an overview of all schools on the platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admins/create')}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Plus size={15} /> Add Admin
          </button>
          <button
            onClick={() => navigate('/schools/create')}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={15} /> New School
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard icon={Building2}   label="Total Schools"   value={schools.length} sub={`${active} active`}       color="blue"   onClick={() => navigate('/schools')} />
        <StatCard icon={CheckCircle2} label="Active Schools"  value={active}         sub="Currently running"        color="green"  onClick={() => navigate('/schools')} />
        <StatCard icon={XCircle}      label="Inactive Schools" value={inactive}       sub="Deactivated"             color="orange" onClick={() => navigate('/schools')} />
        <StatCard icon={Users}        label="School Admins"   value={admins.length}  sub="Across all schools"       color="purple" onClick={() => navigate('/admins')} />
      </div>

      {/* Recent schools + Quick actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Schools table */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Registered Schools</h2>
            <button
              onClick={() => navigate('/schools')}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
            >
              View all <ArrowRight size={12} />
            </button>
          </div>

          {schools.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Building2 size={40} className="mb-3 opacity-30" />
              <p className="text-sm">No schools registered yet</p>
              <button
                onClick={() => navigate('/schools/create')}
                className="mt-4 text-sm text-blue-600 hover:underline font-medium"
              >
                Register your first school
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {schools.slice(0, 6).map(school => (
                <div key={school.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {school.code?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{school.name}</p>
                    <p className="text-xs text-gray-400">{school.city}, {school.state} · {school.email}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                    school.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>
                    {school.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2.5">
              {[
                { label: 'Register New School', to: '/schools/create', color: 'bg-blue-600 hover:bg-blue-700', icon: Building2 },
                { label: 'Add School Admin',    to: '/admins/create',  color: 'bg-violet-600 hover:bg-violet-700', icon: Users },
                { label: 'View All Schools',    to: '/schools',        color: 'bg-slate-700 hover:bg-slate-800', icon: ShieldCheck },
                { label: 'View All Admins',     to: '/admins',         color: 'bg-teal-600 hover:bg-teal-700', icon: Users },
              ].map(a => (
                <button
                  key={a.label}
                  onClick={() => navigate(a.to)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white transition-colors ${a.color}`}
                >
                  <a.icon size={16} /> {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Admins summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Recent Admins</h2>
              <button onClick={() => navigate('/admins')} className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1">
                All <ArrowRight size={12} />
              </button>
            </div>
            {admins.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No admins yet</p>
            ) : (
              <div className="space-y-3">
                {admins.slice(0, 4).map(admin => (
                  <div key={admin.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {(admin.full_name || admin.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{admin.full_name || admin.email}</p>
                      <p className="text-xs text-gray-400 truncate">{admin.email}</p>
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
