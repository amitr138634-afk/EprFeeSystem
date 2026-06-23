import { useQuery } from '@tanstack/react-query'
import { frontdeskApi } from '../../services/api'
import HRMCandidateTable from './HRMCandidateTable'

export default function AddLetter() {
  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ['hrm-candidates', { interview_status: 'scheduled' }],
    queryFn: () => frontdeskApi.hrmCandidates({ interview_status: 'scheduled' }).then(r => r.data.results || r.data),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Add Letter</h1>
        <p className="text-sm text-gray-500 mt-1">Candidates with an interview scheduled — mark the outcome as Selected or Rejected</p>
      </div>

      <HRMCandidateTable
        candidates={candidates}
        isLoading={isLoading}
        selectMode="decision"
        queryKey={['hrm-candidates', { interview_status: 'scheduled' }]}
      />
    </div>
  )
}
