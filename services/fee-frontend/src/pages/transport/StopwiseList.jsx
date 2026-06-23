import TransportUsageReport from './TransportUsageReport'

export default function StopwiseList() {
  return (
    <TransportUsageReport
      title="Stop-wise List"
      subtitle="Pick a stop to see which students board there — filter further by class or section"
      showStopFilter
    />
  )
}
