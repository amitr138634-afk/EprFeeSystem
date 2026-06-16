import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Search, User, Phone, Mail, Calendar, BookOpen, Hash, DollarSign, X } from 'lucide-react'
import { feeApi } from '../../services/api'

export default function PayFee() {
  const [admissionNo, setAdmissionNo] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedClass, setSelectedClass] = useState('')
  const [studentsList, setStudentsList] = useState([])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedFees, setSelectedFees] = useState([])

  // Search student by admission number
  const searchMutation = useMutation({
    mutationFn: (admNo) => feeApi.searchStudent(admNo),
    onSuccess: (res) => {
      setSelectedStudent(res.data)
      toast.success('Student found!')
    },
    onError: () => {
      toast.error('Student not found with this admission number')
      setSelectedStudent(null)
    },
  })

  // Get students by class
  const getStudentsByClass = useMutation({
    mutationFn: (className) => feeApi.getStudentsByClass(className),
    onSuccess: (res) => {
      setStudentsList(res.data)
    },
    onError: () => toast.error('Failed to fetch students'),
  })

  // Get classes
  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => feeApi.getClasses().then(r => r.data.results || r.data),
  })

  const handleSearch = (e) => {
    e.preventDefault()
    if (admissionNo.trim()) {
      searchMutation.mutate(admissionNo.trim())
    }
  }

  const handleClassChange = (className) => {
    setSelectedClass(className)
    setSelectedStudent(null)
    setStudentsList([])
    if (className) {
      getStudentsByClass.mutate(className)
    }
  }

  const selectStudentFromList = (student) => {
    setSelectedStudent(student)
    setAdmissionNo(student.admission_no)
  }

  const handlePayFee = () => {
    if (!selectedStudent) {
      toast.error('Please select a student first')
      return
    }
    setShowPaymentModal(true)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Pay Fee
        </h1>
      </div>

      {/* Search Section */}
      <div className="card p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search by Admission Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Hash className="inline w-4 h-4 mr-1" />
              Search by Admission Number
            </label>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={admissionNo}
                onChange={(e) => setAdmissionNo(e.target.value)}
                placeholder="Enter admission number..."
                className="form-input flex-1"
              />
              <button
                type="submit"
                disabled={searchMutation.isLoading}
                className="btn-primary px-6 flex items-center gap-2"
              >
                <Search size={16} />
                {searchMutation.isLoading ? 'Searching...' : 'Search'}
              </button>
            </form>
          </div>

          {/* Filter by Class */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <BookOpen className="inline w-4 h-4 mr-1" />
              Filter by Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => handleClassChange(e.target.value)}
              className="form-input w-full"
            >
              <option value="">-- Select Class --</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.class_name}>
                  {cls.class_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Students List (when class is selected) */}
      {selectedClass && studentsList.length > 0 && !selectedStudent && (
        <div className="card p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Students in Class {selectedClass} ({studentsList.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studentsList.map((student) => (
              <div
                key={student.id}
                onClick={() => selectStudentFromList(student)}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg cursor-pointer transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {student.student_name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{student.student_name}</h4>
                    <p className="text-sm text-gray-500">Adm: {student.admission_no}</p>
                    <p className="text-sm text-gray-500">Father: {student.father_name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student Profile Section */}
      {selectedStudent && (
        <div className="space-y-6">
          {/* Student Info Card */}
          <div className="card overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-32"></div>
            <div className="p-6 -mt-16">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Profile Photo */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white font-bold text-4xl">
                    {selectedStudent.student_name.charAt(0)}
                  </div>
                </div>

                {/* Student Details */}
                <div className="flex-1 pt-4">
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">
                    {selectedStudent.student_name}
                  </h2>
                  <p className="text-gray-500 mb-4">Admission No: {selectedStudent.admission_no}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-600">Class:</span>
                      <span className="font-semibold">{selectedStudent.class_name} - {selectedStudent.section || 'A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-purple-500" />
                      <span className="text-gray-600">Father:</span>
                      <span className="font-semibold">{selectedStudent.father_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-green-500" />
                      <span className="text-gray-600">Mobile:</span>
                      <span className="font-semibold">{selectedStudent.father_mobile}</span>
                    </div>
                    {selectedStudent.father_email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-red-500" />
                        <span className="text-gray-600">Email:</span>
                        <span className="font-semibold text-xs">{selectedStudent.father_email}</span>
                      </div>
                    )}
                    {selectedStudent.date_of_birth && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-orange-500" />
                        <span className="text-gray-600">DOB:</span>
                        <span className="font-semibold">{new Date(selectedStudent.date_of_birth).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Hash className="w-4 h-4 text-indigo-500" />
                      <span className="text-gray-600">Session:</span>
                      <span className="font-semibold">{selectedStudent.session}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fee Structure */}
          {selectedStudent.fee_structure && selectedStudent.fee_structure.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                Fee Structure
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="table-header text-left px-4 py-3 border">Fee Head</th>
                      <th className="table-header text-right px-4 py-3 border">Apr</th>
                      <th className="table-header text-right px-4 py-3 border">May</th>
                      <th className="table-header text-right px-4 py-3 border">Jun</th>
                      <th className="table-header text-right px-4 py-3 border">Jul</th>
                      <th className="table-header text-right px-4 py-3 border">Aug</th>
                      <th className="table-header text-right px-4 py-3 border">Sep</th>
                      <th className="table-header text-right px-4 py-3 border">Oct</th>
                      <th className="table-header text-right px-4 py-3 border">Nov</th>
                      <th className="table-header text-right px-4 py-3 border">Dec</th>
                      <th className="table-header text-right px-4 py-3 border">Jan</th>
                      <th className="table-header text-right px-4 py-3 border">Feb</th>
                      <th className="table-header text-right px-4 py-3 border">Mar</th>
                      <th className="table-header text-right px-4 py-3 border bg-blue-50">Annual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStudent.fee_structure.map((fee, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 border font-medium text-gray-700">{fee.head_name}</td>
                        {fee.months.map((month, mIdx) => (
                          <td key={mIdx} className="px-4 py-2 border text-right">
                            ₹{month.amount.toLocaleString('en-IN')}
                          </td>
                        ))}
                        <td className="px-4 py-2 border text-right font-semibold bg-blue-50 text-blue-600">
                          ₹{fee.annual_total.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold">
                      <td className="px-4 py-3 border">GRAND TOTAL</td>
                      <td colSpan="12" className="px-4 py-3 border text-right">
                        ₹{selectedStudent.fee_structure.reduce((sum, f) => sum + f.annual_total, 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 border"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handlePayFee}
              className="btn-primary flex-1 py-4 text-lg font-semibold flex items-center justify-center gap-2"
            >
              <DollarSign size={20} />
              Pay Fee
            </button>
            <button
              onClick={() => setSelectedStudent(null)}
              className="btn-secondary px-8 py-4 flex items-center gap-2"
            >
              <X size={20} />
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Payment Modal - Will be implemented next */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Payment Details</h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>
              <p className="text-gray-600 text-center py-8">Payment form coming next...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
