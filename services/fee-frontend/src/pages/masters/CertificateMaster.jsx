import SimpleLabelMaster from './SimpleLabelMaster'
import { masterApi } from '../../services/api'

export default function CertificateMaster() {
  return (
    <SimpleLabelMaster
      title="Certificate Master"
      subtitle="Certificate types (Birth Certificate, Transfer Certificate, etc.) — defines exactly which upload slots appear on a student's profile"
      fieldName="certificate_name"
      fieldLabel="Certificate Name"
      placeholder="e.g., Birth Certificate, Transfer Certificate, Caste Certificate"
      queryKey="certificate-master"
      addLabel="Add Certificate"
      itemLabel="Certificate"
      api={{
        get: masterApi.getCertificateMaster,
        create: masterApi.createCertificateMaster,
        update: masterApi.updateCertificateMaster,
        remove: masterApi.deleteCertificateMaster,
        toggle: masterApi.toggleCertificateMasterStatus,
      }}
    />
  )
}
