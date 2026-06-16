import axios from 'axios'
import { notify, getApiErrorMessage } from '../lib/notify'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
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
  login:   (data) => api.post('/auth/login/', data, { suppressErrorToast: true }),
  logout:  (refresh) => api.post('/auth/logout/', { refresh }),
  profile: () => api.get('/auth/profile/'),
}

export const feeApi = {
  /* Fee heads */
  heads:              () => api.get('/fees/heads/'),
  createHead:         (data) => api.post('/fees/heads/', data),
  updateHead:         (id, data) => api.patch(`/fees/heads/${id}/`, data),
  deleteHead:         (id) => api.delete(`/fees/heads/${id}/`),
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
  searchStudent:      (admissionNo) => api.get(`/fees/students/search/?admission_no=${admissionNo}`),
  getStudentsByClass: (className) => api.get(`/fees/students/by-class/?class_name=${className}`),
  getStudentProfile:  (studentId) => api.get(`/fees/students/${studentId}/profile/`),
  getClasses:         () => api.get('/masters/classes/'),
}

export const masterApi = {
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
  buswiseCount:         (params) => api.get('/transport/buswise-count/', { params }),
  parts:                (params) => api.get('/transport/parts/', { params }),
  createPart:           (data) => api.post('/transport/parts/', data),
  updatePart:           (id, data) => api.patch(`/transport/parts/${id}/`, data),
  deletePart:           (id) => api.delete(`/transport/parts/${id}/`),
  dashboard:            () => api.get('/transport/dashboard/'),
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
}
