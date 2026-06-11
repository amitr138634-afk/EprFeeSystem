import { useQuery } from '@tanstack/react-query'
import { NavLink } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import {
  IndianRupee, Receipt, TrendingUp, CalendarRange,
  ChevronRight, CalendarDays,
  CreditCard, Wallet, Banknote, Smartphone
} from 'lucide-react'
import { format } from 'date-fns'
import useAuthStore from '../store/authStore'
import { feeApi } from '../services/api'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const MODE_ICON  = { cash: Banknote, cheque: CreditCard, online: Wallet, upi: Smartphone, card: CreditCard }
const MODE_COLOR = {
  cash:   'bg-green-600',
  cheque: 'bg-blue-600',
  online: 'bg-purple-600',
  upi:    'bg-teal-600',
  card:   'bg-indigo-600',
}

function inr(v) {
  return `₹${Number(v || 0).toLocaleString('en-IN')}`
}

function StatCard({ title, value, sub, icon: Icon, color, loading }) {
  const colors = {
    green:  'bg-green-600',
    blue:   'bg-blue-600',
    amber:  'bg-amber-500',
    purple: 'bg-purple-600',
  }
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl ${colors[color] || colors.green} flex items-center justify-center shrink-0`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">
          {loading ? <span className="text-gray-200 animate-pulse">—</span> : (value ?? '—')}
        </p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

const QUICK_ACTIONS = [
  { label: 'Pay Fee',       to: '/fees/pay',           color: 'text-green-700 bg-green-50 hover:bg-green-100' },
  { label: 'Receipts',      to: '/fees/receipts',      color: 'text-blue-700 bg-blue-50 hover:bg-blue-100' },
  { label: 'Defaulters',    to: '/fees/defaulters',    color: 'text-amber-700 bg-amber-50 hover:bg-amber-100' },
  { label: 'Daily Report',  to: '/fees/reports/daily', color: 'text-purple-700 bg-purple-50 hover:bg-purple-100' },
]

const BAR_COLORS = ['#16a34a', '#2563eb', '#7c3aed', '#0891b2', '#d97706']

export default function Dashboard() {
  const { user } = useAuthStore()
  const now = new Date()
  const today = format(now, 'yyyy-MM-dd')
  const todayLabel = format(now, 'dd MMM yyyy, EEEE')
  const monthLabel = format(now, 'MMMM yyyy')

  const { data: dailyReport, isLoading } = useQuery({
    queryKey: ['daily-report', today],
    queryFn: () => feeApi.dailyReport({ date: today }).then(r => r.data),
  })

  const { data: monthlyReport, isLoading: loadingMonth } = useQuery({
    queryKey: ['monthly-report', now.getMonth() + 1, now.getFullYear()],
    queryFn: () => feeApi.monthlyReport({ month: now.getMonth() + 1, year: now.getFullYear() }).then(r => r.data),
  })

  const { data: receipts = [], isLoading: loadingReceipts } = useQuery({
    queryKey: ['recent-receipts'],
    queryFn: () => feeApi.receipts().then(r => r.data.results ?? r.data),
  })

  const totalCollection = dailyReport ? inr(dailyReport.total_amount) : null
  const receiptsToday   = dailyReport?.total_receipts ?? null
  const monthCollection = monthlyReport ? inr(monthlyReport.total_amount) : null
  const monthReceipts   = monthlyReport?.total_receipts ?? null

  const byClass = (monthlyReport?.by_class || []).map(c => ({
    name: c.class_name || '—',
    amount: Number(c.amount || 0),
  }))

  const recent = [...receipts]
    .sort((a, b) => (b.id || 0) - (a.id || 0))
    .slice(0, 6)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {greeting()}, {user?.full_name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
            <CalendarDays size={13} /> {todayLabel}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {QUICK_ACTIONS.map(a => (
            <NavLink key={a.to} to={a.to}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 ${a.color}`}>
              {a.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Collection"  value={totalCollection} sub={`${receiptsToday ?? 0} receipts`} icon={IndianRupee}  color="green"  loading={isLoading} />
        <StatCard title="Receipts Today"      value={receiptsToday}   sub="Transactions"                    icon={Receipt}       color="blue"   loading={isLoading} />
        <StatCard title="This Month"          value={monthCollection} sub={monthLabel}                      icon={TrendingUp}    color="purple" loading={loadingMonth} />
        <StatCard title="Month Receipts"      value={monthReceipts}   sub="Paid this month"                 icon={CalendarRange} color="amber"  loading={loadingMonth} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Monthly collection by class — real data */}
        <div className="lg:col-span-3 card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Collection by Class</h3>
              <p className="text-xs text-gray-400 mt-0.5">Fees collected in {monthLabel} (₹)</p>
            </div>
            <TrendingUp size={16} className="text-gray-300" />
          </div>
          {loadingMonth ? (
            <div className="h-[190px] bg-gray-50 rounded animate-pulse" />
          ) : byClass.length > 0 ? (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={byClass} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
                  formatter={v => [inr(v), 'Collected']}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]} name="Collected">
                  {byClass.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[190px] flex flex-col items-center justify-center text-gray-300 gap-2">
              <IndianRupee size={28} />
              <p className="text-sm">No collection this month</p>
            </div>
          )}
        </div>

        {/* Payment mode breakdown — today */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">Today by Mode</h3>
            <NavLink to="/fees/reports/daily" className="text-xs text-green-600 hover:text-green-800 font-medium flex items-center gap-0.5">
              Full <ChevronRight size={12} />
            </NavLink>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : dailyReport?.by_payment_mode?.length > 0 ? (
            <div className="space-y-2">
              {dailyReport.by_payment_mode.map(mode => {
                const Icon = MODE_ICON[mode.payment_mode] || CreditCard
                const iconColor = MODE_COLOR[mode.payment_mode] || 'bg-gray-500'
                return (
                  <div key={mode.payment_mode} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className={`w-8 h-8 rounded-lg ${iconColor} flex items-center justify-center shrink-0`}>
                      <Icon size={14} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 capitalize">{mode.payment_mode}</p>
                      <p className="text-xs text-gray-400">{mode.count} receipt{mode.count !== 1 ? 's' : ''}</p>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">{inr(mode.amount)}</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-36 flex flex-col items-center justify-center text-gray-300 gap-2">
              <IndianRupee size={28} />
              <p className="text-sm">No collections today</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent receipts — real data */}
        <div className="lg:col-span-2 table-container">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Recent Receipts</h3>
            <NavLink to="/fees/receipts" className="text-xs text-green-600 hover:text-green-800 font-medium flex items-center gap-0.5">
              View All <ChevronRight size={12} />
            </NavLink>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Receipt No.</th>
                <th>Student</th>
                <th>Class</th>
                <th>Mode</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loadingReceipts ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">Loading…</td></tr>
              ) : recent.length > 0 ? (
                recent.map(r => (
                  <tr key={r.id}>
                    <td className="font-mono text-gray-600">{r.receipt_no}</td>
                    <td className="font-medium text-gray-800">{r.student_name}</td>
                    <td className="text-gray-500">{r.class_name}{r.section_name ? `-${r.section_name}` : ''}</td>
                    <td className="capitalize text-gray-500">{r.payment_mode}</td>
                    <td className="text-right font-semibold text-gray-900">{inr(r.net_amount)}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">No receipts yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Today — collection by mode bar */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Today by Mode</h3>
          {dailyReport?.by_payment_mode?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={dailyReport.by_payment_mode.map(m => ({ name: m.payment_mode, amount: Number(m.amount || 0) }))}
                margin={{ top: 0, right: 0, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
                  formatter={v => [inr(v), 'Amount']} />
                <Bar dataKey="amount" radius={[4,4,0,0]} name="Amount">
                  {dailyReport.by_payment_mode.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-300 text-sm">No data</div>
          )}
        </div>
      </div>

    </div>
  )
}
