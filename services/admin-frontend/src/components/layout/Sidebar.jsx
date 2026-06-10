import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, UserCheck, Calendar, Clock, BookOpen,
  ChevronDown, ChevronRight, School, GraduationCap, Building2
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import clsx from 'clsx'

const menuConfig = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/',
    exact: true,
  },
  {
    label: 'Students',
    icon: GraduationCap,
    children: [
      { label: 'Student List', path: '/students' },
      { label: 'Student Strength', path: '/students/strength' },
    ],
  },
  {
    label: 'Staff',
    icon: Users,
    children: [
      { label: 'Staff List', path: '/staff' },
      { label: 'Department Master', path: '/staff/departments' },
      { label: 'Designation Master', path: '/staff/designations' },
    ],
  },
  {
    label: 'Attendance',
    icon: UserCheck,
    children: [
      { label: 'Student Attendance', path: '/attendance/students' },
      { label: 'Attendance Register', path: '/attendance/register' },
      { label: 'Absent Log', path: '/attendance/absent-log' },
      { label: 'Class Wise Status', path: '/attendance/summary' },
      { label: 'Staff Attendance', path: '/attendance/staff' },
    ],
  },
  {
    label: 'Timetable',
    icon: Calendar,
    children: [
      { label: 'View Timetable', path: '/timetable' },
      { label: 'Subjects', path: '/timetable/subjects' },
    ],
  },
  {
    label: 'CCE / Academics',
    icon: BookOpen,
    children: [
      { label: 'Marks Feeding', path: '/academics/marks' },
      { label: 'Subject Allocation', path: '/academics/subjects' },
    ],
  },
]

const superAdminMenu = [
  {
    label: 'Schools',
    icon: School,
    children: [
      { label: 'All Schools', path: '/schools' },
      { label: 'Create School', path: '/schools/create' },
    ],
  },
]

function MenuItem({ item }) {
  const location = useLocation()
  const [open, setOpen] = useState(() => {
    if (item.children) {
      return item.children.some((c) => location.pathname.startsWith(c.path))
    }
    return false
  })
  const Icon = item.icon

  if (!item.children) {
    return (
      <NavLink
        to={item.path}
        end={item.exact}
        className={({ isActive }) =>
          clsx('sidebar-item', isActive ? 'sidebar-item-active' : 'sidebar-item-inactive')
        }
      >
        <Icon size={18} />
        <span>{item.label}</span>
      </NavLink>
    )
  }

  const isChildActive = item.children.some((c) => location.pathname.startsWith(c.path))

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={clsx(
          'sidebar-item w-full',
          isChildActive ? 'text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'
        )}
      >
        <Icon size={18} />
        <span className="flex-1 text-left">{item.label}</span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && (
        <div className="ml-6 mt-1 space-y-0.5 border-l border-white/10 pl-3">
          {item.children.map((child) => (
            <NavLink
              key={child.path}
              to={child.path}
              className={({ isActive }) =>
                clsx(
                  'block px-3 py-2 rounded-lg text-xs font-medium transition-all',
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
                )
              }
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Sidebar({ collapsed }) {
  const { user } = useAuthStore()
  const menu = user?.role === 'super_admin' ? [...superAdminMenu, ...menuConfig] : menuConfig

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 h-full bg-[#1e2a4a] text-white flex flex-col z-30 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Building2 size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-white leading-tight">School ERP</p>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-1">
        {menu.map((item, idx) => (
          <MenuItem key={idx} item={item} />
        ))}
      </nav>

      {/* User info */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-xs text-gray-400">Logged in as</p>
          <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
          <p className="text-xs text-blue-400 capitalize">{user?.role?.replace('_', ' ')}</p>
        </div>
      )}
    </aside>
  )
}
