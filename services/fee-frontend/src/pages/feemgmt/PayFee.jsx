import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Hash, BookOpen, Eye, Phone } from 'lucide-react'
import api from '../../services/api'
import useAuthStore from '../../store/authStore'

export default function PayFee() {
  const navigate = useNavigate()
  const activeSession = useAuthStore((s) => s.currentSession?.session_year) || ''
  const [searchType, setSearchType] = useState('admission') // 'admission' or 'class'
  const [admissionNo, setAdmissionNo] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchClasses() }, [])

  const fetchClasses = async () => {
    try {
      const response = await api.get('/masters/classes/', { params: { session: activeSession } })
      setClasses(response.data.results || response.data)
    } catch (err) {
      console.error('Failed to fetch classes:', err)
    }
  }

  const handleSearchByAdmission = async (e) => {
    e.preventDefault()
    if (!admissionNo.trim()) {
      setError('Please enter admission number')
      return
    }
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/fees/students/search/', { params: { admission_no: admissionNo } })
      navigate(`/feemgmt/student-profile/${response.data.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Student not found')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchByClass = async () => {
    if (!selectedClass) {
      setError('Please select a class')
      return
    }
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/fees/students/by-class/', {
        params: { class_name: selectedClass, session: activeSession }
      })
      setStudents(response.data)
    } catch (err) {
      setError('Error fetching students')
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pay Fee</h1>
          <p className="page-sub">Search a student by admission number, or browse by class</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => { setSearchType('admission'); setStudents([]); setError('') }}
          className={searchType === 'admission' ? 'btn-primary' : 'btn-secondary'}
        >
          <Search size={16} /> Admission No
        </button>
        <button
          onClick={() => { setSearchType('class'); setAdmissionNo(''); setError('') }}
          className={searchType === 'class' ? 'btn-primary' : 'btn-secondary'}
        >
          <BookOpen size={16} /> By Class
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
      )}

      {searchType === 'admission' && (
        <div className="card p-6 max-w-md">
          <form onSubmit={handleSearchByAdmission} className="space-y-4">
            <div>
              <label className="form-label flex items-center gap-1.5"><Hash size={12} /> Admission Number</label>
              <input
                type="text"
                value={admissionNo}
                onChange={(e) => setAdmissionNo(e.target.value.toUpperCase())}
                className="form-input"
                placeholder="e.g., STU20260001"
                autoFocus
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              <Search size={16} /> {loading ? 'Searching...' : 'Search Student'}
            </button>
          </form>
        </div>
      )}

      {searchType === 'class' && (
        <div className="space-y-4">
          <div className="card p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Session</label>
                <input type="text" value={activeSession} disabled className="form-input bg-gray-50 text-gray-500" />
              </div>
              <div>
                <label className="form-label">Class</label>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="form-select">
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={handleSearchByClass} disabled={loading || !selectedClass} className="btn-primary w-full">
                  <Search size={16} /> {loading ? 'Loading...' : 'Search'}
                </button>
              </div>
            </div>
          </div>

          {students.length > 0 && (
            <div className="table-container">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="section-title mb-0">Students ({students.length})</h2>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Admission No</th>
                    <th>Student Name</th>
                    <th>Father Name</th>
                    <th>Mobile</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id}>
                      <td><span className="badge-gray">{s.admission_no}</span></td>
                      <td className="font-medium text-gray-900">{s.student_name}</td>
                      <td>{s.father_name}</td>
                      <td className="flex items-center gap-1.5"><Phone size={12} className="text-gray-400" /> {s.father_mobile}</td>
                      <td className="text-center">
                        <button
                          onClick={() => navigate(`/feemgmt/student-profile/${s.id}`)}
                          className="btn-primary btn-sm"
                        >
                          <Eye size={12} /> View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {students.length === 0 && selectedClass && !loading && !error && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4 text-sm">
              No students found in selected class
            </div>
          )}
        </div>
      )}
    </div>
  )
}
