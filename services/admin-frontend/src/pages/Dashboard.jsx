import { useQuery } from '@tanstack/react-query'
import { Users, GraduationCap, UserCheck, Calendar, Gift, Bell } from 'lucide-react'
import StatCard from '../components/common/StatCard'
import { schoolApi, studentApi, staffApi, attendanceApi } from '../services/api'
import { format } from 'date-fns'
import useAuthStore from '../store/authStore'

function BirthdayCard({ name, className }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 bg-amber-50 rounded-lg border border-amber-100">
      <div>
        <p className="text-sm font-semibold text-gray-800">{name}</p>
        <p className="text-xs text-gray-500">{className}</p>
      </div>
      <Gift size={18} className="text-amber-500" />
    </div>
  )
}

function AttendanceStatusGrid({ data }) {
  const classes = [...new Set(data?.map(r => r['student__class_ref__name']) || [])]
  return (
    <div className="flex flex-wrap gap-2">
      {classes.map(cls => (
        <span key={cls} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md border border-blue-100">
          {cls}
        </span>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const today = format(new Date(), 'yyyy-MM-dd')

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => schoolApi.dashboard().then(r => r.data),
    enabled: !!user,
  })

  const { data: attendanceSummary } = useQuery({
    queryKey: ['attendance-summary', today],
    queryFn: () => attendanceApi.summary({ date: today }).then(r => r.data),
  })

  const todayLabel = format(new Date(), 'EEEE, MMMM d, yyyy')

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500">{todayLabel}</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Bell size={15} />
          New Circular
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={dashboardData?.total_students ?? '—'}
          icon={GraduationCap}
          color="blue"
        />
        <StatCard
          title="Total Staff"
          value={dashboardData?.total_staff ?? '—'}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Present Today"
          value={attendanceSummary?.reduce((a, r) => a + (r.present || 0), 0) ?? '—'}
          icon={UserCheck}
          color="teal"
          subtitle="Students"
        />
        <StatCard
          title="Absent Today"
          value={attendanceSummary?.reduce((a, r) => a + (r.absent || 0), 0) ?? '—'}
          icon={UserCheck}
          color="orange"
          subtitle="Students"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Absent Staff */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Absent Staff</h3>
            <button className="text-xs bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600">View All</button>
          </div>
          <p className="text-center text-gray-400 text-sm py-6">No data available</p>
        </div>

        {/* Today's Leave Requests */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Today&apos;s Leave Request</h3>
            <button className="text-xs bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600">View All</button>
          </div>
          <p className="text-center text-gray-400 text-sm py-6">No leave requests</p>
        </div>

        {/* Today's Birthday */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Today&apos;s Birthday</h3>
            <button className="text-xs bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600">View All</button>
          </div>
          <div className="space-y-2">
            <BirthdayCard name="KABRA CHAWLA" className="X-A" />
            <BirthdayCard name="HRIDAY AGRAWAL" className="IX-B" />
            <BirthdayCard name="ARPAN AGGARWAL" className="VIII-C" />
          </div>
        </div>

        {/* Absent Students */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Absent/Leave Students</h3>
            <button className="text-xs bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600">View All</button>
          </div>
          <p className="text-center text-gray-400 text-sm py-6">No data available</p>
        </div>

        {/* Staff Birthday */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Today&apos;s Staff Birthday</h3>
            <button className="text-xs bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600">View All</button>
          </div>
          <p className="text-center text-gray-400 text-sm py-6">No staff birthdays</p>
        </div>
      </div>

      {/* Class Attendance Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Today&apos;s Class Attendance Status</h3>
            <button className="text-xs bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600">View All</button>
          </div>
          {attendanceSummary && attendanceSummary.length > 0 ? (
            <AttendanceStatusGrid data={attendanceSummary} />
          ) : (
            <p className="text-center text-gray-400 text-sm py-4">No attendance data</p>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Today&apos;s Class HW Status</h3>
            <button className="text-xs bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600">View All</button>
          </div>
          <p className="text-center text-gray-400 text-sm py-4">No homework data</p>
        </div>
      </div>
    </div>
  )
}
