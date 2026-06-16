import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  currentSession: null,

  login: (user, tokens, session = null) => {
    localStorage.setItem('access_token', tokens.access)
    localStorage.setItem('refresh_token', tokens.refresh)
    set({ user, isAuthenticated: true, currentSession: session })
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ user: null, isAuthenticated: false, currentSession: null })
  },

  setUser: (user) => set({ user, isAuthenticated: true }),

  changeSession: (session) => set({ currentSession: session }),

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
              full_name: payload.full_name,
              role: payload.role,
              school_id: payload.school_id,
              school_name: payload.school_name || '',
            },
            currentSession: payload.current_session && payload.session_id ? {
              id: payload.session_id,
              session_year: payload.current_session,
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
