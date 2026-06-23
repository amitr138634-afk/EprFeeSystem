import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { NavLink } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts'
import {
  IndianRupee, Wallet, AlertTriangle, Users, TrendingUp,
  Clock, FileWarning, ChevronRight, Phone, MessageSquare, Send,
  CreditCard, Banknote, Smartphone,
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import { feeApi } from '../services/api'

function inr(v) {
  return `₹${Number(v || 0).toLocaleString('en-IN')}`
}

function StatCard({ title, value, sub, icon: Icon, color, loading }) {
  const colors = {
    green: 'bg-green-600', blue: 'bg-blue-600', amber: 'bg-amber-500',
    purple: 'bg-purple-600', red: 'bg-red-600', teal: 'bg-teal-600', indigo: 'bg-indigo-600',
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

const MODE_ICON = { cash: Banknote, cheque: CreditCard, online: Wallet, upi: Smartphone, card: CreditCard }
const DONUT_COLORS = ['#16a34a', '#2563eb', '#7c3aed', '#0891b2', '#d97706']
const AGING_COLOR = { '0-30': '#16a34a', '31-60': '#f59e0b', '61-90': '#f97316', '90+': '#dc2626' }
const PRIORITY_BADGE = { HIGH: 'badge-red', MEDIUM: 'badge-yellow', LOW: 'badge-gray' }

function waLink(mobile) {
  if (!mobile) return null
  const digits = mobile.replace(/\D/g, '')
  const withCountry = digits.length === 10 ? `91${digits}` : digits
  return `https://wa.me/${withCountry}`
}

export default function Dashboard() {
  const activeSession = useAuthStore(s => s.currentSession?.session_year) || ''
  const [priorityTab, setPriorityTab] = useState('HIGH')

  const { data, isLoading } = useQuery({
    queryKey: ['fee-dashboard', activeSession],
    queryFn: () => feeApi.feeDashboard({ session: activeSession }).then(r => r.data),
  })

  const stats = data?.stats || {}
  const monthlyTrend = data?.monthly_trend || []
  const dueAging = data?.due_aging || {}
  const classCollection = data?.class_collection || []
  const paymentModeToday = data?.payment_mode_today || []
  const chequeAlerts = data?.cheque_alerts || {}
  const recoveryList = data?.recovery_list || []
  const topDefaulters = data?.top_defaulters || []

  const totalAging = Object.values(dueAging).reduce((s, v) => s + v, 0)
  const filteredRecovery = recoveryList.filter(r => r.priority === priorityTab)

  return (
    <div className="space-y-6">

      {/* Section 1 — Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Expected"   value={inr(stats.total_expected)}  icon={IndianRupee}  color="blue"   loading={isLoading} />
        <StatCard title="Total Collected"  value={inr(stats.total_collected)} icon={Wallet}       color="green"  loading={isLoading} />
        <StatCard title="Total Pending"    value={inr(stats.total_pending)}   icon={Clock}        color="amber"  loading={isLoading} />
        <StatCard title="Total Defaulters" value={stats.total_defaulters}     icon={AlertTriangle} color="red"   loading={isLoading} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Collection"   value={inr(stats.today_collection)} icon={IndianRupee} color="green"  loading={isLoading} />
        <StatCard title="This Month Collection" value={inr(stats.month_collection)} icon={TrendingUp}  color="purple" loading={isLoading} />
        <StatCard title="Overdue 30d+"          value={inr(stats.overdue_30plus)}   icon={Clock}       color="red"    loading={isLoading} />
        <StatCard title="Bounced Cheques"       value={stats.bounced_cheques}       icon={FileWarning} color="indigo" loading={isLoading} />
      </div>

      {/* Section 2 — Monthly Collection Trend */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Monthly Collection Trend</h3>
            <p className="text-xs text-gray-400 mt-0.5">Expected vs Collected, by month (₹)</p>
          </div>
        </div>
        {isLoading ? (
          <div className="h-[260px] bg-gray-50 rounded animate-pulse" />
        ) : monthlyTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyTrend} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} formatter={v => inr(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="expected" name="Expected" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="collected" name="Collected" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[260px] flex flex-col items-center justify-center text-gray-300 gap-2">
            <TrendingUp size={28} />
            <p className="text-sm">No collection data available</p>
          </div>
        )}
      </div>

      {/* Section 3 — Due Aging + Class Collection % */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Due Aging</h3>
          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : (
            <div className="space-y-4">
              {Object.entries(dueAging).map(([bucket, amount]) => {
                const pct = totalAging > 0 ? (amount / totalAging) * 100 : 0
                return (
                  <div key={bucket}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-600">{bucket} days</span>
                      <span className="font-semibold text-gray-900">{inr(amount)}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, backgroundColor: AGING_COLOR[bucket] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Class Collection %</h3>
          {isLoading ? (
            <div className="h-[220px] bg-gray-50 rounded animate-pulse" />
          ) : classCollection.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={classCollection} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="class_name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} formatter={v => [`${v}%`, 'Collected']} />
                <Bar dataKey="pct" radius={[4, 4, 0, 0]} name="Collection %">
                  {classCollection.map((c, i) => (
                    <Cell key={i} fill={c.pct >= 80 ? '#16a34a' : c.pct >= 50 ? '#f59e0b' : '#dc2626'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-300 text-sm">No class data available</div>
          )}
        </div>
      </div>

      {/* Section 4 — Payment Mode Snapshot + Cheque Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Payment Mode Snapshot (Today)</h3>
          {isLoading ? (
            <div className="h-[220px] bg-gray-50 rounded animate-pulse" />
          ) : paymentModeToday.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie data={paymentModeToday} dataKey="amount" nameKey="mode" innerRadius={45} outerRadius={75} paddingAngle={2}>
                    {paymentModeToday.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => inr(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {paymentModeToday.map((m, i) => {
                  const Icon = MODE_ICON[m.mode] || CreditCard
                  return (
                    <div key={m.mode} className="flex items-center gap-2 text-sm">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                      <Icon size={13} className="text-gray-400" />
                      <span className="capitalize text-gray-600 flex-1">{m.mode}</span>
                      <span className="font-semibold text-gray-900">{inr(m.amount)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-gray-300 gap-2">
              <IndianRupee size={28} />
              <p className="text-sm">No collections today</p>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Cheque Alerts</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
              <p className="text-2xl font-bold text-amber-700">{chequeAlerts.due_tomorrow ?? 0}</p>
              <p className="text-xs text-amber-600 mt-1">Due Tomorrow</p>
            </div>
            <div className="p-4 rounded-lg bg-red-50 border border-red-100">
              <p className="text-2xl font-bold text-red-700">{chequeAlerts.bounced ?? 0}</p>
              <p className="text-xs text-red-600 mt-1">Bounced</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-2xl font-bold text-blue-700">{chequeAlerts.pending_clearance ?? 0}</p>
              <p className="text-xs text-blue-600 mt-1">Pending Clearance</p>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
              <p className="text-2xl font-bold text-purple-700">{chequeAlerts.post_dated ?? 0}</p>
              <p className="text-xs text-purple-600 mt-1">Post-dated</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 5 — Recovery Priority List */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Recovery Priority List</h3>
          <div className="flex gap-1">
            {['HIGH', 'MEDIUM', 'LOW'].map(p => (
              <button
                key={p}
                onClick={() => setPriorityTab(p)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${priorityTab === p ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                {p} ({recoveryList.filter(r => r.priority === p).length})
              </button>
            ))}
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th><th>Class</th><th className="text-right">Amount Due</th>
                <th>Priority</th><th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={5} className="text-center py-8 text-gray-400">Loading...</td></tr>}
              {!isLoading && filteredRecovery.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No {priorityTab.toLowerCase()} priority students</td></tr>
              )}
              {filteredRecovery.slice(0, 25).map(r => (
                <tr key={r.student_id}>
                  <td className="font-medium text-gray-900">{r.student_name}</td>
                  <td>{r.class_name}{r.section ? `-${r.section}` : ''}</td>
                  <td className="text-right font-semibold text-red-600">{inr(r.amount_due)}</td>
                  <td><span className={PRIORITY_BADGE[r.priority]}>{r.priority}</span></td>
                  <td>
                    <div className="flex justify-center gap-1.5">
                      <a href={`tel:${r.father_mobile}`} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Call"><Phone size={14} /></a>
                      <a href={`sms:${r.father_mobile}`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="SMS"><MessageSquare size={14} /></a>
                      <a href={waLink(r.father_mobile)} target="_blank" rel="noreferrer" className="p-1.5 text-teal-600 hover:bg-teal-50 rounded" title="WhatsApp"><Send size={14} /></a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 6 — Top Defaulters */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Users size={15} className="text-gray-400" /> Top Defaulters</h3>
          <NavLink to="/feemgmt/defaulter-report" className="text-xs text-green-600 hover:text-green-800 font-medium flex items-center gap-0.5">
            View All <ChevronRight size={12} />
          </NavLink>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student Name</th><th>Class</th><th className="text-right">Amount Due</th>
                <th className="text-center">Overdue Days</th><th>Priority</th><th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td></tr>}
              {!isLoading && topDefaulters.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No defaulters — everyone's paid up!</td></tr>
              )}
              {topDefaulters.map(r => (
                <tr key={r.student_id}>
                  <td className="font-medium text-gray-900">{r.student_name}</td>
                  <td>{r.class_name}{r.section ? `-${r.section}` : ''}</td>
                  <td className="text-right font-semibold text-red-600">{inr(r.amount_due)}</td>
                  <td className="text-center">{r.overdue_days > 0 ? `${r.overdue_days}d` : '—'}</td>
                  <td><span className={PRIORITY_BADGE[r.priority]}>{r.priority}</span></td>
                  <td>
                    <div className="flex justify-center gap-1.5">
                      <a href={`tel:${r.father_mobile}`} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Call"><Phone size={14} /></a>
                      <a href={`sms:${r.father_mobile}`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="SMS"><MessageSquare size={14} /></a>
                      <a href={waLink(r.father_mobile)} target="_blank" rel="noreferrer" className="p-1.5 text-teal-600 hover:bg-teal-50 rounded" title="WhatsApp"><Send size={14} /></a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
