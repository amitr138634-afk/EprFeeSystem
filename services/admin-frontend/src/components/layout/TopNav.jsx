import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { LogOut, ChevronDown, Building2 } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import useAuthStore from '../../store/authStore'
import { authApi } from '../../services/api'

/* ──────────────────────────────────────────────────────────────────────────
 * Navigation per role
 * ──────────────────────────────────────────────────────────────────────── */
const SUPER_ADMIN_NAV = [
  { label: 'Dashboard', to: '/dashboard', end: true },
  {
    label: 'Schools',
    items: [
      { label: 'All Schools',    to: '/schools' },
      { label: 'Add New School', to: '/schools/create' },
    ],
  },
  {
    label: 'School Admins',
    items: [
      { label: 'All Admins',    to: '/admins' },
      { label: 'Add New Admin', to: '/admins/create' },
    ],
  },
]

const SCHOOL_ADMIN_NAV = [
  { label: 'Dashboard',  to: '/', end: true },
  {
    label: 'Students',
    items: [
      { label: 'Student List',     to: '/students' },
      { label: 'Student Strength', to: '/students/strength' },
    ],
  },
  {
    label: 'Staff',
    items: [
      { label: 'Staff List',         to: '/staff' },
      { label: 'Department Master',  to: '/staff/departments' },
    ],
  },
  {
    label: 'Attendance',
    items: [
      { label: 'Student Attendance',   to: '/attendance/students' },
      { label: 'Attendance Register',  to: '/attendance/register' },
      { label: 'Absent Log',           to: '/attendance/absent-log' },
      { label: 'Class-wise Summary',   to: '/attendance/summary' },
      { label: 'Staff Attendance',     to: '/attendance/staff' },
    ],
  },
  {
    label: 'Timetable',
    items: [
      { label: 'View Timetable', to: '/timetable' },
      { label: 'Subjects',       to: '/timetable/subjects' },
    ],
  },
  {
    label: 'Academics',
    items: [
      { label: 'Marks Feeding',       to: '/academics/marks' },
      { label: 'Subject Allocation',  to: '/academics/subjects' },
    ],
  },
]

/* ──────────────────────────────────────────────────────────────────────────
 * Single nav entry that can be either a link or a dropdown
 * ──────────────────────────────────────────────────────────────────────── */
function NavEntry({ entry }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close when clicking outside
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!entry.items) {
    return (
      <NavLink
        to={entry.to}
        end={entry.end}
        data-testid={`nav-${entry.label.toLowerCase().replace(/\s+/g, '-')}`}
        className={({ isActive }) =>
          clsx(
            'px-3 py-2 text-sm font-medium rounded-md transition-colors',
            isActive
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100'
          )
        }
      >
        {entry.label}
      </NavLink>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        data-testid={`nav-dropdown-${entry.label.toLowerCase()}`}
        className={clsx(
          'px-3 py-2 text-sm font-medium rounded-md transition-colors inline-flex items-center gap-1',
          open ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
        )}
      >
        {entry.label}
        <ChevronDown size={14} className={clsx('transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 min-w-[200px] bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-50">
          {entry.items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              onClick={() => setOpen(false)}
              data-testid={`nav-sub-${it.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={({ isActive }) =>
                clsx(
                  'flex items-center px-4 py-2.5 text-sm whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
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

/* ──────────────────────────────────────────────────────────────────────────
 * Top center navbar
 * ──────────────────────────────────────────────────────────────────────── */
export default function TopNav() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const nav = user?.role === 'super_admin' ? SUPER_ADMIN_NAV : SCHOOL_ADMIN_NAV

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
        {/* Left — brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <Building2 size={18} className="text-white" />
          </div>
          <div className="leading-tight min-w-0">
            <p className="text-sm font-bold text-gray-800 truncate">
              {user?.role === 'super_admin' ? 'School ERP' : (user?.school_name || 'School ERP')}
            </p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">
              {user?.role === 'super_admin' ? 'Super Admin' : 'Admin Panel'}
            </p>
          </div>
        </div>

        {/* Center — navigation */}
        <nav className="flex items-center justify-center gap-1" data-testid="main-nav">
          {nav.map((entry) => (
            <NavEntry key={entry.label} entry={entry} />
          ))}
        </nav>

        {/* Right — user / logout */}
        <div className="flex items-center justify-end gap-3">
          <div className="hidden md:block text-right leading-tight">
            <p className="text-sm font-medium text-gray-800">{user?.full_name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
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
