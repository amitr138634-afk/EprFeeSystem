import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
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
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

export const authApi = {
  login: (data) => api.post('/auth/login/', data),
  logout: (refresh) => api.post('/auth/logout/', { refresh }),
  profile: () => api.get('/auth/profile/'),
  changePassword: (data) => api.post('/auth/change-password/', data),
  // Super Admin → school admin management
  listSchoolAdmins: (params) => api.get('/auth/school-admins/', { params }),
  createSchoolAdmin: (data) => api.post('/auth/school-admins/', data),
  getSchoolAdmin: (id) => api.get(`/auth/school-admins/${id}/`),
  updateSchoolAdmin: (id, data) => api.patch(`/auth/school-admins/${id}/`, data),
  deleteSchoolAdmin: (id) => api.delete(`/auth/school-admins/${id}/`),
  resetAdminPassword: (id, new_password) => api.post(`/auth/school-admins/${id}/reset-password/`, { new_password }),
}

export const schoolApi = {
  list: () => api.get('/schools/'),
  create: (data) => api.post('/schools/', data),
  get: (id) => api.get(`/schools/${id}/`),
  update: (id, data) => api.patch(`/schools/${id}/`, data),
  toggleStatus: (id) => api.post(`/schools/${id}/toggle-status/`),
  dashboard: () => api.get('/schools/dashboard/'),
}

export const studentApi = {
  list: (params) => api.get('/students/', { params }),
  create: (data) => api.post('/students/', data),
  get: (id) => api.get(`/students/${id}/`),
  update: (id, data) => api.patch(`/students/${id}/`, data),
  delete: (id) => api.delete(`/students/${id}/`),
  strength: () => api.get('/students/strength/'),
  classes: () => api.get('/students/classes/'),
  createClass: (data) => api.post('/students/classes/', data),
  updateClass: (id, data) => api.patch(`/students/classes/${id}/`, data),
  deleteClass: (id) => api.delete(`/students/classes/${id}/`),
  sections: (params) => api.get('/students/sections/', { params }),
  createSection: (data) => api.post('/students/sections/', data),
  updateSection: (id, data) => api.patch(`/students/sections/${id}/`, data),
  deleteSection: (id) => api.delete(`/students/sections/${id}/`),
  bulkImport: (formData) => api.post('/students/import/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  importTemplate: () => api.get('/students/import/template/', { responseType: 'blob' }),
}

export const staffApi = {
  list: (params) => api.get('/staff/', { params }),
  create: (data) => api.post('/staff/', data),
  get: (id) => api.get(`/staff/${id}/`),
  update: (id, data) => api.patch(`/staff/${id}/`, data),
  departments: () => api.get('/staff/departments/'),
  designations: (params) => api.get('/staff/designations/', { params }),
  shifts: () => api.get('/staff/shifts/'),
  leaveRequests: (params) => api.get('/staff/leave-requests/', { params }),
  leaveAction: (id, action) => api.post(`/staff/leave-requests/${id}/action/`, { action }),
}

export const attendanceApi = {
  studentList: (params) => api.get('/attendance/students/', { params }),
  bulkMark: (data) => api.post('/attendance/students/bulk/', data),
  register: (params) => api.get('/attendance/students/register/', { params }),
  absentLog: () => api.get('/attendance/students/absent-log/'),
  summary: (params) => api.get('/attendance/students/summary/', { params }),
  staffList: (params) => api.get('/attendance/staff/', { params }),
  holidays: (params) => api.get('/attendance/holidays/', { params }),
}

export const timetableApi = {
  list: (params) => api.get('/timetable/', { params }),
  create: (data) => api.post('/timetable/', data),
  update: (id, data) => api.patch(`/timetable/${id}/`, data),
  subjects: () => api.get('/timetable/subjects/'),
  periods: () => api.get('/timetable/periods/'),
  teacherTimetable: (teacherId) => api.get(`/timetable/teacher/${teacherId}/`),
  substitutes: (params) => api.get('/timetable/substitutes/', { params }),
}

export const academicsApi = {
  examTypes: (params) => api.get('/academics/exam-types/', { params }),
  marks: (params) => api.get('/academics/marks/', { params }),
  bulkMarks: (data) => api.post('/academics/marks/bulk/', data),
  subjectAllocations: (params) => api.get('/academics/subject-allocations/', { params }),
  remarks: () => api.get('/academics/remarks/'),
}
