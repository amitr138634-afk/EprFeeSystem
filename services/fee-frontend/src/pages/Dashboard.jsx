import { useQuery } from '@tanstack/react-query'
import { DollarSign, Receipt, AlertTriangle, TrendingUp, Bus, UserPlus } from 'lucide-react'
import StatCard from '../components/common/StatCard'
import { feeApi } from '../services/api'
import { format } from 'date-fns'

export default function Dashboard() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayLabel = format(new Date(), 'EEEE, MMMM d, yyyy')

  const { data: dailyReport } = useQuery({
    queryKey: ['daily-report', today],
    queryFn: () => feeApi.dailyReport({ date: today }).then(r => r.data),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Fee Panel Dashboard</h1>
          <p className="text-sm text-gray-500">{todayLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Today's Collection"
          value={dailyReport ? `₹${Number(dailyReport.total_amount || 0).toLocaleString('en-IN')}` : '—'}
          icon={DollarSign}
          color="green"
          subtitle={`${dailyReport?.total_receipts || 0} receipts`}
        />
        <StatCard title="Total Receipts" value={dailyReport?.total_receipts ?? '—'} icon={Receipt} color="blue" />
        <StatCard title="Fee Defaulters" value="—" icon={AlertTriangle} color="orange" subtitle="Pending dues" />
        <StatCard title="Transport Students" value="—" icon={Bus} color="purple" />
        <StatCard title="New Admissions" value="—" icon={UserPlus} color="teal" subtitle="This month" />
        <StatCard title="Monthly Collection" value="—" icon={TrendingUp} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Today's Collection by Mode */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Today's Collection by Mode</h3>
          {dailyReport?.by_payment_mode?.length > 0 ? (
            <div className="space-y-3">
              {dailyReport.by_payment_mode.map(mode => (
                <div key={mode.payment_mode} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full capitalize font-medium">
                      {mode.payment_mode}
                    </span>
                    <span className="text-sm text-gray-500">{mode.count} receipts</span>
                  </div>
                  <span className="font-semibold text-gray-800">
                    ₹{Number(mode.amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 text-sm py-6">No collections today</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Pay Fee', path: '/fees/pay', color: 'bg-blue-500' },
              { label: 'View Receipts', path: '/fees/receipts', color: 'bg-green-500' },
              { label: 'Fee Defaulters', path: '/fees/defaulters', color: 'bg-orange-500' },
              { label: 'Daily Report', path: '/fees/reports/daily', color: 'bg-purple-500' },
              { label: 'Add Visitor', path: '/frontdesk/visitors', color: 'bg-teal-500' },
              { label: 'New Admission', path: '/students/admissions', color: 'bg-pink-500' },
            ].map(action => (
              <a
                key={action.label}
                href={action.path}
                className={`${action.color} text-white px-4 py-3 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity text-center`}
              >
                {action.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
