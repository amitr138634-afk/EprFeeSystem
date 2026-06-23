import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, User } from 'lucide-react'
import { feeApi } from '../../services/api'
import useAuthStore from '../../store/authStore'

export default function SearchStudent() {
  const navigate = useNavigate()
  const activeSession = useAuthStore(s => s.currentSession?.session_year) || ''
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(t)
  }, [query])

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['search-student-by-name', debouncedQuery, activeSession],
    queryFn: () => feeApi.searchStudentsByName({ q: debouncedQuery, session: activeSession }).then(r => r.data),
    enabled: debouncedQuery.length > 0,
  })

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Search Student</h1>
        <p className="text-sm text-gray-500 mt-1">Search by student name or admission no., then click a result to open their profile</p>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
        <input
          autoFocus
          className="form-input pl-10 text-base py-3"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Type a student's name or admission number..."
        />
      </div>

      {debouncedQuery.length === 0 ? (
        <div className="card p-8 text-center text-sm text-gray-400">Start typing to search students.</div>
      ) : isFetching ? (
        <div className="card p-8 text-center text-sm text-gray-400">Searching...</div>
      ) : results.length === 0 ? (
        <div className="card p-8 text-center text-sm text-gray-400">No students found for "{debouncedQuery}".</div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {results.map(r => (
            <button
              key={r.id}
              onClick={() => navigate(`/feemgmt/student-profile/${r.id}`)}
              className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
            >
              {r.photo ? (
                <img src={r.photo} alt={r.student_name} className="w-11 h-11 rounded-full object-cover flex-shrink-0 border border-gray-200" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  <User size={18} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{r.student_name}</p>
                <p className="text-xs text-gray-500">{r.admission_no} · Class {r.class_name}-{r.section} · {r.father_mobile}</p>
              </div>
              <span className="text-blue-600 text-xs flex-shrink-0">View Profile →</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
