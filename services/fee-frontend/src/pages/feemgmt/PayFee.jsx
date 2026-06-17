import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

const PayFee = () => {
  const navigate = useNavigate();
  const activeSession = useAuthStore(s => s.currentSession?.session_year) || '';
  const [searchType, setSearchType] = useState('admission'); // 'admission' or 'class'
  const [admissionNo, setAdmissionNo] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSession, setSelectedSession] = useState(activeSession);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/api/masters/classes/', {
        params: { session: selectedSession }
      });
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleSearchByAdmission = async (e) => {
    e.preventDefault();
    if (!admissionNo.trim()) {
      setError('Please enter admission number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.get('/api/fees/students/search/', {
        params: { admission_no: admissionNo }
      });
      
      // Redirect to student profile
      navigate(`/feemgmt/student-profile/${response.data.id}`);
    } catch (error) {
      setError(error.response?.data?.detail || 'Student not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByClass = async () => {
    if (!selectedClass) {
      setError('Please select a class');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.get('/api/fees/students/by-class/', {
        params: { 
          class_id: selectedClass,
          session: selectedSession
        }
      });
      setStudents(response.data);
      setError('');
    } catch (error) {
      setError('Error fetching students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-4">
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="mb-0">
            <i className="bi bi-cash-coin me-2"></i>
            Pay Fee
          </h2>
          <p className="text-muted">Search student by admission number or select class to view all students</p>
        </div>
      </div>

      {/* Search Type Toggle */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="btn-group w-100" role="group">
            <button
              type="button"
              className={`btn ${searchType === 'admission' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => {
                setSearchType('admission');
                setStudents([]);
                setError('');
              }}
            >
              <i className="bi bi-search me-2"></i>
              Search by Admission No
            </button>
            <button
              type="button"
              className={`btn ${searchType === 'class' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => {
                setSearchType('class');
                setAdmissionNo('');
                setError('');
              }}
            >
              <i className="bi bi-people me-2"></i>
              Select by Class
            </button>
          </div>
        </div>
      </div>

      {/* Search by Admission Number */}
      {searchType === 'admission' && (
        <div className="row">
          <div className="col-lg-6 mx-auto">
            <div className="card shadow-sm">
              <div className="card-body p-4">
                <h5 className="card-title mb-4">
                  <i className="bi bi-person-badge me-2"></i>
                  Search Student
                </h5>
                
                {error && (
                  <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSearchByAdmission}>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Admission Number *</label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      placeholder="Enter admission number (e.g., STU202400001)"
                      value={admissionNo}
                      onChange={(e) => setAdmissionNo(e.target.value.toUpperCase())}
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Searching...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-search me-2"></i>
                        Search Student
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search by Class */}
      {searchType === 'class' && (
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h5 className="card-title mb-4">
                  <i className="bi bi-funnel me-2"></i>
                  Filter Students
                </h5>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                  </div>
                )}

                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Session *</label>
                    <select
                      className="form-select"
                      value={selectedSession}
                      onChange={(e) => setSelectedSession(e.target.value)}
                    >
                      {activeSession && <option value={activeSession}>{activeSession}</option>}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold">Class *</label>
                    <select
                      className="form-select"
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                    >
                      <option value="">Select Class</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.class_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-2 d-flex align-items-end">
                    <button
                      type="button"
                      className="btn btn-primary w-100"
                      onClick={handleSearchByClass}
                      disabled={loading || !selectedClass}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Loading...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-search me-2"></i>
                          Search
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Students List */}
            {students.length > 0 && (
              <div className="card shadow-sm">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-people-fill me-2"></i>
                    Students List ({students.length})
                  </h5>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Admission No</th>
                          <th>Student Name</th>
                          <th>Father Name</th>
                          <th>Class</th>
                          <th>Session</th>
                          <th>Mobile</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => (
                          <tr key={student.id}>
                            <td>
                              <span className="badge bg-secondary">{student.admission_no}</span>
                            </td>
                            <td className="fw-bold">{student.student_name}</td>
                            <td>{student.father_name}</td>
                            <td>{student.class_name}</td>
                            <td>{student.session}</td>
                            <td>{student.father_mobile}</td>
                            <td>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => navigate(`/feemgmt/student-profile/${student.id}`)}
                              >
                                <i className="bi bi-eye me-1"></i>
                                View Profile
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {students.length === 0 && selectedClass && !loading && !error && (
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                No students found in selected class
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PayFee;
