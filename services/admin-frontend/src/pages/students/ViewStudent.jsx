import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, User, Phone, Mail, Calendar, MapPin, Users, FileText } from 'lucide-react'
import { studentApi } from '../../services/api'

export default function ViewStudent() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentApi.detail(id).then(r => r.data),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Student not found</p>
      </div>
    )
  }

  const InfoCard = ({ title, children }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">{title}</h3>
      {children}
    </div>
  )

  const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-start py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2 w-1/3 text-gray-600">
        {Icon && <Icon size={16} className="text-gray-400" />}
        <span className="text-sm font-medium">{label}:</span>
      </div>
      <div className="w-2/3 text-gray-900 font-medium">
        {value || '-'}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg shadow-lg">
        <button
          onClick={() => navigate('/students')}
          className="flex items-center gap-2 text-blue-100 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Students</span>
        </button>
        
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-4xl font-bold">
            {student.student_name?.charAt(0)?.toUpperCase() || 'S'}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{student.student_name}</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm">
                Admission No: {student.admission_no}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                student.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
              }`}>
                {student.status === 'active' ? '✓ Active' : student.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <InfoCard title="Personal Information">
          <InfoRow label="Full Name" value={student.student_name} icon={User} />
          <InfoRow label="Date of Birth" value={student.date_of_birth} icon={Calendar} />
          <InfoRow 
            label="Gender" 
            value={student.gender === 'M' ? 'Male' : student.gender === 'F' ? 'Female' : 'Other'} 
            icon={User} 
          />
          <InfoRow label="Admission Date" value={student.admission_date} icon={Calendar} />
          <InfoRow label="Session" value={student.session} icon={FileText} />
        </InfoCard>

        {/* Academic Information */}
        <InfoCard title="Academic Information">
          <InfoRow label="Class" value={student.class_name} icon={Users} />
          <InfoRow label="Status" value={student.status} icon={FileText} />
        </InfoCard>

        {/* Father's Information */}
        <InfoCard title="Father's Information">
          <InfoRow label="Father's Name" value={student.father_name} icon={User} />
          <InfoRow label="Mobile Number" value={student.father_mobile} icon={Phone} />
          <InfoRow label="Email" value={student.father_email} icon={Mail} />
        </InfoCard>

        {/* Mother's Information */}
        <InfoCard title="Mother's Information">
          <InfoRow label="Mother's Name" value={student.mother_name} icon={User} />
          <InfoRow label="Mobile Number" value={student.mother_mobile} icon={Phone} />
          <InfoRow label="Email" value={student.mother_email} icon={Mail} />
        </InfoCard>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => navigate('/students')}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back to List
        </button>
      </div>
    </div>
  )
}
