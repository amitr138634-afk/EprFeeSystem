import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { transportApi, masterApi } from '../../services/api'
import useAuthStore from '../../store/authStore'

const listOf = (r) => r.data.results || r.data

/** Shared report: students currently using transport, with optional
 * Bus/Route/Stop filters (each toggled per page) plus Class/Section filters
 * that apply on every variant. Powers Using Transport, Bus-wise List,
 * Route-wise List, and Stop-wise List — same data, different filter focus. */
export default function TransportUsageReport({ title, subtitle, showVehicleFilter, showRouteFilter, showStopFilter }) {
  const navigate = useNavigate()
  const [vehicleId, setVehicleId] = useState('')
  const [routeId, setRouteId] = useState('')
  const [stopId, setStopId] = useState('')
  const [className, setClassName] = useState('')
  const [section, setSection] = useState('')

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles-transport-report'],
    queryFn: () => transportApi.vehicles().then(listOf),
    enabled: !!showVehicleFilter,
  })
  const { data: routes = [] } = useQuery({
    queryKey: ['routes-transport-report'],
    queryFn: () => transportApi.routes().then(listOf),
    enabled: !!showRouteFilter || !!showStopFilter,
  })
  const { data: classes = [] } = useQuery({
    queryKey: ['classes-transport-report'],
    queryFn: () => masterApi.classes().then(listOf),
  })
  const { data: sections = [] } = useQuery({
    queryKey: ['sections-transport-report'],
    queryFn: () => masterApi.getSectionMaster().then(listOf),
  })

  const stopOptions = useMemo(() => {
    const opts = []
    for (const route of routes) {
      for (const stop of route.stops || []) opts.push({ ...stop, route_name: route.name })
    }
    return opts
  }, [routes])

  const params = {
    ...(vehicleId && { vehicle_id: vehicleId }),
    ...(routeId && { route_id: routeId }),
    ...(stopId && { stop_id: stopId }),
    ...(className && { class_name: className }),
    ...(section && { section }),
  }

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['transport-using-report', params],
    queryFn: () => transportApi.usingTransportReport(params).then(r => r.data),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </div>

      <div className="card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {showVehicleFilter && (
            <div>
              <label className="form-label">Bus</label>
              <select className="form-select" value={vehicleId} onChange={e => setVehicleId(e.target.value)}>
                <option value="">All Buses</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.bus_no}</option>)}
              </select>
            </div>
          )}
          {showRouteFilter && (
            <div>
              <label className="form-label">Route</label>
              <select className="form-select" value={routeId} onChange={e => setRouteId(e.target.value)}>
                <option value="">All Routes</option>
                {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          )}
          {showStopFilter && (
            <div>
              <label className="form-label">Stop</label>
              <select className="form-select" value={stopId} onChange={e => setStopId(e.target.value)}>
                <option value="">All Stops</option>
                {stopOptions.map(s => <option key={s.id} value={s.id}>{s.name} ({s.route_name})</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="form-label">Class</label>
            <select className="form-select" value={className} onChange={e => setClassName(e.target.value)}>
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Section</label>
            <select className="form-select" value={section} onChange={e => setSection(e.target.value)}>
              <option value="">All Sections</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.section}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="stat-card max-w-xs">
        <p className="stat-label">Students Using Transport</p>
        <p className="stat-value">{rows.length}</p>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Admission No</th><th>Student Name</th><th>Class</th><th>Section</th>
              <th>Route</th><th>Bus No.</th><th>Stop</th><th className="text-right">Monthly Fee</th><th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={9} className="text-center py-8 text-gray-400">Loading...</td></tr>}
            {!isLoading && rows.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-gray-400">No students found</td></tr>}
            {rows.map(r => (
              <tr key={r.student_id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/feemgmt/student-profile/${r.student_id}`)}>
                <td className="font-medium text-gray-900">{r.admission_no}</td>
                <td>{r.student_name}</td>
                <td>{r.class_name}</td>
                <td>{r.section}</td>
                <td>{r.route_name}</td>
                <td>{r.bus_no || '—'}</td>
                <td>{r.stop_name}</td>
                <td className="text-right">₹{r.monthly_fee.toLocaleString('en-IN')}</td>
                <td className="text-blue-600 text-xs">View →</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
