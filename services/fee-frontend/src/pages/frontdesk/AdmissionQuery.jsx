import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { feeApi } from '../../services/api'
import toast from 'react-hot-toast'
import { Plus, Search, Phone, Mail, Calendar, User, X, Save, Eye, Edit2, Trash2 } from 'lucide-react'

export default function AdmissionQuery() {
  const [activeTab, setActiveTab] = useState('query') // query, enquiry-list, approval
  const queryClient = useQueryClient()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Admission Process</h1>
        <p className="text-sm text-gray-500 mt-1">Manage admission queries and enquiries</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('query')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'query'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Query
          </button>
          <button
            onClick={() => setActiveTab('enquiry-list')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'enquiry-list'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Enquiry List
          </button>
          <button
            onClick={() => setActiveTab('approval')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'approval'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Admission Approval
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'query' && <QueryTab />}
      {activeTab === 'enquiry-list' && <EnquiryListTab />}
      {activeTab === 'approval' && <ApprovalTab />}
    </div>
  )
}

// Query Tab Component
function QueryTab() {
  const queryClient = useQueryClient()
  const currentSession = '2024-25'
  
  const [formData, setFormData] = useState({
    student_name: '',
    father_name: '',
    mother_name: '',
    date_of_birth: '',
    gender: 'male',
    father_email: '',
    mother_email: '',
    father_mobile: '',
    mother_mobile: '',
    session: currentSession,
    class_id: '',
    class_name: '',
    type: 'new',
    source_of_information: 'walk_in',
    remarks: ''
  })

  const [selectedClass, setSelectedClass] = useState(null)
  const [feeStructure, setFeeStructure] = useState([])

  // Fetch classes from masters API
  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      try {
        const response = await feeApi.classes()
        return response.data.results || response.data || []
      } catch (error) {
        console.error('Failed to fetch classes:', error)
        return []
      }
    }
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => feeApi.createQuery(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['admission-queries'])
      toast.success('Admission query submitted successfully! Email sent to parent.')
      setFeeStructure(response.data.fee_structure || [])
      resetForm()
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to submit query')
    }
  })

  // Fetch fee structure when class is selected
  const fetchFeeStructure = async (classId, type) => {
    try {
      const response = await feeApi.amounts({ class_id: classId, type, session: currentSession })
      const fees = response.data.results || response.data
      
      const structured = fees.map(fee => {
        const annual = 
          parseFloat(fee.april) + parseFloat(fee.may) + parseFloat(fee.june) +
          parseFloat(fee.july) + parseFloat(fee.august) + parseFloat(fee.september) +
          parseFloat(fee.october) + parseFloat(fee.november) + parseFloat(fee.december) +
          parseFloat(fee.january) + parseFloat(fee.february) + parseFloat(fee.march)
        
        return {
          head_name: fee.head_name,
          frequency: fee.frequency,
          annual_amount: annual
        }
      })
      
      setFeeStructure(structured)
    } catch (error) {
      console.error('Failed to fetch fee structure:', error)
    }
  }

  const handleClassChange = (e) => {
    const classId = parseInt(e.target.value)
    const classObj = classes.find(c => c.id === classId)
    
    if (classObj) {
      setFormData({
        ...formData,
        class_id: classId,
        class_name: classObj.class_name || classObj.name // Handle both class_name and name
      })
      setSelectedClass(classObj)
      fetchFeeStructure(classId, formData.type)
    }
  }

  const handleTypeChange = (e) => {
    const type = e.target.value
    setFormData({ ...formData, type })
    
    if (formData.class_id) {
      fetchFeeStructure(formData.class_id, type)
    }
  }

  const resetForm = () => {
    setFormData({
      student_name: '',
      father_name: '',
      mother_name: '',
      date_of_birth: '',
      gender: 'male',
      father_email: '',
      mother_email: '',
      father_mobile: '',
      mother_mobile: '',
      session: currentSession,
      class_id: '',
      class_name: '',
      type: 'new',
      source_of_information: 'walk_in',
      remarks: ''
    })
    setSelectedClass(null)
    setFeeStructure([])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const totalAnnualFee = feeStructure.reduce((sum, fee) => sum + fee.annual_amount, 0)

  return (
    <div className="card p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Student Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Student Name *</label>
              <input
                type="text"
                value={formData.student_name}
                onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                className="form-input"
                placeholder="Enter student name"
                required
              />
            </div>

            <div>
              <label className="form-label">Father's Name *</label>
              <input
                type="text"
                value={formData.father_name}
                onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                className="form-input"
                placeholder="Enter father's name"
                required
              />
            </div>

            <div>
              <label className="form-label">Mother's Name *</label>
              <input
                type="text"
                value={formData.mother_name}
                onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
                className="form-input"
                placeholder="Enter mother's name"
                required
              />
            </div>

            <div>
              <label className="form-label">Date of Birth *</label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label">Gender *</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="form-input"
                required
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="form-label">Session *</label>
              <input
                type="text"
                value={formData.session}
                onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                className="form-input"
                placeholder="e.g., 2024-25"
                required
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="form-label">Father's Email</label>
              <input
                type="email"
                value={formData.father_email}
                onChange={(e) => setFormData({ ...formData, father_email: e.target.value })}
                className="form-input"
                placeholder="father@example.com"
              />
            </div>

            <div>
              <label className="form-label">Mother's Email</label>
              <input
                type="email"
                value={formData.mother_email}
                onChange={(e) => setFormData({ ...formData, mother_email: e.target.value })}
                className="form-input"
                placeholder="mother@example.com"
              />
            </div>

            <div>
              <label className="form-label">Father's Mobile *</label>
              <input
                type="tel"
                value={formData.father_mobile}
                onChange={(e) => setFormData({ ...formData, father_mobile: e.target.value })}
                className="form-input"
                placeholder="10-digit mobile"
                pattern="[0-9]{10}"
                required
              />
            </div>

            <div>
              <label className="form-label">Mother's Mobile</label>
              <input
                type="tel"
                value={formData.mother_mobile}
                onChange={(e) => setFormData({ ...formData, mother_mobile: e.target.value })}
                className="form-input"
                placeholder="10-digit mobile"
                pattern="[0-9]{10}"
              />
            </div>
          </div>
        </div>

        {/* Admission Details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Admission Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="form-label">Select Class *</label>
              <select
                value={formData.class_id}
                onChange={handleClassChange}
                className="form-input"
                required
              >
                <option value="">-- Select Class --</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.class_name || cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Student Type *</label>
              <input
                type="text"
                value="New"
                className="form-input bg-gray-100"
                readOnly
                disabled
              />
            </div>

            <div>
              <label className="form-label">Source of Information *</label>
              <select
                value={formData.source_of_information}
                onChange={(e) => setFormData({ ...formData, source_of_information: e.target.value })}
                className="form-input"
                required
              >
                <option value="walk_in">Walk In</option>
                <option value="phone">Phone</option>
                <option value="website">Website</option>
                <option value="reference">Reference</option>
                <option value="advertisement">Advertisement</option>
                <option value="social_media">Social Media</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="form-label">Remarks</label>
              <input
                type="text"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="form-input"
                placeholder="Additional notes"
              />
            </div>
          </div>
        </div>

        {/* Fee Structure Display */}
        {feeStructure.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Annual Fee Structure - {formData.class_name} ({formData.type === 'new' ? 'New Student' : 'Old Student'})
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-blue-200">
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Fee Head</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Frequency</th>
                      <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700">Annual Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeStructure.map((fee, index) => (
                      <tr key={index} className="border-b border-blue-100">
                        <td className="py-2 px-3 text-sm text-gray-700">{fee.head_name}</td>
                        <td className="py-2 px-3 text-sm text-gray-600 capitalize">{fee.frequency.replace('_', ' ')}</td>
                        <td className="py-2 px-3 text-sm text-gray-700 text-right font-medium">₹{fee.annual_amount.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="bg-blue-100">
                      <td colSpan="2" className="py-3 px-3 text-sm font-bold text-gray-800">Total Annual Fee</td>
                      <td className="py-3 px-3 text-sm font-bold text-gray-800 text-right">₹{totalAnnualFee.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={18} />
            {createMutation.isPending ? 'Submitting...' : 'Submit Query'}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="btn-secondary flex items-center gap-2"
          >
            <X size={18} />
            Reset Form
          </button>
        </div>
      </form>
    </div>
  )
}

// Enquiry List Tab Component
function EnquiryListTab() {
  const [filters, setFilters] = useState({
    status: 'enquiry',  // Default to enquiry status
    session: '2024-25',
    search: ''
  })

  const { data: queries = [], isLoading } = useQuery({
    queryKey: ['admission-queries', filters],
    queryFn: () => feeApi.queries(filters).then(r => r.data.results || r.data)
  })

  const getStatusBadge = (status) => {
    const styles = {
      enquiry: 'bg-yellow-100 text-yellow-800',
      contacted: 'bg-blue-100 text-blue-800',
      visited: 'bg-purple-100 text-purple-800',
      admitted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="form-label">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="form-input"
              placeholder="Name, mobile..."
            />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="form-input"
            >
              <option value="">All Status</option>
              <option value="enquiry">Enquiry</option>
              <option value="contacted">Contacted</option>
              <option value="visited">Visited</option>
              <option value="admitted">Admitted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="form-label">Session</label>
            <input
              type="text"
              value={filters.session}
              onChange={(e) => setFilters({ ...filters, session: e.target.value })}
              className="form-input"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: 'enquiry', session: '2024-25', search: '' })}
              className="btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700">All Enquiries ({queries.length})</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : queries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No enquiries found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="table-header text-left px-4 py-3">S.No</th>
                  <th className="table-header text-left px-4 py-3">Student Name</th>
                  <th className="table-header text-left px-4 py-3">Father Name</th>
                  <th className="table-header text-left px-4 py-3">Contact</th>
                  <th className="table-header text-left px-4 py-3">Class</th>
                  <th className="table-header text-left px-4 py-3">Session</th>
                  <th className="table-header text-left px-4 py-3">Source</th>
                  <th className="table-header text-left px-4 py-3">Status</th>
                  <th className="table-header text-left px-4 py-3">Query Date</th>
                  <th className="table-header text-center px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {queries.map((query, index) => (
                  <tr key={query.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{query.student_name}</div>
                      <div className="text-xs text-gray-500">{query.gender}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{query.father_name}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700 flex items-center gap-1">
                        <Phone size={12} />
                        {query.father_mobile}
                      </div>
                      {query.father_email && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Mail size={10} />
                          {query.father_email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{query.class_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{query.session}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 capitalize">{query.source_of_information.replace('_', ' ')}</td>
                    <td className="px-4 py-3">{getStatusBadge(query.status)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(query.query_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// Approval Tab Component
function ApprovalTab() {
  const { data: approvalQueries = [], isLoading } = useQuery({
    queryKey: ['admission-queries', { status: 'visited' }],
    queryFn: () => feeApi.queries({ status: 'visited' }).then(r => r.data.results || r.data)
  })

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Pending Approvals</h2>
      {isLoading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : approvalQueries.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          No queries pending approval. Queries with "Visited" status will appear here.
        </div>
      ) : (
        <div className="space-y-4">
          {approvalQueries.map(query => (
            <div key={query.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800">{query.student_name}</h3>
                  <p className="text-sm text-gray-600">Father: {query.father_name} | Class: {query.class_name}</p>
                  <p className="text-sm text-gray-600">Mobile: {query.father_mobile}</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn-sm bg-green-600 text-white hover:bg-green-700">
                    Approve
                  </button>
                  <button className="btn-sm bg-red-600 text-white hover:bg-red-700">
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
