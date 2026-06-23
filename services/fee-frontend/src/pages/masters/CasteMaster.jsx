import SimpleLabelMaster from './SimpleLabelMaster'
import { masterApi } from '../../services/api'

export default function CasteMaster() {
  return (
    <SimpleLabelMaster
      title="Caste Master"
      subtitle="Caste options for student records"
      fieldName="caste_name"
      fieldLabel="Caste Name"
      placeholder="e.g., Brahmin, Rajput, Yadav"
      queryKey="caste-master"
      addLabel="Add Caste"
      itemLabel="Caste"
      api={{
        get: masterApi.getCasteMaster,
        create: masterApi.createCasteMaster,
        update: masterApi.updateCasteMaster,
        remove: masterApi.deleteCasteMaster,
        toggle: masterApi.toggleCasteMasterStatus,
      }}
    />
  )
}
