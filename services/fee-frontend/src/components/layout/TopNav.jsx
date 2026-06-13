import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { LogOut, ChevronDown, IndianRupee } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import useAuthStore from '../../store/authStore'
import { authApi } from '../../services/api'

/* ──────────────────────────────────────────────────────────────────────────
 * Nav config
 * ──────────────────────────────────────────────────────────────────────── */
const NAV = [
  {
    label: 'Fee Management',
    cols: 3,
    groups: [
      {
        title: 'Fee Setup',
        items: [
          { label: 'Define Fee Heads',        to: '/fees/heads' },
          { label: 'Define Fee Amounts',       to: '/fees/structure' },
          { label: 'Teacher Extra Heads',      to: '/fees/setup/teacher-extra' },
          { label: 'Configure Discount Heads', to: '/fees/setup/discounts' },
          { label: 'Additional Fee Master',    to: '/fees/setup/additional' },
          { label: 'Deposit Fee Management',   to: '/fees/setup/deposit' },
        ],
      },
      {
        title: 'Fee Collection',
        items: [
          { label: 'Pay Fee',                    to: '/fees/pay' },
          { label: 'Pay Extra Fee',              to: '/fees/pay-extra' },
          { label: 'Auto Late Fine Calculation', to: '/fees/late-fine' },
          { label: 'Reverify Payment',           to: '/fees/reverify' },
          { label: 'Fee Bill Generation',        to: '/fees/bill-generation' },
        ],
      },
      {
        title: 'Book Management',
        items: [
          { label: 'Book Set Creation', to: '/fees/books/sets' },
          { label: 'Book Inventory',    to: '/fees/books/inventory' },
          { label: 'Sell Book Set',     to: '/fees/books/sell' },
          { label: 'Sales Receipt',     to: '/fees/books/receipts' },
        ],
      },
      {
        title: 'Uniform Management',
        items: [
          { label: 'Uniform Item Master', to: '/fees/uniforms' },
          { label: 'Stock Management',    to: '/fees/uniforms/stock' },
          { label: 'Sell Uniform',        to: '/fees/uniforms/sell' },
          { label: 'Sales Tracking',      to: '/fees/uniforms/tracking' },
        ],
      },
      {
        title: 'History & Ledger',
        items: [
          { label: 'Receipt History',    to: '/fees/receipts' },
          { label: 'Previous Late Fine', to: '/fees/late-fine-history' },
          { label: 'Student Fee Ledger', to: '/fees/ledger' },
        ],
      },
      {
        title: 'Reports',
        items: [
          { label: 'Daily Collection',      to: '/fees/reports/daily' },
          { label: 'Monthly Collection',    to: '/fees/reports/monthly' },
          { label: 'Class-wise Collection', to: '/fees/reports/classwise' },
          { label: 'Head-wise Collection',  to: '/fees/reports/headwise' },
          { label: 'Payment Mode Report',   to: '/fees/reports/payment-mode' },
          { label: 'Discount Report',       to: '/fees/reports/discount' },
          { label: 'Fee Defaulters',        to: '/fees/defaulters' },
          { label: 'Defaulter Date-wise',   to: '/fees/defaulters/datewise' },
          { label: 'Cheque Status Report',  to: '/fees/reports/cheque' },
          { label: 'Audit Log Report',      to: '/fees/reports/audit' },
        ],
      },
    ],
  },
  {
    label: 'Transport',
    cols: 3,
    groups: [
      {
        title: 'Transport Setup',
        items: [
          { label: 'Bus No. Master',          to: '/transport/setup/bus' },
          { label: 'Route Master',            to: '/transport/routes' },
          { label: 'Stop Master',             to: '/transport/setup/stop' },
          { label: 'Promote Route / Stop',    to: '/transport/setup/promote' },
          { label: 'Vehicle Master',          to: '/transport/vehicles' },
          { label: 'Vehicle Company / Model', to: '/transport/setup/vehicle-details' },
          { label: 'Vehicle Parts',           to: '/transport/setup/parts' },
        ],
      },
      {
        title: 'Students',
        items: [
          { label: 'Using Transport',     to: '/transport/students' },
          { label: 'Not Using Transport', to: '/transport/students/not-using' },
          { label: 'Apply Transport',     to: '/transport/apply' },
        ],
      },
      {
        title: 'Listings & Attendance',
        items: [
          { label: 'Bus-wise List',        to: '/transport/listing/buswise' },
          { label: 'Route-wise List',      to: '/transport/listing/routewise' },
          { label: 'Stop-wise List',       to: '/transport/listing/stopwise' },
          { label: 'Bus-wise Count',       to: '/transport/listing/bus-count' },
          { label: 'Transport Attendance', to: '/transport/attendance' },
        ],
      },
    ],
  },
  {
    label: 'Students',
    cols: 2,
    groups: [
      {
        title: 'New Admission',
        items: [
          { label: 'Admission List',  to: '/students/admissions' },
          { label: 'Dynamic Report',  to: '/students/dynamic-report' },
          { label: 'Change Adm. No.', to: '/students/change-admission-no' },
          { label: 'CBSE Reg. Form',  to: '/students/cbse-form' },
        ],
      },
      {
        title: 'Student Utility',
        items: [
          { label: 'Search Student',      to: '/students/search' },
          { label: 'Admit Card',          to: '/students/admit-card' },
          { label: 'ID Card',             to: '/students/id-card' },
          { label: 'Student Edit Master', to: '/students/edit-master' },
          { label: 'Change Section',      to: '/students/change-section' },
          { label: 'Create Sibling',      to: '/students/sibling' },
        ],
      },
      {
        title: 'Promote / Demote',
        items: [
          { label: 'Promote Student', to: '/students/promote' },
          { label: 'Demote Student',  to: '/students/demote' },
        ],
      },
      {
        title: 'Student Reports',
        items: [
          { label: 'Class-wise Strength',  to: '/students/reports/strength' },
          { label: 'Student List',         to: '/students/reports/list' },
          { label: 'Cancelled Admissions', to: '/students/reports/cancelled' },
          { label: 'TC Issued',            to: '/students/reports/tc' },
          { label: 'Age Calculator',       to: '/students/reports/age' },
          { label: 'Category Report',      to: '/students/reports/category' },
        ],
      },
    ],
  },
  {
    label: 'Frontdesk',
    cols: 3,
    groups: [
      {
        title: 'Frontdesk Setup',
        items: [
          { label: 'Authorised Persons', to: '/frontdesk/setup/authorised' },
          { label: 'Follow Up Master',   to: '/frontdesk/setup/followup' },
          { label: 'Halfday Approval',   to: '/frontdesk/setup/halfday' },
        ],
      },
      {
        title: 'Visitors & Feedbacks',
        items: [
          { label: 'Record Visit',      to: '/frontdesk/visitors' },
          { label: 'Add Feedback',      to: '/frontdesk/add-feedback' },
          { label: 'View Feedbacks',    to: '/frontdesk/feedbacks' },
          { label: 'Add Short Leave',   to: '/frontdesk/short-leaves/add' },
          { label: 'List Short Leaves', to: '/frontdesk/short-leaves/list' },
        ],
      },
      {
        title: 'Admission Enquiry',
        items: [
          { label: 'Admission Query',   to: '/frontdesk/enquiry/query' },
          { label: 'Enquiry Dashboard', to: '/frontdesk/enquiry/dashboard' },
          { label: 'Enquiry Follow Up', to: '/frontdesk/enquiry/followup' },
          { label: 'Test Subjects',     to: '/frontdesk/enquiry/test-subjects' },
          { label: 'Remark Master',     to: '/frontdesk/enquiry/remarks' },
        ],
      },
      {
        title: 'HRM',
        items: [
          { label: 'Add HRM',    to: '/frontdesk/hrm/add' },
          { label: 'List HRM',   to: '/frontdesk/hrm/list' },
          { label: 'Add Letter', to: '/frontdesk/hrm/letter' },
        ],
      },
    ],
  },
]

const COLS_CLASS = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' }
const COLS_WIDTH = { 1: 'min-w-[220px]', 2: 'min-w-[480px]', 3: 'min-w-[720px]', 4: 'min-w-[920px]' }

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
          COLS_WIDTH[cols] || 'min-w-[220px]',
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
  const brandName = isSuperAdmin ? 'Shyam Enterprise' : (user?.school_name || 'Shyam Enterprise')

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

        {/* Brand — click to go to Dashboard */}
        <Link
          to="/"
          title="Go to Dashboard"
          className="flex items-center gap-2.5 shrink-0 rounded-lg px-1 -mx-1 py-1 hover:bg-gray-50 transition-colors duration-150"
        >
          <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
            <IndianRupee size={16} className="text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-gray-900 leading-none">{brandName}</p>
            <p className="text-[10px] text-gray-400 leading-none mt-0.5">Fee Panel</p>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center justify-center gap-0.5 flex-1 flex-wrap">
          {NAV.map(entry => <NavEntry key={entry.label} entry={entry} />)}
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
