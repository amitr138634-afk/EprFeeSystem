import { useQuery } from '@tanstack/react-query'
import { NavLink } from 'react-router-dom'
import {
  GraduationCap, Users, UserCheck, UserX,
  ClipboardList, CalendarCheck, BookOpen,
  ChevronRight, Gift, Clock, TrendingUp,
  LayoutGrid, Layers
} from 'lucide-react'
import { format } from 'date-fns'
import useAuthStore from '../store/authStore'
import { studentApi, staffApi, attendanceApi } from '../services/api'

/* ── Greeting ──────────────────────────────────────────────────────────── */
function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

/* ── Stat card ─────────────────────────────────────────────────────────── */
function Stat({ title, value, sub, icon: Icon, from, to, loading }) {
  return (
    <div className={`rounded-2xl p-5 text-white bg-gradient-to-br ${from} ${to} shadow-md`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-white/70">{title}</p>
          <p className="text-3xl font-bold mt-1">
            {loading ? <span className="animate-pulse text-white/60">—</span> : value ?? '—'}
          </p>
          {sub && <p className="text-xs text-white/60 mt-0.5">{sub}</p>}
        </div>
        <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
          <Icon size={22} />
        </div>
      </div>
    </div>
  )
}

/* ── Quick action button ───────────────────────────────────────────────── */
function QuickAction({ to, icon: Icon, label, color }) {
  const colorMap = {
    blue:   'bg-blue-50 text-blue-700 hover:bg-blue-100',
    green:  'bg-green-50 text-green-700 hover:bg-green-100',
    purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
    orange: 'bg-orange-50 text-orange-700 hover:bg-orange-100',
    teal:   'bg-teal-50 text-teal-700 hover:bg-teal-100',
    rose:   'bg-rose-50 text-rose-700 hover:bg-rose-100',
  }
  return (
    <NavLink
      to={to}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl font-medium text-xs text-center transition-all duration-150 ${colorMap[color]}`}
    >
      <Icon size={22} />
      {label}
    </NavLink>
  )
}

/* ── Class attendance row ──────────────────────────────────────────────── */
function AttendanceRow({ cls }) {
  const pct = cls.total > 0 ? Math.round((cls.present / cls.total) * 100) : 0
  const barColor = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="py-2.5 border-b border-gray-50 last:border-0">
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="font-medium text-gray-700">{cls.class_name}</span>
        <span className="text-xs text-gray-400">{cls.present}/{cls.total}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={`text-xs font-semibold w-8 text-right ${
          pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600'
        }`}>{pct}%</span>
      </div>
    </div>
  )
}

/* ── Main Dashboard ────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { user } = useAuthStore()
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayLabel = format(new Date(), 'EEEE, d MMMM yyyy')

  const { data: studentData, isLoading: loadingStudents } = useQuery({
    queryKey: ['students-count'],
    queryFn: () => studentApi.list({ page: 1, page_size: 1 }).then(r => r.data),
  })

  const { data: staffData, isLoading: loadingStaff } = useQuery({
    queryKey: ['staff-count'],
    queryFn: () => staffApi.list({ page: 1, page_size: 1 }).then(r => r.data),
  })

  const { data: attendanceSummary = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ['attendance-summary', today],
    queryFn: () => attendanceApi.summary({ date: today }).then(r => r.data),
  })

  const { data: strengthData = [], isLoading: loadingStrength } = useQuery({
    queryKey: ['strength'],
    queryFn: () => studentApi.strength().then(r => r.data),
  })

  const { data: leaveData = [] } = useQuery({
    queryKey: ['leave-requests-pending'],
    queryFn: () => staffApi.leaveRequests({ status: 'pending' }).then(r => r.data.results || r.data),
  })

  const totalStudents = studentData?.count ?? null
  const totalStaff    = staffData?.count ?? null
  const presentToday  = Array.isArray(attendanceSummary)
    ? attendanceSummary.reduce((s, r) => s + (r.present || 0), 0) : null
  const absentToday   = Array.isArray(attendanceSummary)
    ? attendanceSummary.reduce((s, r) => s + (r.absent || 0), 0) : null

  // Aggregate strength by class (sum sections)
  const classTotals = strengthData.reduce((acc, row) => {
    const existing = acc.find(c => c.class_name === row.class_name)
    if (existing) {
      existing.total += row.total
      existing.boys  += row.boys
      existing.girls += row.girls
    } else {
      acc.push({ class_name: row.class_name, total: row.total, boys: row.boys, girls: row.girls })
    }
    return acc
  }, [])

  // Build attendance rows (enrich with total from strength if available)
  const attendanceRows = Array.isArray(attendanceSummary) && attendanceSummary.length > 0
    ? attendanceSummary.map(r => ({
        class_name: r.class_name || r.class_ref__name || 'Unknown',
        present: r.present || 0,
        absent:  r.absent  || 0,
        total:   r.total   || (r.present || 0) + (r.absent || 0),
      }))
    : []

  return (
    <div className="space-y-6">

      {/* ── Welcome Banner ── */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-white/70 text-sm font-medium">{greeting()},</p>
            <h1 className="text-2xl font-bold mt-0.5">{user?.full_name || 'Admin'}</h1>
            <p className="text-white/60 text-sm mt-1 flex items-center gap-1.5">
              <Clock size={13} /> {todayLabel}
            </p>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-white/50 text-xs uppercase tracking-wider">School</p>
            <p className="text-lg font-semibold">{user?.school_name || 'School'}</p>
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          title="Total Students"
          value={totalStudents}
          sub="Enrolled"
          icon={GraduationCap}
          from="from-blue-500" to="to-blue-700"
          loading={loadingStudents}
        />
        <Stat
          title="Total Staff"
          value={totalStaff}
          sub="Active members"
          icon={Users}
          from="from-emerald-500" to="to-emerald-700"
          loading={loadingStaff}
        />
        <Stat
          title="Present Today"
          value={presentToday}
          sub="Students"
          icon={UserCheck}
          from="from-teal-500" to="to-teal-700"
          loading={loadingAttendance}
        />
        <Stat
          title="Absent Today"
          value={absentToday}
          sub="Students"
          icon={UserX}
          from="from-rose-500" to="to-rose-700"
          loading={loadingAttendance}
        />
      </div>

      {/* ── Middle Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Class-wise Attendance */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-800">Today's Attendance</h3>
              <p className="text-xs text-gray-400 mt-0.5">Class-wise present %</p>
            </div>
            <NavLink
              to="/attendance/students"
              className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
            >
              Mark Attendance <ChevronRight size={13} />
            </NavLink>
          </div>

          {loadingAttendance ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-9 bg-gray-100 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : attendanceRows.length > 0 ? (
            <div className="overflow-y-auto max-h-64 pr-1">
              {attendanceRows.map((row, i) => <AttendanceRow key={i} cls={row} />)}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-300">
              <CalendarCheck size={36} className="mx-auto mb-2" />
              <p className="text-sm">No attendance marked yet today</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2.5">
            <QuickAction to="/attendance/students" icon={CalendarCheck}  label="Mark Attendance" color="blue" />
            <QuickAction to="/students"            icon={GraduationCap}  label="Students"        color="teal" />
            <QuickAction to="/staff"               icon={Users}          label="Staff"           color="green" />
            <QuickAction to="/attendance/register" icon={ClipboardList}  label="Attendance Register" color="purple" />
            <QuickAction to="/academics/marks"     icon={BookOpen}       label="Marks Feeding"   color="orange" />
            <QuickAction to="/students/classes"    icon={Layers}         label="Class Master"    color="rose" />
          </div>
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Student Strength */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-800">Student Strength</h3>
              <p className="text-xs text-gray-400 mt-0.5">Class-wise total</p>
            </div>
            <NavLink
              to="/students/strength"
              className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
            >
              Full Report <ChevronRight size={13} />
            </NavLink>
          </div>

          {loadingStrength ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-8 bg-gray-100 animate-pulse rounded-lg" />)}
            </div>
          ) : classTotals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Class</th>
                    <th className="text-center pb-2 text-xs font-semibold text-blue-400 uppercase tracking-wide">Boys</th>
                    <th className="text-center pb-2 text-xs font-semibold text-pink-400 uppercase tracking-wide">Girls</th>
                    <th className="text-center pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {classTotals.map((row, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 font-medium text-gray-700">{row.class_name}</td>
                      <td className="py-2.5 text-center text-blue-600 font-semibold">{row.boys}</td>
                      <td className="py-2.5 text-center text-pink-500 font-semibold">{row.girls}</td>
                      <td className="py-2.5 text-center">
                        <span className="bg-gray-100 text-gray-700 font-bold px-2 py-0.5 rounded-full text-xs">{row.total}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-50">
                    <td className="py-2.5 font-bold text-gray-800 text-xs uppercase tracking-wide">Total</td>
                    <td className="py-2.5 text-center font-bold text-blue-700">
                      {classTotals.reduce((s, r) => s + r.boys, 0)}
                    </td>
                    <td className="py-2.5 text-center font-bold text-pink-600">
                      {classTotals.reduce((s, r) => s + r.girls, 0)}
                    </td>
                    <td className="py-2.5 text-center font-bold text-gray-800">
                      {classTotals.reduce((s, r) => s + r.total, 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-300">
              <LayoutGrid size={36} className="mx-auto mb-2" />
              <p className="text-sm">No students enrolled yet</p>
            </div>
          )}
        </div>

        {/* Birthdays & Leave */}
        <div className="space-y-4">
          {/* Today's Birthdays */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Gift size={15} className="text-amber-500" /> Today's Birthdays
              </h3>
            </div>
            <div className="text-center py-5 text-gray-300">
              <Gift size={28} className="mx-auto mb-1" />
              <p className="text-xs">No birthdays today</p>
            </div>
          </div>

          {/* Pending Leave */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp size={15} className="text-blue-500" /> Leave Requests
              </h3>
              {leaveData.length > 0 && (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {leaveData.length} pending
                </span>
              )}
            </div>
            {leaveData.length > 0 ? (
              <div className="space-y-2">
                {leaveData.slice(0, 3).map((req, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <p className="text-sm font-medium text-gray-700">{req.staff_name || 'Staff'}</p>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Pending</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-center text-gray-400 py-4">No pending requests</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
