import TransportUsageReport from './TransportUsageReport'

export default function TransportStudents() {
  return (
    <TransportUsageReport
      title="Using Transport"
      subtitle="Students currently using transport — filter by bus, route, stop, class, or section"
      showVehicleFilter
      showRouteFilter
      showStopFilter
    />
  )
}
