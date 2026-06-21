import { create } from 'zustand'

// Read the JWT synchronously so the store's *initial* state already reflects
// a logged-in session on full page reloads — PrivateRoute reads isAuthenticated
// on the very first render, before any useEffect (e.g. initAuth()) can run, so
// computing this lazily would redirect to /login for an instant on every reload.
function decodeAuthFromStorage() {
  const token = localStorage.getItem('access_token')
  if (!token) return { user: null, currentSession: null, isAuthenticated: false }
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.exp * 1000 <= Date.now()) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      return { user: null, currentSession: null, isAuthenticated: false }
    }
    return {
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
    }
  } catch {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    return { user: null, currentSession: null, isAuthenticated: false }
  }
}

const useAuthStore = create((set) => ({
  ...decodeAuthFromStorage(),

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

  initAuth: () => set(decodeAuthFromStorage()),
}))

export default useAuthStore
