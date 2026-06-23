import SimpleLabelMaster from './SimpleLabelMaster'
import { masterApi } from '../../services/api'

export default function ReligionMaster() {
  return (
    <SimpleLabelMaster
      title="Religion Master"
      subtitle="Religion options for student records"
      fieldName="religion_name"
      fieldLabel="Religion Name"
      placeholder="e.g., Hindu, Muslim, Christian, Sikh"
      queryKey="religion-master"
      addLabel="Add Religion"
      itemLabel="Religion"
      api={{
        get: masterApi.getReligionMaster,
        create: masterApi.createReligionMaster,
        update: masterApi.updateReligionMaster,
        remove: masterApi.deleteReligionMaster,
        toggle: masterApi.toggleReligionMasterStatus,
      }}
    />
  )
}
