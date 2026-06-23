import { useState, Fragment } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ChevronDown, ChevronUp, User, FileText, ExternalLink } from 'lucide-react'
import { frontdeskApi } from '../../services/api'

const CERT_LINKS = [
  ['tenth_certificate', '10th Certificate'],
  ['twelfth_certificate', '12th Certificate'],
  ['graduation_certificate', 'Graduation Certificate'],
  ['highest_certificate', 'Highest Qualification Certificate'],
  ['resume', 'Resume'],
  ['other_certificate', 'Other Certificate'],
]

function DetailRow({ label, value }) {
  if (!value) return null
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-sm text-gray-700">{value}</p>
    </div>
  )
}

function ExpandedDetail({ c }) {
  return (
    <tr>
      <td colSpan={8} className="bg-gray-50 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <DetailRow label="Father Name" value={c.father_name} />
          <DetailRow label="Mother Name" value={c.mother_name} />
          <DetailRow label="Date of Birth" value={c.date_of_birth} />
          <DetailRow label="Gender" value={c.gender} />
          <DetailRow label="Address" value={c.address} />
          <DetailRow label="10th" value={[c.tenth_school, c.tenth_board, c.tenth_year, c.tenth_percentage && `${c.tenth_percentage}%`].filter(Boolean).join(' · ')} />
          <DetailRow label="12th" value={[c.twelfth_school, c.twelfth_board, c.twelfth_stream, c.twelfth_year, c.twelfth_percentage && `${c.twelfth_percentage}%`].filter(Boolean).join(' · ')} />
          <DetailRow label="Graduation" value={[c.graduation_degree, c.graduation_college, c.graduation_university, c.graduation_year, c.graduation_percentage && `${c.graduation_percentage}%`].filter(Boolean).join(' · ')} />
          <DetailRow label="Highest Study" value={[c.highest_qualification, c.highest_institute, c.highest_year, c.highest_percentage && `${c.highest_percentage}%`].filter(Boolean).join(' · ')} />
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1"><FileText size={11} /> Documents</p>
          <div className="flex flex-wrap gap-3">
            {CERT_LINKS.filter(([field]) => c[field]).map(([field, label]) => (
              <a key={field} href={c[field]} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                {label} <ExternalLink size={11} />
              </a>
            ))}
            {CERT_LINKS.every(([field]) => !c[field]) && <p className="text-xs text-gray-400">No documents uploaded</p>}
          </div>
        </div>
      </td>
    </tr>
  )
}

/** Shared table for List HRM and Add Letter — same candidate detail, only
 * the rightmost select differs: `interview` (Not Scheduled / Scheduled) on
 * List HRM, `decision` (Pending / Selected / Rejected) on Add Letter. */
export default function HRMCandidateTable({ candidates, isLoading, selectMode, queryKey }) {
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState(null)

  const updateMutation = useMutation({
    mutationFn: ({ id, field, value }) => frontdeskApi.updateHrmCandidate(id, { [field]: value }),
    onSuccess: () => {
      toast.success('Updated!')
      qc.invalidateQueries(queryKey)
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to update'),
  })

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th></th><th>Name</th><th>Mobile</th><th>10th %</th><th>12th %</th>
            <th>Graduation</th><th>Highest Study</th>
            <th>{selectMode === 'decision' ? 'Decision' : 'Interview'}</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && <tr><td colSpan={8} className="text-center py-8 text-gray-400">Loading...</td></tr>}
          {!isLoading && candidates.length === 0 && (
            <tr><td colSpan={8} className="text-center py-8 text-gray-400">No candidates found</td></tr>
          )}
          {candidates.map(c => (
            <Fragment key={c.id}>
              <tr className="cursor-pointer hover:bg-gray-50" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                <td>
                  {c.photo ? (
                    <img src={c.photo} alt={c.full_name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500"><User size={14} /></div>
                  )}
                </td>
                <td className="font-medium text-gray-900">
                  <span className="flex items-center gap-1">
                    {c.full_name}
                    {expanded === c.id ? <ChevronUp size={13} className="text-gray-400" /> : <ChevronDown size={13} className="text-gray-400" />}
                  </span>
                </td>
                <td>{c.mobile}</td>
                <td>{c.tenth_percentage ? `${c.tenth_percentage}%` : '—'}</td>
                <td>{c.twelfth_percentage ? `${c.twelfth_percentage}%` : '—'}</td>
                <td>{c.graduation_degree || '—'}</td>
                <td>{c.highest_qualification || '—'}</td>
                <td onClick={e => e.stopPropagation()}>
                  {selectMode === 'decision' ? (
                    <select
                      className="form-select text-xs py-1"
                      value={c.decision}
                      onChange={e => updateMutation.mutate({ id: c.id, field: 'decision', value: e.target.value })}
                    >
                      <option value="pending">Pending</option>
                      <option value="selected">Selected</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  ) : (
                    <select
                      className="form-select text-xs py-1"
                      value={c.interview_status}
                      onChange={e => updateMutation.mutate({ id: c.id, field: 'interview_status', value: e.target.value })}
                    >
                      <option value="not_scheduled">Not Scheduled</option>
                      <option value="scheduled">Interview Scheduled</option>
                    </select>
                  )}
                </td>
              </tr>
              {expanded === c.id && <ExpandedDetail c={c} />}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
