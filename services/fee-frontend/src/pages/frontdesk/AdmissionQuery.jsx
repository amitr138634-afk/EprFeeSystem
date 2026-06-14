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
      console.log('🔍 Fetching fee structure for:', { classId, type, session: currentSession })
      const response = await feeApi.amounts({ class_id: classId, type, session: currentSession })
      const fees = response.data.results || response.data
      console.log('📊 Fee data received:', fees)
      
      if (!fees || fees.length === 0) {
        console.warn('⚠️ No fee data found for this class and type')
        setFeeStructure([])
        toast.error('No fee structure defined for this class')
        return
      }
      
      const structured = fees.map(fee => {
        const months = {
          april: parseFloat(fee.april || 0),
          may: parseFloat(fee.may || 0),
          june: parseFloat(fee.june || 0),
          july: parseFloat(fee.july || 0),
          august: parseFloat(fee.august || 0),
          september: parseFloat(fee.september || 0),
          october: parseFloat(fee.october || 0),
          november: parseFloat(fee.november || 0),
          december: parseFloat(fee.december || 0),
          january: parseFloat(fee.january || 0),
          february: parseFloat(fee.february || 0),
          march: parseFloat(fee.march || 0)
        }
        
        const annual = Object.values(months).reduce((sum, val) => sum + val, 0)
        
        return {
          head_name: fee.head_name,
          frequency: fee.frequency,
          months: months,
          annual_amount: annual
        }
      })
      
      console.log('✅ Structured fee data:', structured)
      setFeeStructure(structured)
      toast.success(`Fee structure loaded: ${structured.length} heads`)
    } catch (error) {
      console.error('❌ Failed to fetch fee structure:', error)
      toast.error('Failed to load fee structure')
      setFeeStructure([])
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
        {formData.class_id && (
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <span className="text-blue-600">📋</span>
              Fee Structure - Class {formData.class_name} (New Student) - Session {currentSession}
            </h3>
            {feeStructure.length > 0 ? (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-blue-300 bg-blue-100">
                        <th className="text-left py-3 px-3 font-bold text-gray-800 sticky left-0 bg-blue-100">Fee Head</th>
                        <th className="text-right py-3 px-2 font-bold text-gray-700">Apr</th>
                        <th className="text-right py-3 px-2 font-bold text-gray-700">May</th>
                        <th className="text-right py-3 px-2 font-bold text-gray-700">Jun</th>
                        <th className="text-right py-3 px-2 font-bold text-gray-700">Jul</th>
                        <th className="text-right py-3 px-2 font-bold text-gray-700">Aug</th>
                        <th className="text-right py-3 px-2 font-bold text-gray-700">Sep</th>
                        <th className="text-right py-3 px-2 font-bold text-gray-700">Oct</th>
                        <th className="text-right py-3 px-2 font-bold text-gray-700">Nov</th>
                        <th className="text-right py-3 px-2 font-bold text-gray-700">Dec</th>
                        <th className="text-right py-3 px-2 font-bold text-gray-700">Jan</th>
                        <th className="text-right py-3 px-2 font-bold text-gray-700">Feb</th>
                        <th className="text-right py-3 px-2 font-bold text-gray-700">Mar</th>
                        <th className="text-right py-3 px-3 font-bold text-gray-800 bg-green-100 border-l-2 border-green-300">Annual Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feeStructure.map((fee, index) => (
                        <tr key={index} className="border-b border-blue-100 hover:bg-blue-50 transition-colors">
                          <td className="py-2 px-3 text-gray-800 font-medium sticky left-0 bg-blue-50">{fee.head_name}</td>
                          <td className="py-2 px-2 text-right text-gray-700">{fee.months.april > 0 ? `₹${fee.months.april}` : '-'}</td>
                          <td className="py-2 px-2 text-right text-gray-700">{fee.months.may > 0 ? `₹${fee.months.may}` : '-'}</td>
                          <td className="py-2 px-2 text-right text-gray-700">{fee.months.june > 0 ? `₹${fee.months.june}` : '-'}</td>
                          <td className="py-2 px-2 text-right text-gray-700">{fee.months.july > 0 ? `₹${fee.months.july}` : '-'}</td>
                          <td className="py-2 px-2 text-right text-gray-700">{fee.months.august > 0 ? `₹${fee.months.august}` : '-'}</td>
                          <td className="py-2 px-2 text-right text-gray-700">{fee.months.september > 0 ? `₹${fee.months.september}` : '-'}</td>
                          <td className="py-2 px-2 text-right text-gray-700">{fee.months.october > 0 ? `₹${fee.months.october}` : '-'}</td>
                          <td className="py-2 px-2 text-right text-gray-700">{fee.months.november > 0 ? `₹${fee.months.november}` : '-'}</td>
                          <td className="py-2 px-2 text-right text-gray-700">{fee.months.december > 0 ? `₹${fee.months.december}` : '-'}</td>
                          <td className="py-2 px-2 text-right text-gray-700">{fee.months.january > 0 ? `₹${fee.months.january}` : '-'}</td>
                          <td className="py-2 px-2 text-right text-gray-700">{fee.months.february > 0 ? `₹${fee.months.february}` : '-'}</td>
                          <td className="py-2 px-2 text-right text-gray-700">{fee.months.march > 0 ? `₹${fee.months.march}` : '-'}</td>
                          <td className="py-2 px-3 text-right text-gray-900 font-bold bg-green-50 border-l-2 border-green-300">₹{fee.annual_amount.toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold">
                        <td className="py-4 px-3 text-base sticky left-0 bg-blue-600">TOTAL</td>
                        <td className="py-4 px-2 text-right">₹{feeStructure.reduce((s, f) => s + f.months.april, 0).toFixed(0)}</td>
                        <td className="py-4 px-2 text-right">₹{feeStructure.reduce((s, f) => s + f.months.may, 0).toFixed(0)}</td>
                        <td className="py-4 px-2 text-right">₹{feeStructure.reduce((s, f) => s + f.months.june, 0).toFixed(0)}</td>
                        <td className="py-4 px-2 text-right">₹{feeStructure.reduce((s, f) => s + f.months.july, 0).toFixed(0)}</td>
                        <td className="py-4 px-2 text-right">₹{feeStructure.reduce((s, f) => s + f.months.august, 0).toFixed(0)}</td>
                        <td className="py-4 px-2 text-right">₹{feeStructure.reduce((s, f) => s + f.months.september, 0).toFixed(0)}</td>
                        <td className="py-4 px-2 text-right">₹{feeStructure.reduce((s, f) => s + f.months.october, 0).toFixed(0)}</td>
                        <td className="py-4 px-2 text-right">₹{feeStructure.reduce((s, f) => s + f.months.november, 0).toFixed(0)}</td>
                        <td className="py-4 px-2 text-right">₹{feeStructure.reduce((s, f) => s + f.months.december, 0).toFixed(0)}</td>
                        <td className="py-4 px-2 text-right">₹{feeStructure.reduce((s, f) => s + f.months.january, 0).toFixed(0)}</td>
                        <td className="py-4 px-2 text-right">₹{feeStructure.reduce((s, f) => s + f.months.february, 0).toFixed(0)}</td>
                        <td className="py-4 px-2 text-right">₹{feeStructure.reduce((s, f) => s + f.months.march, 0).toFixed(0)}</td>
                        <td className="py-4 px-3 text-right text-lg bg-green-600 border-l-2 border-green-400">₹{totalAnnualFee.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-800">Note:</span> This is the complete fee structure for the entire academic year. 
                    The amounts shown are for each month, and the rightmost column shows the total annual fee for each head.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center">
                <div className="text-4xl mb-2">⚠️</div>
                <p className="text-gray-700 font-medium">No fee structure defined for this class</p>
                <p className="text-sm text-gray-600 mt-1">Please contact admin to set up fee amounts</p>
              </div>
            )}
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
    adm_status: 'enquiry',  // Filter by adm_status instead of status
    session: '2024-25',
    search: ''
  })
  
  const [showPayModal, setShowPayModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [selectedQuery, setSelectedQuery] = useState(null)

  const { data: queries = [], isLoading, refetch } = useQuery({
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
  
  const handlePayClick = (query) => {
    setSelectedQuery(query)
    setShowPayModal(true)
  }
  
  const handleViewReceipt = (query) => {
    setSelectedQuery(query)
    setShowReceiptModal(true)
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
            <label className="form-label">Admission Status</label>
            <select
              value={filters.adm_status}
              onChange={(e) => setFilters({ ...filters, adm_status: e.target.value })}
              className="form-input"
            >
              <option value="">All Status</option>
              <option value="enquiry">Enquiry</option>
              <option value="registered">Registered</option>
              <option value="admitted">Admitted</option>
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
              onClick={() => setFilters({ adm_status: 'enquiry', session: '2024-25', search: '' })}
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
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{query.class_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{query.session}</td>
                    <td className="px-4 py-3">{getStatusBadge(query.adm_status)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(query.query_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {!query.registration_paid && query.adm_status === 'enquiry' && (
                          <button
                            onClick={() => handlePayClick(query)}
                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                            title="Pay Registration Fee"
                          >
                            <span>₹</span> Pay Registration
                          </button>
                        )}
                        {query.registration_paid && (
                          <>
                            <span className="text-xs text-green-600 font-medium">✓ Paid</span>
                            <button
                              onClick={() => handleViewReceipt(query)}
                              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                              title="View Receipt"
                            >
                              <Eye size={14} />
                              Receipt
                            </button>
                          </>
                        )}
                        <button
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye size={14} />
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

      {/* Pay Registration Fee Modal */}
      {showPayModal && selectedQuery && (
        <PayRegistrationModal
          query={selectedQuery}
          onClose={() => {
            setShowPayModal(false)
            setSelectedQuery(null)
          }}
          onSuccess={() => {
            refetch()
            setShowPayModal(false)
            setSelectedQuery(null)
          }}
        />
      )}
      
      {/* Receipt Modal */}
      {showReceiptModal && selectedQuery && (
        <ReceiptModal
          queryId={selectedQuery.id}
          onClose={() => {
            setShowReceiptModal(false)
            setSelectedQuery(null)
          }}
        />
      )}
    </div>
  )
}

// Approval Tab Component
function ApprovalTab() {
  const [showUnapproveModal, setShowUnapproveModal] = useState(false)
  const [selectedQuery, setSelectedQuery] = useState(null)
  const [unapproveRemarks, setUnapproveRemarks] = useState('')
  const queryClient = useQueryClient()
  
  const { data: approvalQueries = [], isLoading, refetch } = useQuery({
    queryKey: ['admission-queries', { adm_status: 'registered' }],
    queryFn: () => feeApi.queries({ adm_status: 'registered' }).then(r => r.data.results || r.data)
  })
  
  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (queryId) => feeApi.approveAdmission(queryId),
    onSuccess: () => {
      queryClient.invalidateQueries(['admission-queries'])
      toast.success('Admission approved successfully! Student created.')
      refetch()
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to approve admission')
    }
  })
  
  // Unapprove mutation
  const unapproveMutation = useMutation({
    mutationFn: ({ queryId, remarks }) => feeApi.unapproveAdmission(queryId, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries(['admission-queries'])
      toast.success('Admission unapproved')
      setShowUnapproveModal(false)
      setSelectedQuery(null)
      setUnapproveRemarks('')
      refetch()
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to unapprove admission')
    }
  })
  
  const handleApprove = (query) => {
    if (confirm(`Approve admission for ${query.student_name}?\n\nThis will create a student record and assign fee structure.`)) {
      approveMutation.mutate(query.id)
    }
  }
  
  const handleUnapprove = (query) => {
    setSelectedQuery(query)
    setShowUnapproveModal(true)
  }
  
  const submitUnapprove = () => {
    if (!unapproveRemarks.trim()) {
      toast.error('Please provide remarks for unapproving')
      return
    }
    unapproveMutation.mutate({ queryId: selectedQuery.id, remarks: unapproveRemarks })
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700">
            Pending Approvals ({approvalQueries.length})
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Students who have paid registration fee and are ready for admission approval
          </p>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : approvalQueries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No queries pending approval. Queries with paid registration will appear here.
          </div>
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
                  <th className="table-header text-left px-4 py-3">Reg. Paid</th>
                  <th className="table-header text-center px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {approvalQueries.map((query, index) => (
                  <tr key={query.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{query.student_name}</div>
                      <div className="text-xs text-gray-500">{query.gender} • DOB: {new Date(query.date_of_birth).toLocaleDateString('en-IN')}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{query.father_name}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700">{query.father_mobile}</div>
                      {query.father_email && (
                        <div className="text-xs text-gray-500">{query.father_email}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{query.class_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{query.session}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        ✓ Paid
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleApprove(query)}
                          disabled={approveMutation.isPending}
                          className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                          title="Approve Admission"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUnapprove(query)}
                          disabled={unapproveMutation.isPending}
                          className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                          title="Reject/Unapprove"
                        >
                          Unapprove
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
      
      {/* Unapprove Modal */}
      {showUnapproveModal && selectedQuery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 flex justify-between items-center rounded-t-xl">
              <div>
                <h2 className="text-xl font-bold">Unapprove Admission</h2>
                <p className="text-sm text-red-100">Provide reason for rejection</p>
              </div>
              <button
                onClick={() => {
                  setShowUnapproveModal(false)
                  setSelectedQuery(null)
                  setUnapproveRemarks('')
                }}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Student Name</p>
                <p className="font-semibold text-gray-900">{selectedQuery.student_name}</p>
                <p className="text-sm text-gray-600 mt-2">Class: {selectedQuery.class_name}</p>
              </div>
              
              <div>
                <label className="form-label">Remarks (Required) *</label>
                <textarea
                  value={unapproveRemarks}
                  onChange={(e) => setUnapproveRemarks(e.target.value)}
                  className="form-input"
                  rows="4"
                  placeholder="Enter reason for unapproving this admission..."
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={submitUnapprove}
                  disabled={unapproveMutation.isPending || !unapproveRemarks.trim()}
                  className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {unapproveMutation.isPending ? 'Processing...' : 'Unapprove'}
                </button>
                <button
                  onClick={() => {
                    setShowUnapproveModal(false)
                    setSelectedQuery(null)
                    setUnapproveRemarks('')
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Pay Registration Fee Modal Component
function PayRegistrationModal({ query, onClose, onSuccess }) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    admission_query_id: query.id,
    amount: 100.00,
    payment_mode: 'cash',
    payment_date: new Date().toISOString().split('T')[0],
    transaction_id: '',
    bank_name: '',
    remarks: ''
  })

  const payMutation = useMutation({
    mutationFn: (data) => feeApi.payRegistrationFee(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admission-queries'])
      toast.success('Registration fee paid successfully!')
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to process payment')
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    payMutation.mutate(formData)
  }

  const showTransactionFields = ['upi', 'paytm', 'online'].includes(formData.payment_mode)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 flex justify-between items-center rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold">Pay Registration Fee</h2>
            <p className="text-sm text-green-100">Complete the payment to register the enquiry</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Student Details Card */}
        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-b">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <User size={20} className="text-blue-600" />
            Student Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Student Name</p>
              <p className="text-sm font-medium text-gray-900">{query.student_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Father's Name</p>
              <p className="text-sm font-medium text-gray-900">{query.father_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Class</p>
              <p className="text-sm font-medium text-gray-900">{query.class_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Mobile Number</p>
              <p className="text-sm font-medium text-gray-900">{query.father_mobile}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Session</p>
              <p className="text-sm font-medium text-gray-900">{query.session}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Query Date</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(query.query_date).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Amount Display */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 mb-1">Registration Fee Amount</p>
                <p className="text-3xl font-bold text-green-700">₹ {formData.amount.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-full p-4 shadow-lg">
                <span className="text-4xl">💰</span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Payment Mode *</label>
              <select
                value={formData.payment_mode}
                onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                className="form-input"
                required
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="paytm">Paytm</option>
                <option value="online">Online Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="card">Card</option>
              </select>
            </div>

            <div>
              <label className="form-label">Payment Date *</label>
              <input
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                className="form-input"
                required
              />
            </div>

            {showTransactionFields && (
              <>
                <div>
                  <label className="form-label">Transaction ID *</label>
                  <input
                    type="text"
                    value={formData.transaction_id}
                    onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                    className="form-input"
                    placeholder="Enter transaction ID"
                    required={showTransactionFields}
                  />
                </div>

                <div>
                  <label className="form-label">Bank Name</label>
                  <input
                    type="text"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    className="form-input"
                    placeholder="Enter bank name"
                  />
                </div>
              </>
            )}

            <div className="md:col-span-2">
              <label className="form-label">Remarks</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="form-input"
                rows="2"
                placeholder="Any additional notes..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={payMutation.isPending}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {payMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Pay ₹{formData.amount.toFixed(2)}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


// Receipt Modal Component
function ReceiptModal({ queryId, onClose }) {
  const { data: receipt, isLoading } = useQuery({
    queryKey: ['registration-receipt', queryId],
    queryFn: () => feeApi.getRegistrationReceipt(queryId).then(r => r.data)
  })

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading receipt...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!receipt) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8">
          <p className="text-red-600">Receipt not found</p>
          <button onClick={onClose} className="mt-4 btn-secondary">Close</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header - Non-printable */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center print:hidden">
          <h2 className="text-xl font-bold">Registration Fee Receipt</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Receipt Content - Printable */}
        <div className="p-8 print:p-4">
          {/* School Header */}
          <div className="text-center border-b-4 border-blue-600 pb-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">SCHOOL NAME</h1>
            <p className="text-gray-600">School Address Line 1, City, State - PIN</p>
            <p className="text-gray-600">Phone: +91-XXXXXXXXXX | Email: school@example.com</p>
            <div className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-full font-semibold text-lg">
              REGISTRATION FEE RECEIPT
            </div>
          </div>

          {/* Receipt Details */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-500">Receipt No.</p>
              <p className="text-lg font-bold text-gray-900">{receipt.receipt_no}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Date</p>
              <p className="text-lg font-bold text-gray-900">
                {new Date(receipt.payment_date).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Student Details */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Student Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Student Name</p>
                <p className="font-semibold text-gray-900">{receipt.student_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Father's Name</p>
                <p className="font-semibold text-gray-900">{receipt.father_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Class</p>
                <p className="font-semibold text-gray-900">{receipt.class_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Session</p>
                <p className="font-semibold text-gray-900">{receipt.session}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Mobile Number</p>
                <p className="font-semibold text-gray-900">{receipt.mobile}</p>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="border-2 border-gray-200 rounded-lg overflow-hidden mb-6">
            <table className="w-full">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold">Description</th>
                  <th className="text-right py-3 px-4 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 px-4 text-gray-700">Registration Fee</td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900">
                    ₹ {parseFloat(receipt.amount).toFixed(2)}
                  </td>
                </tr>
                <tr className="bg-green-50">
                  <td className="py-4 px-4 text-lg font-bold text-gray-900">Total Amount Paid</td>
                  <td className="py-4 px-4 text-right text-2xl font-bold text-green-700">
                    ₹ {parseFloat(receipt.amount).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Amount in Words */}
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
            <p className="text-sm text-gray-600">Amount in Words:</p>
            <p className="font-semibold text-gray-900 capitalize">
              Rupees {parseFloat(receipt.amount).toFixed(0)} Only
            </p>
          </div>

          {/* Payment Method Details */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">Payment Method</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Mode</p>
                  <p className="font-semibold text-gray-900 uppercase">{receipt.payment_mode}</p>
                </div>
                {receipt.transaction_id && (
                  <div>
                    <p className="text-sm text-gray-600">Transaction ID</p>
                    <p className="font-semibold text-gray-900">{receipt.transaction_id}</p>
                  </div>
                )}
                {receipt.bank_name && (
                  <div>
                    <p className="text-sm text-gray-600">Bank Name</p>
                    <p className="font-semibold text-gray-900">{receipt.bank_name}</p>
                  </div>
                )}
              </div>
            </div>
            
            {receipt.remarks && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Remarks</h4>
                <p className="text-gray-700">{receipt.remarks}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t-2 border-gray-300 pt-6 mt-8">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm text-gray-600">Received By</p>
                <div className="mt-8 border-t border-gray-400 w-48 text-center pt-1">
                  <p className="text-sm text-gray-700">Authorized Signature</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">This is a computer-generated receipt</p>
                <p className="text-xs text-gray-500">No signature required</p>
                <div className="mt-4">
                  <svg className="w-24 h-24 mx-auto opacity-10" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <p className="text-xs font-semibold text-gray-400">PAID</p>
                </div>
              </div>
            </div>
          </div>

          {/* Print Instructions */}
          <div className="mt-6 text-center text-xs text-gray-500 print:hidden">
            <p>Please keep this receipt for your records</p>
          </div>
        </div>
      </div>
    </div>
  )
}
