import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Edit, Download, FileText, CreditCard, User } from 'lucide-react'
import { staffApi } from '../../services/api'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function ViewStaff() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff', id],
    queryFn: () => staffApi.get(id).then(r => r.data),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading staff details...</p>
      </div>
    )
  }

  if (!staff) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Staff not found</p>
      </div>
    )
  }

  const InfoRow = ({ label, value }) => (
    <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100">
      <dt className="text-sm font-medium text-gray-600">{label}</dt>
      <dd className="col-span-2 text-sm text-gray-900">{value || '-'}</dd>
    </div>
  )

  const FileLink = ({ url, icon: Icon, label }) => {
    if (!url) return <span className="text-sm text-gray-400">Not uploaded</span>
    return (
      <a
        href={`${API_BASE}${url}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
      >
        <Icon size={16} />
        <span>View {label}</span>
        <Download size={14} />
      </a>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/staff')} className="p-2 hover:bg-gray-100 rounded">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Staff Details</h1>
            <p className="text-sm text-gray-500">{staff.full_name} ({staff.employee_id})</p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/staff/edit/${id}`)}
          className="btn-primary flex items-center gap-2"
        >
          <Edit size={16} /> Edit Staff
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile Card */}
        <div className="card p-5 text-center">
          <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center overflow-hidden">
            {staff.photo && staff.photo !== '' ? (
              <img 
                src={staff.photo.startsWith('http') ? staff.photo : `${API_BASE}${staff.photo}`} 
                alt={staff.full_name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.parentElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'
                }}
              />
            ) : (
              <User size={48} className="text-gray-400" />
            )}
          </div>
          <h2 className="text-lg font-bold text-gray-800">{staff.full_name}</h2>
          <p className="text-sm text-gray-500 mb-1">{staff.designation_name}</p>
          <p className="text-xs text-gray-400">{staff.department_name}</p>
          <div className="mt-4 pt-4 border-t">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              staff.status === 'active'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {staff.status}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Personal Information */}
          <div className="card p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User size={18} className="text-blue-600" />
              Personal Information
            </h3>
            <dl className="space-y-0">
              <InfoRow label="Employee ID" value={staff.employee_id} />
              <InfoRow label="Email" value={staff.email} />
              <InfoRow label="Phone" value={staff.phone} />
              <InfoRow label="Alternate Phone" value={staff.alternate_phone} />
              <InfoRow label="Date of Birth" value={staff.date_of_birth} />
              <InfoRow label="Gender" value={staff.gender === 'M' ? 'Male' : staff.gender === 'F' ? 'Female' : 'Other'} />
              <InfoRow label="Blood Group" value={staff.blood_group} />
              <InfoRow label="Aadhar Number" value={staff.aadhar_no} />
              <InfoRow label="PAN Number" value={staff.pan_no} />
              <InfoRow label="Address" value={`${staff.address}${staff.city ? ', ' + staff.city : ''}${staff.state ? ', ' + staff.state : ''}${staff.pincode ? ' - ' + staff.pincode : ''}`} />
            </dl>
            
            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Photo:</span>
                <FileLink url={staff.photo} icon={User} label="Photo" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Aadhar Card:</span>
                <FileLink url={staff.aadhar_card} icon={CreditCard} label="Aadhar" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">PAN Card:</span>
                <FileLink url={staff.pan_card} icon={FileText} label="PAN" />
              </div>
            </div>
          </div>

          {/* Bank Information */}
          <div className="card p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Bank Information</h3>
            <dl className="space-y-0">
              <InfoRow label="Bank Name" value={staff.bank_name} />
              <InfoRow label="Account Number" value={staff.bank_account} />
              <InfoRow label="IFSC Code" value={staff.bank_ifsc} />
              <InfoRow label="Monthly Salary" value={staff.salary ? `₹${parseFloat(staff.salary).toLocaleString('en-IN')}` : '-'} />
            </dl>
          </div>

          {/* Family Information */}
          <div className="card p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Family Information</h3>
            <dl className="space-y-0">
              <InfoRow label="Father/Husband Name" value={staff.father_or_husband_name} />
              <InfoRow label="Mother Name" value={staff.mother_name} />
              <InfoRow label="Marital Status" value={staff.marital_status?.charAt(0).toUpperCase() + staff.marital_status?.slice(1)} />
              <InfoRow label="Spouse Name" value={staff.spouse_name} />
              <InfoRow label="Emergency Contact Person" value={staff.emergency_contact_person} />
              <InfoRow label="Emergency Contact Number" value={staff.emergency_contact_number} />
            </dl>
          </div>

          {/* Employment Information */}
          <div className="card p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Employment Information</h3>
            <dl className="space-y-0">
              <InfoRow label="Department" value={staff.department_name} />
              <InfoRow label="Designation" value={staff.designation_name} />
              <InfoRow label="Staff Type" value={staff.staff_type === 'teaching' ? 'Teaching' : 'Non-Teaching'} />
              <InfoRow label="Joining Date" value={staff.joining_date} />
              <InfoRow label="Qualification" value={staff.qualification} />
              <InfoRow label="Experience" value={staff.experience_years ? `${staff.experience_years} years` : '-'} />
              <InfoRow label="Status" value={staff.status?.charAt(0).toUpperCase() + staff.status?.slice(1)} />
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
