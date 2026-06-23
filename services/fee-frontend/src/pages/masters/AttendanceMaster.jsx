import SimpleLabelMaster from './SimpleLabelMaster'
import { masterApi } from '../../services/api'

export default function AttendanceMaster() {
  return (
    <SimpleLabelMaster
      title="Attendance Master"
      subtitle="Attendance status options (Present, Absent, Leave, etc.) used in attendance registers"
      fieldName="status_name"
      fieldLabel="Status Name"
      placeholder="e.g., Present, Absent, Leave"
      queryKey="attendance-master"
      addLabel="Add Status"
      itemLabel="Status"
      api={{
        get: masterApi.getAttendanceMaster,
        create: masterApi.createAttendanceMaster,
        update: masterApi.updateAttendanceMaster,
        remove: masterApi.deleteAttendanceMaster,
        toggle: masterApi.toggleAttendanceMasterStatus,
      }}
    />
  )
}
