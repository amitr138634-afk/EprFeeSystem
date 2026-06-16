import { create } from 'zustand'
import { authApi } from '../services/api'

const useAuthStore = create((set, get) => ({
  user: null,
  currentSession: null,
  isAuthenticated: false,

  login: (user, tokens, session) => {
    localStorage.setItem('access_token', tokens.access)
    localStorage.setItem('refresh_token', tokens.refresh)
    set({ 
      user, 
      currentSession: session,
      isAuthenticated: true 
    })
  },

  changeSession: async (sessionId) => {
    try {
      const response = await authApi.changeSession({ session_id: sessionId })
      localStorage.setItem('access_token', response.data.access)
      localStorage.setItem('refresh_token', response.data.refresh)
      set({ currentSession: response.data.current_session })
      // Reload page to refresh all data with new session
      window.location.reload()
    } catch (error) {
      console.error('Failed to change session:', error)
      throw error
    }
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ user: null, currentSession: null, isAuthenticated: false })
  },

  setUser: (user) => set({ user, isAuthenticated: true }),

  initAuth: () => {
    const token = localStorage.getItem('access_token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.exp * 1000 > Date.now()) {
          set({
            user: {
              id: payload.user_id,
              email: payload.email,
              username: payload.username || '',
              full_name: payload.full_name,
              role: payload.role,
              school_id: payload.school_id,
              school_name: payload.school_name || '',
            },
            currentSession: payload.current_session ? {
              session_year: payload.current_session,
              id: payload.session_id,
            } : null,
            isAuthenticated: true,
          })
        } else {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }
    }
  },
}))

export default useAuthStore
