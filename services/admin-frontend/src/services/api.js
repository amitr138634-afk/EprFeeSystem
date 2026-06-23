import axios from 'axios'
import { notify, getApiErrorMessage } from '../lib/notify'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

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
  login:             (data) => api.post('/auth/login/', data, { suppressErrorToast: true, skipAuth: true }),
  logout:            (refresh) => api.post('/auth/logout/', { refresh }),
  profile:           () => api.get('/auth/profile/'),
  changePassword:    (data) => api.post('/auth/change-password/', data),
  changeSession:     (data) => api.post('/auth/change-session/', data),
  listSessions:      () => api.get('/auth/sessions/'),
  listSchoolAdmins:  (params) => api.get('/auth/school-admins/', { params }),
  createSchoolAdmin: (data) => api.post('/auth/school-admins/', data),
  getSchoolAdmin:    (id) => api.get(`/auth/school-admins/${id}/`),
  updateSchoolAdmin: (id, data) => api.patch(`/auth/school-admins/${id}/`, data),
  deleteSchoolAdmin: (id) => api.delete(`/auth/school-admins/${id}/`),
  resetAdminPassword:(id, new_password) => api.post(`/auth/school-admins/${id}/reset-password/`, { new_password }),
}

export const schoolApi = {
  list:         () => api.get('/schools/'),
  create:       (data) => api.post('/schools/', data),
  get:          (id) => api.get(`/schools/${id}/`),
  update:       (id, data) => api.patch(`/schools/${id}/`, data),
  toggleStatus: (id) => api.post(`/schools/${id}/toggle-status/`),
  dashboard:    () => api.get('/schools/dashboard/'),
}

export const studentsApi = {
  list:           (params) => api.get('/students/', { params }),
  create:         (data) => api.post('/students/', data),
  get:            (id) => api.get(`/students/${id}/`),
  detail:         (id) => api.get(`/students/${id}/`), // Alias for get
  update:         (id, data) => api.patch(`/students/${id}/`, data),
  delete:         (id) => api.delete(`/students/${id}/`),
  getStrength:    (params) => api.get('/students/strength/', { params }),
  classMasters:   (params) => api.get('/students/class-masters/', { params }),
  sectionMasters: (params) => api.get('/students/section-masters/', { params }),
}

export const studentApi = {
  list:           (params) => api.get('/students/', { params }),
  create:         (data) => api.post('/students/', data),
  get:            (id) => api.get(`/students/${id}/`),
  detail:         (id) => api.get(`/students/${id}/`), // Alias for get
  update:         (id, data) => api.patch(`/students/${id}/`, data),
  delete:         (id) => api.delete(`/students/${id}/`),
  changeSection:  (id, data) => api.post(`/students/${id}/change-section/`, data),
  strength:       (params) => api.get('/students/strength/', { params }),
  classes:        (params) => api.get('/students/classes/', { params }),
  createClass:    (data) => api.post('/students/classes/', data),
  updateClass:    (id, data) => api.patch(`/students/classes/${id}/`, data),
  deleteClass:    (id) => api.delete(`/students/classes/${id}/`),
  sections:       (params) => api.get('/students/sections/', { params }),
  createSection:  (data) => api.post('/students/sections/', data),
  // Fee-backend tables
  classMasters:   (params) => api.get('/students/class-masters/', { params }),
  sectionMasters: (params) => api.get('/students/section-masters/', { params }),
  
  // ClassMaster/SectionMaster APIs (from fee-backend tables)
  classMasters:   (params) => api.get('/students/class-masters/', { params }),
  sectionMasters: (params) => api.get('/students/section-masters/', { params }),
  updateSection:  (id, data) => api.patch(`/students/sections/${id}/`, data),
  deleteSection:  (id) => api.delete(`/students/sections/${id}/`),
  bulkImport:     (formData) => api.post('/students/import/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  importTemplate: () => api.get('/students/import/template/', { responseType: 'blob' }),
}

export const staffApi = {
  list:              (params) => api.get('/staff/', { params }),
  create:            (data, config) => api.post('/staff/', data, config),
  get:               (id) => api.get(`/staff/${id}/`),
  update:            (id, data, config) => api.patch(`/staff/${id}/`, data, config),
  delete:            (id) => api.delete(`/staff/${id}/`),
  departments:       () => api.get('/staff/departments/'),
  createDepartment:  (data) => api.post('/staff/departments/', data),
  updateDepartment:  (id, data) => api.patch(`/staff/departments/${id}/`, data),
  deleteDepartment:  (id) => api.delete(`/staff/departments/${id}/`),
  designations:      (params) => api.get('/staff/designations/', { params }),
  createDesignation: (data) => api.post('/staff/designations/', data),
  updateDesignation: (id, data) => api.patch(`/staff/designations/${id}/`, data),
  deleteDesignation: (id) => api.delete(`/staff/designations/${id}/`),
  departmentDesignations:    () => api.get('/staff/department-designations/'),
  createDeptDesignation:     (data) => api.post('/staff/department-designations/', data),
  updateDeptDesignation:     (id, data) => api.patch(`/staff/department-designations/${id}/`, data),
  deleteDeptDesignation:     (id) => api.delete(`/staff/department-designations/${id}/`),
  shifts:            () => api.get('/staff/shifts/'),
  createShift:       (data) => api.post('/staff/shifts/', data),
  updateShift:       (id, data) => api.patch(`/staff/shifts/${id}/`, data),
  deleteShift:       (id) => api.delete(`/staff/shifts/${id}/`),
  leaveTypes:        () => api.get('/staff/leave-types/'),
  createLeaveType:   (data) => api.post('/staff/leave-types/', data),
  updateLeaveType:   (id, data) => api.patch(`/staff/leave-types/${id}/`, data),
  deleteLeaveType:   (id) => api.delete(`/staff/leave-types/${id}/`),
  leaveRequests:      (params) => api.get('/staff/leave-requests/', { params }),
  createLeaveRequest: (data) => api.post('/staff/leave-requests/', data),
  leaveAction:        (id, action) => api.post(`/staff/leave-requests/${id}/action/`, { action }),
  leaveBalance:       (params) => api.get('/staff/leave-balance/', { params }),
}

export const attendanceApi = {
  studentList:  (params) => api.get('/attendance/students/', { params }),
  bulkMark:     (data) => api.post('/attendance/students/bulk/', data),
  register:     (params) => api.get('/attendance/students/register/', { params }),
  absentLog:    () => api.get('/attendance/students/absent-log/'),
  summary:      (params) => api.get('/attendance/students/summary/', { params }),
  staffList:    (params) => api.get('/attendance/staff/', { params }),
  staffRoster:  (params) => api.get('/attendance/staff/roster/', { params }),
  staffBulkMark:(data) => api.post('/attendance/staff/bulk/', data),
  staffMonthly: (params) => api.get('/attendance/staff/monthly/', { params }),
  markStaff:    (data) => api.post('/attendance/staff/', data),
  holidays:     (params) => api.get('/attendance/holidays/', { params }),
  createHoliday:(data) => api.post('/attendance/holidays/', data),
  updateHoliday:(id, data) => api.patch(`/attendance/holidays/${id}/`, data),
  deleteHoliday:(id) => api.delete(`/attendance/holidays/${id}/`),
  dashboardStats: () => api.get('/attendance/dashboard/'),
}

export const timetableApi = {
  list:             (params) => api.get('/timetable/', { params }),
  create:           (data) => api.post('/timetable/', data),
  update:           (id, data) => api.patch(`/timetable/${id}/`, data),
  delete:           (id) => api.delete(`/timetable/${id}/`),
  subjects:         () => api.get('/timetable/subjects/'),
  createSubject:    (data) => api.post('/timetable/subjects/', data),
  updateSubject:    (id, data) => api.patch(`/timetable/subjects/${id}/`, data),
  deleteSubject:    (id) => api.delete(`/timetable/subjects/${id}/`),
  periods:          () => api.get('/timetable/periods/'),
  createPeriod:     (data) => api.post('/timetable/periods/', data),
  updatePeriod:     (id, data) => api.patch(`/timetable/periods/${id}/`, data),
  deletePeriod:     (id) => api.delete(`/timetable/periods/${id}/`),
  teacherTimetable: (id) => api.get(`/timetable/teacher/${id}/`),
  substitutes:      (params) => api.get('/timetable/substitutes/', { params }),
  createSubstitute: (data) => api.post('/timetable/substitutes/', data),
}

export const academicsApi = {
  examTypes:             (params) => api.get('/academics/exam-types/', { params }),
  createExamType:        (data) => api.post('/academics/exam-types/', data),
  updateExamType:        (id, data) => api.patch(`/academics/exam-types/${id}/`, data),
  deleteExamType:        (id) => api.delete(`/academics/exam-types/${id}/`),
  marks:                 (params) => api.get('/academics/marks/', { params }),
  bulkMarks:             (data) => api.post('/academics/marks/bulk/', data),
  subjectAllocations:    (params) => api.get('/academics/subject-allocations/', { params }),
  createSubjectAllocation:(data) => api.post('/academics/subject-allocations/', data),
  updateSubjectAllocation:(id, data) => api.patch(`/academics/subject-allocations/${id}/`, data),
  deleteSubjectAllocation:(id) => api.delete(`/academics/subject-allocations/${id}/`),
  remarks:               (params) => api.get('/academics/remarks/', { params }),
  createRemark:          (data) => api.post('/academics/remarks/', data),
  updateRemark:          (id, data) => api.patch(`/academics/remarks/${id}/`, data),
  deleteRemark:          (id) => api.delete(`/academics/remarks/${id}/`),
  studentSubjects:       (params) => api.get('/academics/student-subjects/', { params }),
  /* Academics — grade scale */
  gradeScale:            () => api.get('/academics/grade-scale/'),
  createGradeScale:      (data) => api.post('/academics/grade-scale/', data),
  updateGradeScale:      (id, data) => api.patch(`/academics/grade-scale/${id}/`, data),
  deleteGradeScale:      (id) => api.delete(`/academics/grade-scale/${id}/`),
  /* Academics — calculation master (exam weightages) */
  calculation:           (params) => api.get('/academics/calculation/', { params }),
  updateCalculation:     (data) => api.patch('/academics/calculation/', data),
  /* Academics — class results */
  classResults:          (params) => api.get('/academics/results/', { params }),
  /* Report card */
  reportCard:            (params) => api.get('/academics/report-card/', { params }),
  /* CCE — Grade Master */
  grades:                (params) => api.get('/academics/grades/', { params }),
  createGrade:           (data) => api.post('/academics/grades/', data),
  updateGrade:           (id, data) => api.patch(`/academics/grades/${id}/`, data),
  deleteGrade:           (id) => api.delete(`/academics/grades/${id}/`),
  /* CCE — Test Master */
  tests:                 (params) => api.get('/academics/tests/', { params }),
  createTest:            (data) => api.post('/academics/tests/', data),
  updateTest:            (id, data) => api.patch(`/academics/tests/${id}/`, data),
  deleteTest:            (id) => api.delete(`/academics/tests/${id}/`),
  /* CCE — Co-Scholastic Subject Master */
  coScholasticSubjects:       (params) => api.get('/academics/co-scholastic-subjects/', { params }),
  createCoScholasticSubject:  (data) => api.post('/academics/co-scholastic-subjects/', data),
  updateCoScholasticSubject:  (id, data) => api.patch(`/academics/co-scholastic-subjects/${id}/`, data),
  deleteCoScholasticSubject:  (id) => api.delete(`/academics/co-scholastic-subjects/${id}/`),
  coScholasticAssignments:      () => api.get('/academics/co-scholastic-assignments/'),
  saveCoScholasticAssignments:  (data) => api.post('/academics/co-scholastic-assignments/', data),
  /* CCE — Assign Subject & Test grid */
  assignSubjectTest:     (params) => api.get('/academics/assign-subject-test/', { params }),
  saveAssignSubjectTest: (data) => api.post('/academics/assign-subject-test/', data),
  /* CCE — Marks Feeding */
  marksFeedingTests:     (params) => api.get('/academics/marks-feeding/tests/', { params }),
  marksFeedingSubjects:  (params) => api.get('/academics/marks-feeding/subjects/', { params }),
  marksFeedingGrid:      (params) => api.get('/academics/marks-feeding/grid/', { params }),
  saveMarksFeedingGrid:  (data) => api.post('/academics/marks-feeding/grid/', data),
  marksFeedingRemarks:   (params) => api.get('/academics/marks-feeding/remarks/', { params }),
  /* CCE — Signature Master */
  signatures:            (params) => api.get('/academics/signatures/', { params }),
  createSignature:       (formData) => api.post('/academics/signatures/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateSignature:       (id, formData) => api.patch(`/academics/signatures/${id}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteSignature:       (id) => api.delete(`/academics/signatures/${id}/`),
  classTeacherLookup:    (params) => api.get('/academics/signatures/class-teacher-lookup/', { params }),
}

export const adminApi = {
  dashboardStats:  () => api.get('/attendance/dashboard/'),
  studentStrength: () => api.get('/students/strength/'),
}
