import { useQuery } from '@tanstack/react-query'
import { NavLink } from 'react-router-dom'
import { Gift, CalendarDays } from 'lucide-react'
import { format } from 'date-fns'
import useAuthStore from '../store/authStore'
import { adminApi } from '../services/api'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function CardHead({ title, to }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      {to && (
        <NavLink
          to={to}
          className="text-xs font-semibold px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors duration-150"
        >
          View All
        </NavLink>
      )}
    </div>
  )
}

function SkeletonList() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map(i => <div key={i} className="h-9 bg-gray-100 rounded animate-pulse" />)}
    </div>
  )
}

function EmptyState({ text }) {
  return <div className="flex items-center justify-center py-10 text-sm text-gray-400">{text}</div>
}

function PersonRow({ name, sub }) {
  return (
    <li className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium text-gray-800 truncate">{name}</span>
      {sub && <span className="text-xs text-gray-400 ml-2 shrink-0">{sub}</span>}
    </li>
  )
}

function BirthdayRow({ name, sub }) {
  return (
    <li className="flex items-center gap-3 p-2.5 rounded-lg bg-green-50">
      <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center shrink-0">
        <Gift size={15} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </li>
  )
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const today = format(new Date(), 'dd MMM yyyy, EEEE')

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => adminApi.dashboardStats().then(r => r.data),
  })

  const absentStaff       = data?.absent_staff || []
  const leaveRequests     = data?.today_leave_requests || []
  const studentBirthdays  = data?.student_birthdays || []
  const staffBirthdays    = data?.staff_birthdays || []
  const absentStudents    = data?.absent_students || []
  const attendanceStatus  = data?.class_attendance_status || []
  const hwStatus          = data?.class_hw_status || []

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {greeting()}, {user?.full_name?.split(' ')[0] || 'User'}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
          <CalendarDays size={13} /> {today}
        </p>
      </div>

      {/* Row 1 — Absent Staff · Leave Request · Birthday */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <div className="card p-5">
          <CardHead title="Absent Staff" to="/attendance/staff/date-wise" />
          {isLoading ? <SkeletonList /> : absentStaff.length ? (
            <ul>
              {absentStaff.map((s, i) => <PersonRow key={i} name={s.name} sub={s.designation} />)}
            </ul>
          ) : <EmptyState text="No data available" />}
        </div>

        <div className="card p-5">
          <CardHead title="Today's Leave Request" to="/attendance/staff/leave-requests" />
          {isLoading ? <SkeletonList /> : leaveRequests.length ? (
            <ul className="space-y-1">
              {leaveRequests.map((l, i) => (
                <li key={i} className="py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800 truncate">{l.staff_name}</span>
                    {l.leave_type && <span className="badge badge-yellow ml-2 shrink-0">{l.leave_type}</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{l.from_date} → {l.to_date}</p>
                </li>
              ))}
            </ul>
          ) : <EmptyState text="No leave requests" />}
        </div>

        <div className="card p-5">
          <CardHead title="Today's Birthday" to="/students" />
          {isLoading ? <SkeletonList /> : studentBirthdays.length ? (
            <ul className="space-y-2">
              {studentBirthdays.map((b, i) => <BirthdayRow key={i} name={b.name} sub={b.class_section} />)}
            </ul>
          ) : <EmptyState text="No birthdays today" />}
        </div>
      </div>

      {/* Row 2 — Absent/Leave Students · Staff Birthday */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <div className="card p-5">
          <CardHead title="Absent / Leave Student's" to="/attendance/absent-log" />
          {isLoading ? <SkeletonList /> : absentStudents.length ? (
            <ul>
              {absentStudents.map((s, i) => (
                <li key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.class_section}</p>
                  </div>
                  <span className={`badge ml-2 shrink-0 ${s.type === 'Leave' ? 'badge-yellow' : 'badge-red'}`}>{s.type}</span>
                </li>
              ))}
            </ul>
          ) : <EmptyState text="No data available" />}
        </div>

        <div className="card p-5">
          <CardHead title="Today's Staff Birthday" to="/staff" />
          {isLoading ? <SkeletonList /> : staffBirthdays.length ? (
            <ul className="space-y-2">
              {staffBirthdays.map((b, i) => <BirthdayRow key={i} name={b.name} sub={b.designation} />)}
            </ul>
          ) : <EmptyState text="No staff birthdays" />}
        </div>
      </div>

      {/* Row 3 — Class Attendance Status · Class HW Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <div className="card p-5">
          <CardHead title="Today's Class Attendance Status" to="/attendance/summary" />
          {isLoading ? <SkeletonList /> : attendanceStatus.length ? (
            <>
              <div className="flex flex-wrap gap-1.5">
                {attendanceStatus.map((c, i) => (
                  <span
                    key={i}
                    title={c.marked ? `${c.present}/${c.total} present` : 'Not marked'}
                    className={`px-2 py-1 rounded-md text-xs font-medium border ${
                      c.marked
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-gray-50 text-gray-400 border-gray-200'
                    }`}
                  >
                    {c.label}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-green-500 inline-block" /> Marked</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-gray-300 inline-block" /> Not marked</span>
              </div>
            </>
          ) : <EmptyState text="No classes configured" />}
        </div>

        <div className="card p-5">
          <CardHead title="Today's Class HW Status" />
          {isLoading ? <SkeletonList /> : hwStatus.length ? (
            <div className="flex flex-wrap gap-1.5">
              {hwStatus.map((c, i) => (
                <span
                  key={i}
                  title="Not marked"
                  className="px-2 py-1 rounded-md text-xs font-medium border bg-gray-50 text-gray-400 border-gray-200"
                >
                  {c.label}
                </span>
              ))}
            </div>
          ) : <EmptyState text="No classes configured" />}
        </div>
      </div>

    </div>
  )
}
