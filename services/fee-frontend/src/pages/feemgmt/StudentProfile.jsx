import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const StudentProfile = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudentProfile();
  }, [studentId]);

  const fetchStudentProfile = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get(`/api/fees/students/${studentId}/profile/`);
      setStudent(response.data);
    } catch (error) {
      setError(error.response?.data?.detail || 'Error loading student profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid p-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading student profile...</p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="container-fluid p-4">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error || 'Student not found'}
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/feemgmt/pay-fee')}>
          <i className="bi bi-arrow-left me-2"></i>
          Back to Search
        </button>
      </div>
    );
  }

  const calculateGrandTotal = () => {
    if (!student.fee_structure || student.fee_structure.length === 0) return 0;
    return student.fee_structure.reduce((total, head) => total + head.annual_total, 0);
  };

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <button className="btn btn-outline-secondary mb-3" onClick={() => navigate('/feemgmt/pay-fee')}>
            <i className="bi bi-arrow-left me-2"></i>
            Back to Search
          </button>
          <h2 className="mb-0">
            <i className="bi bi-person-circle me-2"></i>
            Student Profile & Fee Structure
          </h2>
        </div>
      </div>

      {/* Student Basic Info Card */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="bi bi-person-badge-fill me-2"></i>
                Personal Information
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                {/* Left Column */}
                <div className="col-md-6">
                  <table className="table table-borderless mb-0">
                    <tbody>
                      <tr>
                        <td className="fw-bold" width="40%">Admission No:</td>
                        <td>
                          <span className="badge bg-dark fs-6">{student.admission_no}</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Student Name:</td>
                        <td className="text-primary fs-5 fw-bold">{student.student_name}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Father's Name:</td>
                        <td>{student.father_name}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Mother's Name:</td>
                        <td>{student.mother_name}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Date of Birth:</td>
                        <td>{new Date(student.date_of_birth).toLocaleDateString('en-GB')}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Gender:</td>
                        <td>{student.gender === 'M' ? 'Male' : student.gender === 'F' ? 'Female' : 'Other'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Right Column */}
                <div className="col-md-6">
                  <table className="table table-borderless mb-0">
                    <tbody>
                      <tr>
                        <td className="fw-bold" width="40%">Class:</td>
                        <td>
                          <span className="badge bg-success fs-6">{student.class_name}</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Session:</td>
                        <td>{student.session}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Admission Date:</td>
                        <td>{new Date(student.admission_date).toLocaleDateString('en-GB')}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Status:</td>
                        <td>
                          <span className={`badge ${student.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                            {student.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Father's Mobile:</td>
                        <td>
                          <i className="bi bi-phone me-2"></i>
                          {student.father_mobile}
                        </td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Mother's Mobile:</td>
                        <td>
                          <i className="bi bi-phone me-2"></i>
                          {student.mother_mobile || 'N/A'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Email Row */}
              {(student.father_email || student.mother_email) && (
                <div className="row mt-3 pt-3 border-top">
                  <div className="col-md-6">
                    <strong>Father's Email:</strong>
                    <br />
                    <i className="bi bi-envelope me-2"></i>
                    {student.father_email || 'N/A'}
                  </div>
                  <div className="col-md-6">
                    <strong>Mother's Email:</strong>
                    <br />
                    <i className="bi bi-envelope me-2"></i>
                    {student.mother_email || 'N/A'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fee Structure Card */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">
                <i className="bi bi-cash-stack me-2"></i>
                Annual Fee Structure - Session {student.session}
              </h5>
            </div>
            <div className="card-body">
              {student.has_fee_structure && student.fee_structure.length > 0 ? (
                <>
                  {student.fee_structure.map((head, index) => (
                    <div key={index} className="mb-4">
                      <h6 className="bg-light p-2 rounded">
                        <i className="bi bi-tag-fill me-2 text-primary"></i>
                        {head.head_name}
                        <span className="float-end text-success fw-bold">
                          Annual: ₹{head.annual_total.toFixed(2)}
                        </span>
                      </h6>
                      <div className="table-responsive">
                        <table className="table table-sm table-bordered">
                          <thead className="table-light">
                            <tr>
                              {head.months.map((month, idx) => (
                                <th key={idx} className="text-center">{month.month.substr(0, 3)}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              {head.months.map((month, idx) => (
                                <td key={idx} className="text-center">
                                  ₹{month.amount.toFixed(2)}
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}

                  {/* Grand Total */}
                  <div className="alert alert-success d-flex justify-content-between align-items-center mb-0">
                    <h5 className="mb-0">
                      <i className="bi bi-calculator me-2"></i>
                      Grand Total (All Heads - Annual)
                    </h5>
                    <h4 className="mb-0 fw-bold">₹{calculateGrandTotal().toFixed(2)}</h4>
                  </div>

                  {/* Pay Fee Button */}
                  <div className="text-center mt-4">
                    <button className="btn btn-primary btn-lg px-5">
                      <i className="bi bi-cash-coin me-2"></i>
                      Proceed to Pay Fee
                    </button>
                  </div>
                </>
              ) : (
                <div className="alert alert-warning mb-0">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  No fee structure assigned to this student yet. Please contact administration.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
