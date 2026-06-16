import { useState, useEffect } from 'react'
import { Calendar } from 'lucide-react'
import api from '../services/api'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export default function SessionSelector() {
  const { currentSession, changeSession } = useAuthStore()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const response = await api.get('/masters/sessions/')
      const sessionData = Array.isArray(response.data) ? response.data : (response.data.results || [])
      setSessions(sessionData)
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
      setSessions([])
    }
  }

  const handleSessionChange = async (sessionId) => {
    if (loading || !sessionId) return
    
    // Check if same session
    if (currentSession && currentSession.id === parseInt(sessionId)) {
      return
    }
    
    setLoading(true)
    try {
      const response = await api.post('/auth/change-session/', { 
        session_id: parseInt(sessionId) 
      })
      
      // Update tokens
      localStorage.setItem('access_token', response.data.access)
      localStorage.setItem('refresh_token', response.data.refresh)
      
      // Update store
      changeSession(response.data.current_session)
      
      toast.success('Session changed successfully')
      
      // Reload page to refresh data
      window.location.reload()
    } catch (error) {
      toast.error('Failed to change session')
      setLoading(false)
    }
  }

  if (!currentSession || sessions.length === 0) return null

  return (
    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
      <Calendar className="w-4 h-4 text-gray-600" />
      <select
        value={currentSession.id || ''}
        onChange={(e) => handleSessionChange(e.target.value)}
        disabled={loading}
        className="text-sm border-0 bg-transparent focus:ring-0 disabled:opacity-50 cursor-pointer"
      >
        {sessions.map((session) => (
          <option key={session.id} value={session.id}>
            {session.session_year}
          </option>
        ))}
      </select>
      {loading && (
        <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      )}
    </div>
  )
}
