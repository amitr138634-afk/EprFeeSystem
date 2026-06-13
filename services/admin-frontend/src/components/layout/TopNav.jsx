import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { LogOut, ChevronDown, GraduationCap } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import useAuthStore from '../../store/authStore'
import { authApi } from '../../services/api'

/* ──────────────────────────────────────────────────────────────────────────
 * Nav config
 * ──────────────────────────────────────────────────────────────────────── */
const SCHOOL_ADMIN_NAV = [
  { label: 'Dashboard', to: '/', end: true },
  {
    label: 'Students',
    items: [
      { label: 'Student List',     to: '/students' },
      { label: 'Student Strength', to: '/students/strength' },
      { label: 'Class & Section',  to: '/students/classes' },
    ],
  },
  {
    label: 'Staff',
    items: [
      { label: 'Staff List',                    to: '/staff' },
      { label: 'Department Master',             to: '/staff/departments' },
      { label: 'Designation Master',            to: '/staff/designations' },
      { label: 'Department-Designation Master', to: '/staff/dept-designation-mapping' },
    ],
  },
  {
    label: 'Attendance',
    groups: [
      {
        title: 'Student Attendance',
        items: [
          { label: 'Mark Attendance',    to: '/attendance/mark' },
          { label: 'Date-wise Register', to: '/attendance/date-wise' },
          { label: 'Absent Log',         to: '/attendance/absent-log' },
          { label: 'Monthly Register',   to: '/attendance/monthly' },
          { label: 'Summary Report',     to: '/attendance/summary' },
        ],
      },
      {
        title: 'Staff Attendance',
        items: [
          { label: 'Shift Setup',      to: '/attendance/staff/shifts' },
          { label: 'Mark Attendance',  to: '/attendance/staff/mark' },
          { label: 'Monthly Report',   to: '/attendance/staff/monthly' },
          { label: 'Holidays',         to: '/attendance/staff/holidays' },
          { label: 'Leave Requests',   to: '/attendance/staff/leave-requests' },
          { label: 'Leave Balance',    to: '/attendance/staff/leave-balance' },
          { label: 'Date-wise Report', to: '/attendance/staff/date-wise' },
        ],
      },
    ],
  },
  {
    label: 'Academics',
    items: [
      { label: 'Grade Scale',        to: '/academics/grade-scale' },
      { label: 'Calculation Master', to: '/academics/calculation' },
      { label: 'Class Results',      to: '/academics/results' },
    ],
  },
  {
    label: 'Timetable',
    items: [
      { label: 'Subjects',           to: '/timetable/subjects' },
      { label: 'Periods',            to: '/timetable/periods' },
      { label: 'Class-wise',         to: '/timetable/class-wise' },
      { label: 'Teacher-wise',       to: '/timetable/teacher' },
      { label: 'Day-wise',           to: '/timetable/day-wise' },
      { label: 'Workload Report',    to: '/timetable/workload' },
      { label: 'Substitute Teacher', to: '/timetable/substitute' },
    ],
  },
  {
    label: 'CCE',
    groups: [
      {
        title: 'Assign Subject & Test',
        items: [
          { label: 'Exam Types',        to: '/cce/exam-types' },
          { label: 'Assign Subjects',   to: '/cce/assign-subjects' },
          { label: 'Enter Marks',       to: '/cce/enter-marks' },
          { label: 'Bulk Marks Upload', to: '/cce/bulk-marks' },
          { label: 'Remarks Master',    to: '/cce/remarks' },
          { label: 'Signature Master',  to: '/cce/signatures' },
        ],
      },
      {
        title: 'Subject Allocation',
        items: [
          { label: 'Class-wise Allocation', to: '/cce/class-allocation' },
          { label: 'Teacher Allocation',    to: '/cce/teacher-allocation' },
          { label: 'Student Subjects',      to: '/cce/student-subjects' },
        ],
      },
    ],
  },
  {
    label: 'Report Card',
    items: [
      { label: 'Generate Report Card', to: '/report-card/generate' },
      { label: 'Bulk Report Cards',    to: '/report-card/bulk' },
    ],
  },
]

const SUPER_ADMIN_NAV = [
  { label: 'Dashboard', to: '/', end: true },
  { label: 'Schools',   to: '/schools' },
]

const COLS_CLASS = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3' }
const COLS_WIDTH = { 1: 'min-w-[200px]', 2: 'min-w-[480px]', 3: 'min-w-[680px]' }

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
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!entry.items && !entry.groups) {
    return (
      <NavLink
        to={entry.to}
        end={entry.end}
        className={({ isActive }) => clsx(
          'px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 whitespace-nowrap',
          isActive ? 'text-green-700 bg-green-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        )}
      >
        {entry.label}
      </NavLink>
    )
  }

  const cols = entry.cols || (entry.groups ? 2 : 1)
  const hasGroups = !!entry.groups

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className={clsx(
          'flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 whitespace-nowrap',
          open || isParentActive
            ? 'text-green-700 bg-green-50'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        )}
      >
        {entry.label}
        <ChevronDown size={13} className={clsx('transition-transform duration-200 mt-px', open && 'rotate-180')} />
      </button>

      <div className={clsx(
        'absolute top-[calc(100%+6px)] z-50',
        hasGroups ? 'left-1/2 -translate-x-1/2' : 'left-0',
        !open && 'pointer-events-none'
      )}>
        <div className={clsx(
          'bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden',
          'transition-all duration-200 ease-out origin-top',
          COLS_WIDTH[cols] || 'min-w-[200px]',
          open ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2'
        )}>
          {hasGroups ? (
            <div className={clsx('grid divide-x divide-gray-100', COLS_CLASS[cols] || 'grid-cols-2')}>
              {entry.groups.map(group => (
                <div key={group.title} className="py-2 px-1">
                  <p className="px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-green-600">
                    {group.title}
                  </p>
                  {group.items.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) => clsx(
                        'flex items-center px-3 py-1.5 text-sm rounded-lg mx-0.5 transition-colors duration-100',
                        isActive ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-1.5">
              {entry.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) => clsx(
                    'flex items-center px-4 py-2 text-sm whitespace-nowrap transition-colors duration-100',
                    isActive ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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

export default function TopNav() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const isSuperAdmin = user?.role === 'super_admin'
  const nav = isSuperAdmin ? SUPER_ADMIN_NAV : SCHOOL_ADMIN_NAV

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
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
            <GraduationCap size={16} className="text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-gray-900 leading-none">
              {isSuperAdmin ? 'Shyam Enterprise' : (user?.school_name || 'Shyam Enterprise')}
            </p>
            <p className="text-[10px] text-gray-400 leading-none mt-0.5">
              {isSuperAdmin ? 'Super Admin' : 'Admin Panel'}
            </p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex items-center justify-center gap-0.5 flex-1 flex-wrap">
          {nav.map(entry => <NavEntry key={entry.label} entry={entry} />)}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex flex-col items-end leading-tight">
            <p className="text-sm font-semibold text-gray-900 leading-none">{user?.full_name}</p>
            <p className="text-[10px] text-gray-400 capitalize leading-none mt-0.5">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-green-100 border border-green-200 text-green-700 flex items-center justify-center font-semibold text-sm">
            {(user?.full_name || 'A').charAt(0).toUpperCase()}
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors duration-150"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  )
}
