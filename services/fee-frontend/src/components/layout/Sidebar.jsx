import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, DollarSign, Truck, UserPlus, Users,
  ChevronDown, ChevronRight, Building2, BookOpen, Shirt,
  MessageSquare, History
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
    label: 'Fee Management',
    icon: DollarSign,
    children: [
      { label: 'Fee Heads', path: '/fees/heads' },
      { label: 'Fee Structure', path: '/fees/structure' },
      { label: 'Configure Discounts', path: '/fees/discounts' },
      { label: 'Pay Fee', path: '/fees/pay' },
      { label: 'Deposit Fee', path: '/fees/deposits' },
    ],
  },
  {
    label: 'Books',
    icon: BookOpen,
    children: [
      { label: 'Book Sets', path: '/fees/books/sets' },
      { label: 'Book Inventory', path: '/fees/books/inventory' },
      { label: 'Sell Books', path: '/fees/books/sell' },
    ],
  },
  {
    label: 'Uniforms',
    icon: Shirt,
    children: [
      { label: 'Uniform Items', path: '/fees/uniforms' },
      { label: 'Sell Uniform', path: '/fees/uniforms/sell' },
    ],
  },
  {
    label: 'History & Ledger',
    icon: History,
    children: [
      { label: 'Receipt History', path: '/fees/receipts' },
      { label: 'Fee Ledger', path: '/fees/ledger' },
    ],
  },
  {
    label: 'Transport',
    icon: Truck,
    children: [
      { label: 'Vehicles', path: '/transport/vehicles' },
      { label: 'Routes & Stops', path: '/transport/routes' },
      { label: 'Apply Transport', path: '/transport/apply' },
      { label: 'Student List', path: '/transport/students' },
      { label: 'Attendance', path: '/transport/attendance' },
    ],
  },
  {
    label: 'Student Mgmt.',
    icon: UserPlus,
    children: [
      { label: 'New Admissions', path: '/students/admissions' },
      { label: 'Admission Enquiry', path: '/students/enquiry' },
      { label: 'Promote / Demote', path: '/students/promote' },
    ],
  },
  {
    label: 'Frontdesk',
    icon: Users,
    children: [
      { label: 'Visitors', path: '/frontdesk/visitors' },
      { label: 'Short Leaves', path: '/frontdesk/short-leaves' },
      { label: 'Feedbacks', path: '/frontdesk/feedbacks' },
      { label: 'HRM Letters', path: '/frontdesk/hrm' },
    ],
  },
]

function MenuItem({ item }) {
  const location = useLocation()
  const [open, setOpen] = useState(() =>
    item.children ? item.children.some(c => location.pathname.startsWith(c.path)) : false
  )
  const Icon = item.icon

  if (!item.children) {
    return (
      <NavLink to={item.path} end={item.exact}
        className={({ isActive }) => clsx('sidebar-item', isActive ? 'sidebar-item-active' : 'sidebar-item-inactive')}>
        <Icon size={18} />
        <span>{item.label}</span>
      </NavLink>
    )
  }

  const isChildActive = item.children.some(c => location.pathname.startsWith(c.path))

  return (
    <div>
      <button onClick={() => setOpen(!open)}
        className={clsx('sidebar-item w-full', isChildActive ? 'text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white')}>
        <Icon size={18} />
        <span className="flex-1 text-left">{item.label}</span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && (
        <div className="ml-6 mt-1 space-y-0.5 border-l border-white/10 pl-3">
          {item.children.map(child => (
            <NavLink key={child.path} to={child.path}
              className={({ isActive }) => clsx(
                'block px-3 py-2 rounded-lg text-xs font-medium transition-all',
                isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
              )}>
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

  return (
    <aside className={clsx(
      'fixed left-0 top-0 h-full bg-[#1e2a4a] text-white flex flex-col z-30 transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-9 h-9 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <DollarSign size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-white leading-tight">School ERP</p>
            <p className="text-xs text-gray-400">Fee Panel</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-1">
        {menuConfig.map((item, idx) => <MenuItem key={idx} item={item} />)}
      </nav>

      {!collapsed && (
        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-xs text-gray-400">Logged in as</p>
          <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
          <p className="text-xs text-green-400 capitalize">{user?.role?.replace('_', ' ')}</p>
        </div>
      )}
    </aside>
  )
}
