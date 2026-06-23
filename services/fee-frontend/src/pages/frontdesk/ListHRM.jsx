import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, Plus } from 'lucide-react'
import { frontdeskApi } from '../../services/api'
import HRMCandidateTable from './HRMCandidateTable'

export default function ListHRM() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const params = { ...(search && { search }) }
  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ['hrm-candidates', params],
    queryFn: () => frontdeskApi.hrmCandidates(params).then(r => r.data.results || r.data),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">List HRM</h1>
          <p className="text-sm text-gray-500 mt-1">All interview candidates — click a row for full detail, mark Interview status here</p>
        </div>
        <button onClick={() => navigate('/frontdesk/hrm/add')} className="btn-primary">
          <Plus size={16} /> Add HRM
        </button>
      </div>

      <div className="card p-5">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-2.5 top-2.5 text-gray-400" />
          <input className="form-input pl-8" value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or mobile" />
        </div>
      </div>

      <HRMCandidateTable candidates={candidates} isLoading={isLoading} selectMode="interview" queryKey={['hrm-candidates']} />
    </div>
  )
}
