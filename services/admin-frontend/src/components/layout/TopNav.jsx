import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { LogOut, ChevronDown, Building2 } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import useAuthStore from '../../store/authStore'
import { authApi } from '../../services/api'

/* ──────────────────────────────────────────────────────────────────────────
 * Nav configuration
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
  {
    label: 'Students',
    items: [
      { label: 'Student List',             to: '/students' },
      { label: 'Student Strength (Class Wise)', to: '/students/strength' },
    ],
  },
  {
    label: 'Staff',
    items: [
      { label: 'Staff List',         to: '/staff' },
      { label: 'Department Master',  to: '/staff/departments' },
      { label: 'Designation Master', to: '/staff/designations' },
    ],
  },
  {
    label: 'Attendance',
    groups: [
      {
        title: 'Student Attendance',
        items: [
          { label: 'Student Attendance',          to: '/attendance/students' },
          { label: 'Attendance Register',         to: '/attendance/register' },
          { label: 'Absent Log',                  to: '/attendance/absent-log' },
          { label: 'Class Wise Attendance Status', to: '/attendance/summary' },
          { label: 'Date Wise Summary',           to: '/attendance/date-wise' },
        ],
      },
      {
        title: 'Staff Attendance',
        items: [
          { label: 'Manage Shift',                    to: '/attendance/staff/shifts' },
          { label: 'Staff Attendance',                to: '/attendance/staff' },
          { label: 'Monthly Staff Attendance Report', to: '/attendance/staff/monthly' },
          { label: 'Staff Holiday List',              to: '/attendance/staff/holidays' },
          { label: 'Staff Leave Request',             to: '/attendance/staff/leave-requests' },
          { label: 'Leave Balance Report',            to: '/attendance/staff/leave-balance' },
          { label: 'Date Wise Staff Summary',         to: '/attendance/staff/date-wise' },
        ],
      },
    ],
  },
  {
    label: 'Timetable',
    items: [
      { label: 'Add / Update Timetable',      to: '/timetable' },
      { label: 'View Teacher Timetable',      to: '/timetable/teacher' },
      { label: 'View Day Wise Timetable',     to: '/timetable/day-wise' },
      { label: 'Class Wise Timetable',        to: '/timetable/class-wise' },
      { label: 'Timetable Workload',          to: '/timetable/workload' },
      { label: 'Teacher Substitute Report',   to: '/timetable/substitute' },
      { label: 'Month Wise Substitute Report',to: '/timetable/substitute-monthly' },
    ],
  },
  {
    label: 'CCE',
    groups: [
      {
        title: 'Assign Subject & Test',
        items: [
          { label: 'Assign Subject & Test', to: '/cce/subjects' },
          { label: 'Marks Feeding',         to: '/academics/marks' },
          { label: 'Calculation Master',    to: '/cce/calculation-master' },
          { label: 'Remark Master',         to: '/cce/remark-master' },
          { label: 'Signature Master',      to: '/cce/signature-master' },
          { label: 'Generate Report Card',  to: '/cce/report-card' },
        ],
      },
      {
        title: 'Subject Allocation',
        items: [
          { label: 'Assign Subject',           to: '/academics/subjects' },
          { label: 'Add Subject (Student)',     to: '/cce/student-subjects' },
          { label: 'Multiple Subject Mapping',  to: '/cce/multiple-subject-mapping' },
        ],
      },
    ],
  },
]

/* ──────────────────────────────────────────────────────────────────────────
 * Dropdown item — shared between simple and grouped dropdowns
 * ──────────────────────────────────────────────────────────────────────── */
function DropdownItem({ to, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => clsx(
        'flex items-center px-4 py-2 text-sm whitespace-nowrap transition-colors duration-100 rounded-lg mx-1',
        isActive
          ? 'bg-blue-600 text-white font-medium'
          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
      )}
    />
  )
}

/* ──────────────────────────────────────────────────────────────────────────
 * Single nav entry — link, simple dropdown, or grouped mega-dropdown
 * ──────────────────────────────────────────────────────────────────────── */
function NavEntry({ entry }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const location = useLocation()

  const allItems = entry.groups
    ? entry.groups.flatMap(g => g.items)
    : (entry.items || [])
  const isParentActive = allItems.some(it => location.pathname.startsWith(it.to))

  useEffect(() => {
    if (!open) return
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  /* Simple direct link */
  if (!entry.items && !entry.groups) {
    return (
      <NavLink
        to={entry.to}
        end={entry.end}
        className={({ isActive }) => clsx(
          'px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-150',
          isActive
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-200 hover:bg-white/10 hover:text-white'
        )}
      >
        {entry.label}
      </NavLink>
    )
  }

  const hasGroups = !!entry.groups

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className={clsx(
          'flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-150',
          open || isParentActive
            ? 'bg-white text-blue-700 shadow-sm'
            : 'text-gray-200 hover:bg-white/10 hover:text-white'
        )}
      >
        {entry.label}
        <ChevronDown
          size={13}
          className={clsx('transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {/* Outer wrapper: controls position & pointer-events */}
      <div
        className={clsx(
          'absolute top-[calc(100%+10px)] z-50',
          hasGroups ? 'left-1/2 -translate-x-1/2' : 'left-0',
          !open && 'pointer-events-none'
        )}
      >
        {/* Inner wrapper: controls animation */}
        <div
          className={clsx(
            'bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden',
            'transition-all duration-200 ease-out origin-top',
            hasGroups ? 'min-w-[520px]' : 'min-w-[220px]',
            open ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2'
          )}
        >
          {hasGroups ? (
            /* Grouped mega-dropdown */
            <div>
              <div className="flex divide-x divide-gray-100">
                {entry.groups.map((group) => (
                  <div key={group.title} className="flex-1 py-3">
                    <p className="px-4 pb-2 pt-1 text-[10px] font-bold uppercase tracking-widest text-blue-600 border-b border-gray-50 mb-1">
                      {group.title}
                    </p>
                    {group.items.map(item => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) => clsx(
                          'flex items-center px-4 py-2 text-sm transition-colors duration-100',
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-blue-700'
                        )}
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Simple dropdown */
            <div className="py-1.5">
              {entry.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) => clsx(
                    'flex items-center px-4 py-2.5 text-sm whitespace-nowrap transition-colors duration-100',
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                  )}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
 * Top navbar
 * ──────────────────────────────────────────────────────────────────────── */
export default function TopNav() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const nav = user?.role === 'super_admin' ? SUPER_ADMIN_NAV : SCHOOL_ADMIN_NAV

  const isSuperAdmin = user?.role === 'super_admin'

  const handleLogout = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) await authApi.logout(refresh)
    } catch (_) {}
    logout()
    navigate('/login')
    toast.success('Logged out')
  }

  return (
    <header className="sticky top-0 z-30 shadow-lg">
      {/* Main nav bar */}
      <div className={clsx(
        'h-14 flex items-center justify-between px-4 sm:px-6',
        isSuperAdmin
          ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900'
          : 'bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-800'
      )}>

        {/* Left — Brand */}
        <div className="flex items-center gap-2.5 min-w-0 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20">
            <Building2 size={17} className="text-white" />
          </div>
          <div className="leading-tight min-w-0">
            <p className="text-sm font-bold text-white truncate">
              {isSuperAdmin ? 'Shyam ERP Solutions' : (user?.school_name || 'Shyam ERP Solutions')}
            </p>
            <p className="text-[10px] text-white/60 uppercase tracking-wide">
              {isSuperAdmin ? 'Super Admin' : 'Admin Panel'}
            </p>
          </div>
        </div>

        {/* Center — Navigation */}
        <nav className="flex items-center gap-0.5 mx-4">
          {nav.map(entry => (
            <NavEntry key={entry.label} entry={entry} />
          ))}
        </nav>

        {/* Right — User + Logout */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex flex-col items-end leading-tight">
            <p className="text-sm font-medium text-white">{user?.full_name}</p>
            <p className="text-[10px] text-white/60 capitalize">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 text-white flex items-center justify-center font-semibold text-sm">
            {(user?.full_name || 'A').charAt(0).toUpperCase()}
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors duration-150"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>

      {/* Thin accent line below nav */}
      <div className={clsx(
        'h-0.5',
        isSuperAdmin
          ? 'bg-gradient-to-r from-slate-600 via-blue-500 to-slate-600'
          : 'bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-500'
      )} />
    </header>
  )
}
