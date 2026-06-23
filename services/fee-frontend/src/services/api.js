import axios from 'axios'
import { notify, getApiErrorMessage } from '../lib/notify'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  // Public pre-login calls (e.g. login page session dropdown) opt out via
  // { skipAuth: true } — a stale/expired token here would 401 the request,
  // since JWT auth rejects bad tokens before AllowAny is even checked.
  if (token && !config.skipAuth) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {}

    // One-time token refresh on 401, then replay the original request.
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh })
        localStorage.setItem('access_token', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        if (window.location.pathname !== '/login') {
          // Surfaced on the login page after the redirect (toast state is lost on reload).
          sessionStorage.setItem('auth_message', 'Your session has expired. Please sign in again.')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    }

    // Global API-failure popup. Opt out per request with { suppressErrorToast: true }.
    if (!original.suppressErrorToast) {
      const message = getApiErrorMessage(error)
      if (message) notify.error(message)
    }
    return Promise.reject(error)
  }
)

export default api

export const authApi = {
  login:         (data) => api.post('/auth/login/', data, { suppressErrorToast: true, skipAuth: true }),
  logout:        (refresh) => api.post('/auth/logout/', { refresh }),
  profile:       () => api.get('/auth/profile/'),
  listSessions:  () => api.get('/auth/sessions/'),
  changeSession: (data) => api.post('/auth/change-session/', data),
  getSchoolCode: (data) => api.post('/auth/get-school-code/', data, { skipAuth: true }),
}

export const feeApi = {
  /* Fee heads */
  heads:              () => api.get('/fees/heads/'),
  createHead:         (data) => api.post('/fees/heads/', data),
  updateHead:         (id, data) => api.patch(`/fees/heads/${id}/`, data),
  deleteHead:         (id) => api.delete(`/fees/heads/${id}/`),
  promoteFeeHeads:    () => api.get('/fees/heads/promote/'),
  cloneFeeHeads:      () => api.post('/fees/heads/promote/'),
  /* Fee amounts */
  amounts:            (params) => api.get('/fees/amounts/', { params }),
  createAmount:       (data) => api.post('/fees/amounts/', data),
  updateAmount:       (id, data) => api.patch(`/fees/amounts/${id}/`, data),
  deleteAmount:       (id) => api.delete(`/fees/amounts/${id}/`),
  bulkUpdateAmounts:  (data) => api.post('/fees/amounts/bulk-update/', data),
  /* Fee structures */
  structures:         (params) => api.get('/fees/structures/', { params }),
  createStructure:    (data) => api.post('/fees/structures/', data),
  updateStructure:    (id, data) => api.patch(`/fees/structures/${id}/`, data),
  deleteStructure:    (id) => api.delete(`/fees/structures/${id}/`),
  /* Discounts */
  discountHeads:      () => api.get('/fees/discounts/heads/'),
  createDiscountHead: (data) => api.post('/fees/discounts/heads/', data),
  updateDiscountHead: (id, data) => api.patch(`/fees/discounts/heads/${id}/`, data),
  deleteDiscountHead: (id) => api.delete(`/fees/discounts/heads/${id}/`),
  studentDiscounts:   (params) => api.get('/fees/discounts/students/', { params }),
  /* Payments */
  payFee:             (data) => api.post('/fees/pay/', data),
  /* Receipts */
  receipts:           (params) => api.get('/fees/receipts/', { params }),
  getReceipt:         (id) => api.get(`/fees/receipts/${id}/`),
  cancelReceipt:      (id, reason) => api.post(`/fees/receipts/${id}/cancel/`, { reason }),
  /* Reports */
  dailyReport:        (params) => api.get('/fees/reports/daily/', { params }),
  monthlyReport:      (params) => api.get('/fees/reports/monthly/', { params }),
  classwiseReport:    (params) => api.get('/fees/reports/classwise/', { params }),
  defaulters:         (params) => api.get('/fees/defaulters/', { params }),
  periodDefaulters:   (params) => api.get('/fees/defaulters/period/', { params }),
  feeDashboard:       (params) => api.get('/fees/dashboard/', { params }),
  /* Books */
  bookSets:           (params) => api.get('/fees/books/sets/', { params }),
  createBookSet:      (data) => api.post('/fees/books/sets/', data),
  updateBookSet:      (id, data) => api.patch(`/fees/books/sets/${id}/`, data),
  deleteBookSet:      (id) => api.delete(`/fees/books/sets/${id}/`),
  books:              () => api.get('/fees/books/'),
  createBook:         (data) => api.post('/fees/books/', data),
  updateBook:         (id, data) => api.patch(`/fees/books/${id}/`, data),
  deleteBook:         (id) => api.delete(`/fees/books/${id}/`),
  sellBook:           (data) => api.post('/fees/books/sell/', data),
  /* Uniforms */
  uniforms:           () => api.get('/fees/uniforms/'),
  createUniform:      (data) => api.post('/fees/uniforms/', data),
  updateUniform:      (id, data) => api.patch(`/fees/uniforms/${id}/`, data),
  deleteUniform:      (id) => api.delete(`/fees/uniforms/${id}/`),
  sellUniform:        (data) => api.post('/fees/uniforms/sell/', data),
  /* Deposits & Additional */
  deposits:           (params) => api.get('/fees/deposits/', { params }),
  createDeposit:      (data) => api.post('/fees/deposits/', data),
  updateDeposit:      (id, data) => api.patch(`/fees/deposits/${id}/`, data),
  additionalFees:     () => api.get('/fees/additional/'),
  createAdditionalFee:(data) => api.post('/fees/additional/', data),
  updateAdditionalFee:(id, data) => api.patch(`/fees/additional/${id}/`, data),
  deleteAdditionalFee:(id) => api.delete(`/fees/additional/${id}/`),
  /* Admission Queries */
  queries:            (params) => api.get('/fees/admission-queries/', { params }),
  createQuery:        (data) => api.post('/fees/admission-queries/', data),
  getQuery:           (id) => api.get(`/fees/admission-queries/${id}/`),
  updateQuery:        (id, data) => api.patch(`/fees/admission-queries/${id}/`, data),
  deleteQuery:        (id) => api.delete(`/fees/admission-queries/${id}/`),
  updateQueryStatus:  (id, data) => api.patch(`/fees/admission-queries/${id}/status/`, data),
  payRegistrationFee: (data) => api.post('/fees/admission-queries/pay-registration/', data),
  getRegistrationReceipt: (id) => api.get(`/fees/admission-queries/${id}/receipt/`),
  approveAdmission:   (id) => api.post(`/fees/admission-queries/${id}/approve/`),
  unapproveAdmission: (id, remarks) => api.post(`/fees/admission-queries/${id}/unapprove/`, { remarks }),
  /* Masters - for convenience */
  classes:            (params) => api.get('/masters/classes/', { params }),
  /* Students */
  changeAdmissionNo:  (data) => api.post('/fees/students/change-admission-no/', data),
  searchStudent:      (admissionNo, config) => api.get(`/fees/students/search/?admission_no=${admissionNo}`, config),
  searchStudentsByName: (params) => api.get('/fees/students/search-by-name/', { params }),
  classwiseStrength:  (params) => api.get('/fees/students/strength/', { params }),
  studentListReport:  (params) => api.get('/fees/students/list/', { params }),
  getStudentsByClass: (className) => api.get(`/fees/students/by-class/?class_name=${className}`),
  promoteClassStudents: (params) => api.get('/fees/students/promote-class/', { params }),
  cloneClassStudents:   (data) => api.post('/fees/students/promote-class/', data),
  getStudentProfile:  (studentId) => api.get(`/fees/students/${studentId}/profile/`),
  payStudentFee:      (studentId, data) => api.post(`/fees/students/${studentId}/pay/`, data),
  getClasses:         () => api.get('/masters/classes/'),
  /* Complete Detail (full student edit) */
  getStudentDetail:   (studentId) => api.get(`/fees/students/${studentId}/detail/`),
  updateStudentDetail:(studentId, data, config) => api.patch(`/fees/students/${studentId}/detail/`, data, config),
  /* Per-head, per-month discounts */
  monthlyDiscounts:    (studentId) => api.get('/fees/discounts/monthly/', { params: { student_id: studentId } }),
  saveMonthlyDiscounts:(studentId, discounts) => api.post('/fees/discounts/monthly/', { student_id: studentId, discounts }),
  /* Certificate Upload */
  getStudentCertificates:    (studentId) => api.get(`/fees/students/${studentId}/certificates/`),
  uploadStudentCertificate:  (studentId, formData) => api.post(`/fees/students/${studentId}/certificates/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteStudentCertificate:  (studentId, certificateId) => api.delete(`/fees/students/${studentId}/certificates/`, { params: { certificate_id: certificateId } }),
  /* Fee Management — Summary & Transactions */
  feeSummary:         (params) => api.get('/fees/summary/', { params }),
  feeSummaryHeadNames:(params) => api.get('/fees/summary/head-names/', { params }),
  feeTransactions:    (params) => api.get('/fees/transactions/', { params }),
}

export const masterApi = {
  /* Session Master */
  sessions:           () => api.get('/masters/sessions/'),
  /* Class Master */
  classes:            (params) => api.get('/masters/classes/', { params }),
  createClass:        (data) => api.post('/masters/classes/', data),
  updateClass:        (id, data) => api.patch(`/masters/classes/${id}/`, data),
  deleteClass:        (id) => api.delete(`/masters/classes/${id}/`),
  toggleClassStatus:  (id) => api.post(`/masters/classes/${id}/toggle-status/`),
  /* Section Master (Independent) */
  getSectionMaster:       () => api.get('/masters/section-master/'),
  createSectionMaster:    (data) => api.post('/masters/section-master/', data),
  updateSectionMaster:    (id, data) => api.patch(`/masters/section-master/${id}/`, data),
  deleteSectionMaster:    (id) => api.delete(`/masters/section-master/${id}/`),
  toggleSectionMasterStatus: (id) => api.post(`/masters/section-master/${id}/toggle-status/`),
  /* Class Section Master (with class relationship) */
  sections:           (params) => api.get('/masters/sections/', { params }),
  createSection:      (data) => api.post('/masters/sections/', data),
  updateSection:      (id, data) => api.patch(`/masters/sections/${id}/`, data),
  deleteSection:      (id) => api.delete(`/masters/sections/${id}/`),
  toggleSectionStatus:(id) => api.post(`/masters/sections/${id}/toggle-status/`),
  /* House Master */
  getHouseMaster:       () => api.get('/masters/houses/'),
  createHouseMaster:    (data) => api.post('/masters/houses/', data),
  updateHouseMaster:    (id, data) => api.patch(`/masters/houses/${id}/`, data),
  deleteHouseMaster:    (id) => api.delete(`/masters/houses/${id}/`),
  toggleHouseMasterStatus: (id) => api.post(`/masters/houses/${id}/toggle-status/`),
  /* Blood Group Master */
  getBloodGroupMaster:       () => api.get('/masters/blood-groups/'),
  createBloodGroupMaster:    (data) => api.post('/masters/blood-groups/', data),
  updateBloodGroupMaster:    (id, data) => api.patch(`/masters/blood-groups/${id}/`, data),
  deleteBloodGroupMaster:    (id) => api.delete(`/masters/blood-groups/${id}/`),
  toggleBloodGroupMasterStatus: (id) => api.post(`/masters/blood-groups/${id}/toggle-status/`),
  /* School Info Master (singleton) */
  getSchoolInfo:      () => api.get('/masters/school-info/'),
  updateSchoolInfo:   (data, config) => api.patch('/masters/school-info/', data, config),
  /* Category Master */
  getCategoryMaster:       () => api.get('/masters/categories/'),
  createCategoryMaster:    (data) => api.post('/masters/categories/', data),
  updateCategoryMaster:    (id, data) => api.patch(`/masters/categories/${id}/`, data),
  deleteCategoryMaster:    (id) => api.delete(`/masters/categories/${id}/`),
  toggleCategoryMasterStatus: (id) => api.post(`/masters/categories/${id}/toggle-status/`),
  /* Religion Master */
  getReligionMaster:       () => api.get('/masters/religions/'),
  createReligionMaster:    (data) => api.post('/masters/religions/', data),
  updateReligionMaster:    (id, data) => api.patch(`/masters/religions/${id}/`, data),
  deleteReligionMaster:    (id) => api.delete(`/masters/religions/${id}/`),
  toggleReligionMasterStatus: (id) => api.post(`/masters/religions/${id}/toggle-status/`),
  /* Caste Master */
  getCasteMaster:       () => api.get('/masters/castes/'),
  createCasteMaster:    (data) => api.post('/masters/castes/', data),
  updateCasteMaster:    (id, data) => api.patch(`/masters/castes/${id}/`, data),
  deleteCasteMaster:    (id) => api.delete(`/masters/castes/${id}/`),
  toggleCasteMasterStatus: (id) => api.post(`/masters/castes/${id}/toggle-status/`),
  /* Attendance Master */
  getAttendanceMaster:       () => api.get('/masters/attendance-status/'),
  createAttendanceMaster:    (data) => api.post('/masters/attendance-status/', data),
  updateAttendanceMaster:    (id, data) => api.patch(`/masters/attendance-status/${id}/`, data),
  deleteAttendanceMaster:    (id) => api.delete(`/masters/attendance-status/${id}/`),
  toggleAttendanceMasterStatus: (id) => api.post(`/masters/attendance-status/${id}/toggle-status/`),
  /* Certificate Master */
  getCertificateMaster:       () => api.get('/masters/certificates/'),
  createCertificateMaster:    (data) => api.post('/masters/certificates/', data),
  updateCertificateMaster:    (id, data) => api.patch(`/masters/certificates/${id}/`, data),
  deleteCertificateMaster:    (id) => api.delete(`/masters/certificates/${id}/`),
  toggleCertificateMasterStatus: (id) => api.post(`/masters/certificates/${id}/toggle-status/`),
}

export const transportApi = {
  vehicles:             () => api.get('/transport/vehicles/'),
  createVehicle:        (data) => api.post('/transport/vehicles/', data),
  updateVehicle:        (id, data) => api.patch(`/transport/vehicles/${id}/`, data),
  deleteVehicle:        (id) => api.delete(`/transport/vehicles/${id}/`),
  routes:               () => api.get('/transport/routes/'),
  createRoute:          (data) => api.post('/transport/routes/', data),
  updateRoute:          (id, data) => api.patch(`/transport/routes/${id}/`, data),
  deleteRoute:          (id) => api.delete(`/transport/routes/${id}/`),
  stops:                (params) => api.get('/transport/stops/', { params }),
  createStop:           (data) => api.post('/transport/stops/', data),
  updateStop:           (id, data) => api.patch(`/transport/stops/${id}/`, data),
  deleteStop:           (id) => api.delete(`/transport/stops/${id}/`),
  studentTransport:     (params) => api.get('/transport/students/', { params }),
  applyTransport:       (data) => api.post('/transport/students/', data),
  updateStudentTransport:(id, data) => api.patch(`/transport/students/${id}/`, data),
  removeStudentTransport:(id) => api.delete(`/transport/students/${id}/`),
  attendance:           (params) => api.get('/transport/attendance/', { params }),
  markAttendance:       (data) => api.post('/transport/attendance/', data),
  routeAttendance:      (params) => api.get('/transport/attendance/route/', { params }),
  saveRouteAttendance:  (data) => api.post('/transport/attendance/route/', data),
  buswiseCount:         (params) => api.get('/transport/buswise-count/', { params }),
  parts:                (params) => api.get('/transport/parts/', { params }),
  createPart:           (data) => api.post('/transport/parts/', data),
  updatePart:           (id, data) => api.patch(`/transport/parts/${id}/`, data),
  deletePart:           (id) => api.delete(`/transport/parts/${id}/`),
  dashboard:            () => api.get('/transport/dashboard/'),
  applyStudentTransport:(data) => api.post('/transport/apply/', data),
  promoteTransport:     () => api.get('/transport/promote/'),
  cloneTransport:       () => api.post('/transport/promote/'),
  /* Reports */
  usingTransportReport:   (params) => api.get('/transport/reports/using/', { params }),
  notUsingTransportReport:(params) => api.get('/transport/reports/not-using/', { params }),
}

export const admissionApi = {
  list:      (params) => api.get('/students/admissions/', { params }),
  create:    (data) => api.post('/students/admissions/', data),
  get:       (id) => api.get(`/students/admissions/${id}/`),
  update:    (id, data) => api.patch(`/students/admissions/${id}/`, data),
  delete:    (id) => api.delete(`/students/admissions/${id}/`),
  followUps: (params) => api.get('/students/follow-ups/', { params }),
  addFollowUp:(data) => api.post('/students/follow-ups/', data),
  promote:   (data) => api.post('/students/promote/', data),
}

export const frontdeskApi = {
  visitors:               (params) => api.get('/frontdesk/visitors/', { params }),
  addVisitor:             (data) => api.post('/frontdesk/visitors/', data),
  updateVisitor:          (id, data) => api.patch(`/frontdesk/visitors/${id}/`, data),
  shortLeaves:            (params) => api.get('/frontdesk/short-leaves/', { params }),
  addShortLeave:          (data) => api.post('/frontdesk/short-leaves/', data),
  updateShortLeave:       (id, data) => api.patch(`/frontdesk/short-leaves/${id}/`, data),
  approveShortLeave:      (id, action) => api.post(`/frontdesk/short-leaves/${id}/action/`, { action }),
  feedbacks:              (params) => api.get('/frontdesk/feedbacks/', { params }),
  addFeedback:            (data) => api.post('/frontdesk/feedbacks/', data),
  updateFeedback:         (id, data) => api.patch(`/frontdesk/feedbacks/${id}/`, data),
  authorisedPersons:      (params) => api.get('/frontdesk/authorised-persons/', { params }),
  addAuthorisedPerson:    (data) => api.post('/frontdesk/authorised-persons/', data),
  updateAuthorisedPerson: (id, data) => api.patch(`/frontdesk/authorised-persons/${id}/`, data),
  deleteAuthorisedPerson: (id) => api.delete(`/frontdesk/authorised-persons/${id}/`),
  hrmLetters:             (params) => api.get('/frontdesk/hrm-letters/', { params }),
  addHrmLetter:           (data) => api.post('/frontdesk/hrm-letters/', data),
  updateHrmLetter:        (id, data) => api.patch(`/frontdesk/hrm-letters/${id}/`, data),
  enquiryDashboard:       () => api.get('/frontdesk/enquiry-dashboard/'),
  /* HRM Candidates (Add HRM / List HRM / Add Letter) */
  hrmCandidates:          (params) => api.get('/frontdesk/hrm-candidates/', { params }),
  getHrmCandidate:        (id) => api.get(`/frontdesk/hrm-candidates/${id}/`),
  addHrmCandidate:        (formData) => api.post('/frontdesk/hrm-candidates/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateHrmCandidate:     (id, data) => api.patch(`/frontdesk/hrm-candidates/${id}/`, data),
  deleteHrmCandidate:     (id) => api.delete(`/frontdesk/hrm-candidates/${id}/`),
}
