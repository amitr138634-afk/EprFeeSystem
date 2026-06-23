import TransportUsageReport from './TransportUsageReport'

export default function BuswiseList() {
  return (
    <TransportUsageReport
      title="Bus-wise List"
      subtitle="Pick a bus to see which students travel on it — filter further by class or section"
      showVehicleFilter
    />
  )
}
