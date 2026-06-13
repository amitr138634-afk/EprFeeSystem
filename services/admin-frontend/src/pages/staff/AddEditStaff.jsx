import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { staffApi, studentApi } from '../../services/api'

const TABS = [
  { id: 'personal', label: 'Personal Information' },
  { id: 'bank', label: 'Bank Information' },
  { id: 'family', label: 'Family Information' },
  { id: 'employment', label: 'Employment Information' },
]

export default function AddEditStaff() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const [activeTab, setActiveTab] = useState('personal')
  
  const [form, setForm] = useState({
    // Personal
    employee_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    alternate_phone: '',
    date_of_birth: '',
    gender: 'M',
    blood_group: '',
    aadhar_no: '',
    pan_no: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    // Bank
    bank_name: '',
    bank_account: '',
    bank_ifsc: '',
    salary: '',
    // Family
    father_or_husband_name: '',
    mother_name: '',
    marital_status: 'single',
    spouse_name: '',
    emergency_contact_person: '',
    emergency_contact_number: '',
    // Employment
    department: '',
    designation: '',
    staff_type: 'teaching',
    class_assigned: '',
    section_assigned: '',
    joining_date: '',
    status: 'active',
    qualification: '',
    experience_years: 0,
  })

  const [files, setFiles] = useState({
    photo: null,
    aadhar_card: null,
    pan_card: null,
  })

  // Fetch staff details if editing
  const { data: staffData, isLoading: loadingStaff } = useQuery({
    queryKey: ['staff', id],
    queryFn: () => staffApi.get(id).then(r => r.data),
    enabled: isEdit,
  })

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => staffApi.departments().then(r => (r.data.results || r.data).filter(d => d.status === 'active')),
  })

  const { data: allDesignations = [] } = useQuery({
    queryKey: ['designations'],
    queryFn: () => staffApi.designations().then(r => (r.data.results || r.data).filter(d => d.status === 'active')),
  })

  const { data: deptDesignationMappings = [] } = useQuery({
    queryKey: ['dept-designation-mappings'],
    queryFn: () => staffApi.departmentDesignations().then(r => r.data.results || r.data),
  })

  const { data: classes = [] } = useQuery({
    queryKey: ['class-masters'],
    queryFn: () => studentApi.classMasters().then(r => r.data.results || r.data),
  })

  const { data: allSections = [] } = useQuery({
    queryKey: ['section-masters'],
    queryFn: () => studentApi.sectionMasters().then(r => r.data.results || r.data),
  })

  // Filter designations based on selected department
  const availableDesignations = form.department
    ? (() => {
        const mapping = deptDesignationMappings.find(m => m.department === parseInt(form.department))
        if (mapping && mapping.designations) {
          return allDesignations.filter(d => mapping.designations.includes(d.id))
        }
        return []
      })()
    : []

  // Filter sections based on selected class
  const availableSections = form.class_assigned
    ? allSections.filter(s => s.class_master === parseInt(form.class_assigned))
    : []

  useEffect(() => {
    if (staffData) {
      setForm({
        employee_id: staffData.employee_id || '',
        first_name: staffData.first_name || '',
        last_name: staffData.last_name || '',
        email: staffData.email || '',
        phone: staffData.phone || '',
        alternate_phone: staffData.alternate_phone || '',
        date_of_birth: staffData.date_of_birth || '',
        gender: staffData.gender || 'M',
        blood_group: staffData.blood_group || '',
        aadhar_no: staffData.aadhar_no || '',
        pan_no: staffData.pan_no || '',
        address: staffData.address || '',
        city: staffData.city || '',
        state: staffData.state || '',
        pincode: staffData.pincode || '',
        bank_name: staffData.bank_name || '',
        bank_account: staffData.bank_account || '',
        bank_ifsc: staffData.bank_ifsc || '',
        salary: staffData.salary || '',
        father_or_husband_name: staffData.father_or_husband_name || '',
        mother_name: staffData.mother_name || '',
        marital_status: staffData.marital_status || 'single',
        spouse_name: staffData.spouse_name || '',
        emergency_contact_person: staffData.emergency_contact_person || '',
        emergency_contact_number: staffData.emergency_contact_number || '',
        department: staffData.department || '',
        designation: staffData.designation || '',
        staff_type: staffData.staff_type || 'teaching',
        class_assigned: staffData.class_assigned || '',
        section_assigned: staffData.section_assigned || '',
        joining_date: staffData.joining_date || '',
        status: staffData.status || 'active',
        qualification: staffData.qualification || '',
        experience_years: staffData.experience_years || 0,
      })
    }
  }, [staffData])

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const formData = new FormData()
      
      // Add all text fields
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== '' && data[key] !== undefined) {
          formData.append(key, data[key])
        }
      })
      
      // Add file fields
      Object.keys(files).forEach(key => {
        if (files[key]) {
          formData.append(key, files[key])
        }
      })
      
      // Use custom config for multipart/form-data
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
      
      return isEdit
        ? staffApi.update(id, formData, config)
        : staffApi.create(formData, config)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Staff updated!' : 'Staff created!')
      navigate('/staff')
    },
    onError: (err) => {
      const errors = err.response?.data
      if (errors) {
        Object.keys(errors).forEach(key => {
          toast.error(`${key}: ${errors[key][0] || errors[key]}`)
        })
      } else {
        toast.error('Failed to save staff')
      }
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    saveMutation.mutate(form)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(p => {
      const newForm = { ...p, [name]: value }
      // Reset designation when department changes
      if (name === 'department') {
        newForm.designation = ''
      }
      // Reset section when class changes
      if (name === 'class_assigned') {
        newForm.section_assigned = ''
      }
      return newForm
    })
  }

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target
    if (fileList && fileList[0]) {
      setFiles(p => ({ ...p, [name]: fileList[0] }))
    }
  }

  if (isEdit && loadingStaff) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading staff details...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/staff')} className="p-2 hover:bg-gray-100 rounded">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">{isEdit ? 'Edit' : 'Add'} Staff</h1>
          <p className="text-sm text-gray-500">Fill in staff member details</p>
        </div>
      </div>

      <div className="card">
        {/* Tabs */}
        <div className="border-b border-gray-200 px-5">
          <div className="flex gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          {/* Personal Information */}
          {activeTab === 'personal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Employee ID *</label>
                  <input name="employee_id" value={form.employee_id} onChange={handleChange} className="form-input" required />
                </div>
                <div>
                  <label className="form-label">First Name *</label>
                  <input name="first_name" value={form.first_name} onChange={handleChange} className="form-input" required />
                </div>
                <div>
                  <label className="form-label">Last Name *</label>
                  <input name="last_name" value={form.last_name} onChange={handleChange} className="form-input" required />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Email *</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} className="form-input" required />
                </div>
                <div>
                  <label className="form-label">Phone *</label>
                  <input name="phone" value={form.phone} onChange={handleChange} className="form-input" required />
                </div>
                <div>
                  <label className="form-label">Alternate Phone</label>
                  <input name="alternate_phone" value={form.alternate_phone} onChange={handleChange} className="form-input" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Date of Birth *</label>
                  <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} className="form-input" required />
                </div>
                <div>
                  <label className="form-label">Gender *</label>
                  <select name="gender" value={form.gender} onChange={handleChange} className="form-input" required>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Blood Group</label>
                  <input name="blood_group" value={form.blood_group} onChange={handleChange} className="form-input" placeholder="e.g., A+, B-" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Aadhar Number</label>
                  <input name="aadhar_no" value={form.aadhar_no} onChange={handleChange} className="form-input" maxLength="12" placeholder="12-digit Aadhar" />
                </div>
                <div>
                  <label className="form-label">PAN Number</label>
                  <input name="pan_no" value={form.pan_no} onChange={handleChange} className="form-input" maxLength="10" placeholder="10-character PAN" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Photo</label>
                  <input type="file" name="photo" onChange={handleFileChange} className="form-input" accept="image/*" />
                </div>
                <div>
                  <label className="form-label">Aadhar Card Upload</label>
                  <input type="file" name="aadhar_card" onChange={handleFileChange} className="form-input" accept=".pdf,.jpg,.jpeg,.png" />
                </div>
                <div>
                  <label className="form-label">PAN Card Upload</label>
                  <input type="file" name="pan_card" onChange={handleFileChange} className="form-input" accept=".pdf,.jpg,.jpeg,.png" />
                </div>
              </div>

              <div>
                <label className="form-label">Address *</label>
                <textarea name="address" value={form.address} onChange={handleChange} className="form-input" rows="2" required />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="form-label">City</label>
                  <input name="city" value={form.city} onChange={handleChange} className="form-input" />
                </div>
                <div>
                  <label className="form-label">State</label>
                  <input name="state" value={form.state} onChange={handleChange} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Pincode</label>
                  <input name="pincode" value={form.pincode} onChange={handleChange} className="form-input" maxLength="6" />
                </div>
              </div>
            </div>
          )}

          {/* Bank Information */}
          {activeTab === 'bank' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Bank Name</label>
                  <input name="bank_name" value={form.bank_name} onChange={handleChange} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Account Number</label>
                  <input name="bank_account" value={form.bank_account} onChange={handleChange} className="form-input" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">IFSC Code</label>
                  <input name="bank_ifsc" value={form.bank_ifsc} onChange={handleChange} className="form-input" maxLength="11" />
                </div>
                <div>
                  <label className="form-label">Salary (Monthly)</label>
                  <input type="number" name="salary" value={form.salary} onChange={handleChange} className="form-input" min="0" step="0.01" />
                </div>
              </div>
            </div>
          )}

          {/* Family Information */}
          {activeTab === 'family' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Father / Husband Name</label>
                  <input name="father_or_husband_name" value={form.father_or_husband_name} onChange={handleChange} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Mother Name</label>
                  <input name="mother_name" value={form.mother_name} onChange={handleChange} className="form-input" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Marital Status</label>
                  <select name="marital_status" value={form.marital_status} onChange={handleChange} className="form-input">
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Spouse Name</label>
                  <input name="spouse_name" value={form.spouse_name} onChange={handleChange} className="form-input" disabled={form.marital_status === 'single'} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Emergency Contact Person</label>
                  <input name="emergency_contact_person" value={form.emergency_contact_person} onChange={handleChange} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Emergency Contact Number</label>
                  <input name="emergency_contact_number" value={form.emergency_contact_number} onChange={handleChange} className="form-input" />
                </div>
              </div>
            </div>
          )}

          {/* Employment Information */}
          {activeTab === 'employment' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Department *</label>
                  <select name="department" value={form.department} onChange={handleChange} className="form-input" required>
                    <option value="">-- Select Department --</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Designation *</label>
                  <select name="designation" value={form.designation} onChange={handleChange} className="form-input" required disabled={!form.department}>
                    <option value="">-- {form.department ? 'Select Designation' : 'First Select Department'} --</option>
                    {availableDesignations.map(desig => (
                      <option key={desig.id} value={desig.id}>{desig.name}</option>
                    ))}
                  </select>
                  {form.department && availableDesignations.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">No designations mapped to this department</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Class Assigned</label>
                  <select name="class_assigned" value={form.class_assigned} onChange={handleChange} className="form-input">
                    <option value="">-- Select Class (Optional) --</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Section Assigned</label>
                  <select name="section_assigned" value={form.section_assigned} onChange={handleChange} className="form-input" disabled={!form.class_assigned}>
                    <option value="">-- {form.class_assigned ? 'Select Section (Optional)' : 'First Select Class'} --</option>
                    {availableSections.map(sec => (
                      <option key={sec.id} value={sec.id}>{sec.section_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Staff Type *</label>
                  <select name="staff_type" value={form.staff_type} onChange={handleChange} className="form-input" required>
                    <option value="teaching">Teaching</option>
                    <option value="non_teaching">Non-Teaching</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Joining Date *</label>
                  <input type="date" name="joining_date" value={form.joining_date} onChange={handleChange} className="form-input" required />
                </div>
                <div>
                  <label className="form-label">Status *</label>
                  <select name="status" value={form.status} onChange={handleChange} className="form-input" required>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="resigned">Resigned</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Qualification</label>
                  <input name="qualification" value={form.qualification} onChange={handleChange} className="form-input" placeholder="e.g., B.Ed, M.Sc" />
                </div>
                <div>
                  <label className="form-label">Experience (Years)</label>
                  <input type="number" name="experience_years" value={form.experience_years} onChange={handleChange} className="form-input" min="0" />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-6 pt-4 border-t">
            <button type="submit" disabled={saveMutation.isLoading} className="btn-primary flex items-center gap-2">
              <Save size={16} />
              {saveMutation.isLoading ? 'Saving...' : (isEdit ? 'Update Staff' : 'Create Staff')}
            </button>
            <button type="button" onClick={() => navigate('/staff')} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
