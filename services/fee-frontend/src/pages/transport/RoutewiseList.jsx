import TransportUsageReport from './TransportUsageReport'

export default function RoutewiseList() {
  return (
    <TransportUsageReport
      title="Route-wise List"
      subtitle="Pick a route to see which students travel on it — filter further by class or section"
      showRouteFilter
    />
  )
}
