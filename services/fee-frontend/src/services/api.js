import axios from 'axios'

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
}

export const feeApi = {
  heads: () => api.get('/fees/heads/'),
  createHead: (data) => api.post('/fees/heads/', data),
  structures: (params) => api.get('/fees/structures/', { params }),
  createStructure: (data) => api.post('/fees/structures/', data),
  discountHeads: () => api.get('/fees/discounts/heads/'),
  studentDiscounts: (params) => api.get('/fees/discounts/students/', { params }),
  payFee: (data) => api.post('/fees/pay/', data),
  receipts: (params) => api.get('/fees/receipts/', { params }),
  getReceipt: (id) => api.get(`/fees/receipts/${id}/`),
  dailyReport: (params) => api.get('/fees/reports/daily/', { params }),
  classwiseReport: (params) => api.get('/fees/reports/classwise/', { params }),
  defaulters: (params) => api.get('/fees/defaulters/', { params }),
  bookSets: (params) => api.get('/fees/books/sets/', { params }),
  sellBook: (data) => api.post('/fees/books/sell/', data),
  uniforms: () => api.get('/fees/uniforms/'),
  sellUniform: (data) => api.post('/fees/uniforms/sell/', data),
  deposits: (params) => api.get('/fees/deposits/', { params }),
}

export const transportApi = {
  vehicles: () => api.get('/transport/vehicles/'),
  routes: () => api.get('/transport/routes/'),
  stops: (params) => api.get('/transport/stops/', { params }),
  studentTransport: (params) => api.get('/transport/students/', { params }),
  applyTransport: (data) => api.post('/transport/students/', data),
  attendance: (params) => api.get('/transport/attendance/', { params }),
  buswiseCount: (params) => api.get('/transport/buswise-count/', { params }),
}

export const admissionApi = {
  list: (params) => api.get('/students/admissions/', { params }),
  create: (data) => api.post('/students/admissions/', data),
  get: (id) => api.get(`/students/admissions/${id}/`),
  update: (id, data) => api.patch(`/students/admissions/${id}/`, data),
  followUps: (params) => api.get('/students/follow-ups/', { params }),
  promote: (data) => api.post('/students/promote/', data),
}

export const frontdeskApi = {
  visitors: (params) => api.get('/frontdesk/visitors/', { params }),
  addVisitor: (data) => api.post('/frontdesk/visitors/', data),
  shortLeaves: (params) => api.get('/frontdesk/short-leaves/', { params }),
  feedbacks: (params) => api.get('/frontdesk/feedbacks/', { params }),
  addFeedback: (data) => api.post('/frontdesk/feedbacks/', data),
  hrmLetters: (params) => api.get('/frontdesk/hrm-letters/', { params }),
}
