import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { LogOut, ChevronDown, DollarSign } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import useAuthStore from '../../store/authStore'
import { authApi } from '../../services/api'

const NAV = [
  { label: 'Dashboard', to: '/', end: true },
  {
    label: 'Fees',
    items: [
      { label: 'Fee Heads',         to: '/fees/heads' },
      { label: 'Fee Structure',     to: '/fees/structure' },
      { label: 'Pay Fee',           to: '/fees/pay' },
      { label: 'Receipt History',   to: '/fees/receipts' },
      { label: 'Daily Collection',  to: '/fees/reports/daily' },
      { label: 'Defaulters',        to: '/fees/defaulters' },
    ],
  },
  {
    label: 'Books & Uniforms',
    items: [
      { label: 'Book Sets', to: '/fees/books/sets' },
      { label: 'Uniforms',  to: '/fees/uniforms' },
    ],
  },
  {
    label: 'Transport',
    items: [
      { label: 'Vehicles',           to: '/transport/vehicles' },
      { label: 'Routes',             to: '/transport/routes' },
      { label: 'Transport Students', to: '/transport/students' },
    ],
  },
  {
    label: 'Admissions',
    items: [{ label: 'Admission List', to: '/students/admissions' }],
  },
  {
    label: 'Frontdesk',
    items: [
      { label: 'Visitors',  to: '/frontdesk/visitors' },
      { label: 'Feedbacks', to: '/frontdesk/feedbacks' },
    ],
  },
]

function NavEntry({ entry }) {
  const [open, setOpen] = useState(false)

  if (!entry.items) {
    return (
      <NavLink
        to={entry.to}
        end={entry.end}
        data-testid={`nav-${entry.label.toLowerCase()}`}
        className={({ isActive }) =>
          clsx(
            'px-3 py-2 text-sm font-medium rounded-md transition-colors',
            isActive
              ? 'bg-green-600 text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100'
          )
        }
      >
        {entry.label}
      </NavLink>
    )
  }

  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        data-testid={`nav-dropdown-${entry.label.toLowerCase().replace(/\s+/g, '-')}`}
        className="px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 inline-flex items-center gap-1"
      >
        {entry.label}
        <ChevronDown size={14} className={clsx('transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
          {entry.items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                clsx(
                  'block px-4 py-2 text-sm whitespace-nowrap',
                  isActive
                    ? 'bg-green-50 text-green-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                )
              }
            >
              {it.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export default function TopNav() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) await authApi.logout(refresh)
    } catch (_) {
      // ignore logout errors — local logout should always succeed
    }
    logout()
    navigate('/login')
    toast.success('Logged out')
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-3 items-center h-14">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
            <DollarSign size={18} className="text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-gray-800">School ERP</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Fee Panel</p>
          </div>
        </div>

        <nav className="flex items-center justify-center gap-1" data-testid="main-nav">
          {NAV.map((e) => <NavEntry key={e.label} entry={e} />)}
        </nav>

        <div className="flex items-center justify-end gap-3">
          <div className="hidden md:block text-right leading-tight">
            <p className="text-sm font-medium text-gray-800">{user?.full_name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center font-semibold text-sm">
            {(user?.full_name || 'A').charAt(0).toUpperCase()}
          </div>
          <button
            onClick={handleLogout}
            data-testid="logout-btn"
            className="p-2 rounded-md hover:bg-red-50 text-red-600 transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}
