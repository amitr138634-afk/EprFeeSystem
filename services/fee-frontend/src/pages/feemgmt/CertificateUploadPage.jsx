import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, FileText, Upload, Trash2, CheckCircle2, ExternalLink } from 'lucide-react'
import { feeApi } from '../../services/api'

export default function CertificateUploadPage() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const backTo = () => navigate(`/feemgmt/student-profile/${studentId}`)
  const [pendingFiles, setPendingFiles] = useState({})

  const { data: student, isLoading: studentLoading, error } = useQuery({
    queryKey: ['student-profile-for-certificates', studentId],
    queryFn: () => feeApi.getStudentProfile(studentId).then(r => r.data),
  })

  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ['student-certificates', studentId],
    queryFn: () => feeApi.getStudentCertificates(studentId).then(r => r.data),
  })

  const uploadMutation = useMutation({
    mutationFn: ({ certificateId, file }) => {
      const fd = new FormData()
      fd.append('certificate_id', certificateId)
      fd.append('file', file)
      return feeApi.uploadStudentCertificate(studentId, fd)
    },
    onSuccess: (res) => {
      toast.success(res.data?.detail || 'Certificate uploaded!')
      qc.invalidateQueries(['student-certificates', studentId])
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to upload certificate'),
  })

  const deleteMutation = useMutation({
    mutationFn: (certificateId) => feeApi.deleteStudentCertificate(studentId, certificateId),
    onSuccess: () => {
      toast.success('Certificate removed.')
      qc.invalidateQueries(['student-certificates', studentId])
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to remove certificate'),
  })

  const handleFileChange = (certificateId, file) => {
    setPendingFiles(prev => ({ ...prev, [certificateId]: file }))
  }

  const handleUpload = (certificateId) => {
    const file = pendingFiles[certificateId]
    if (!file) {
      toast.error('Choose a file first')
      return
    }
    uploadMutation.mutate({ certificateId, file })
    setPendingFiles(prev => ({ ...prev, [certificateId]: null }))
  }

  if (studentLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="space-y-4 max-w-xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">Error loading student profile</div>
        <button onClick={backTo} className="btn-secondary"><ArrowLeft size={16} /> Back</button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <button onClick={backTo} className="btn-secondary"><ArrowLeft size={16} /> Back to Profile</button>

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600"><FileText size={20} /></div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Certificate Upload</h1>
            <p className="text-sm text-gray-500 mt-0.5">{student.student_name} - {student.admission_no}</p>
          </div>
        </div>

        {certificates.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            No certificate types defined yet. Add them in Masters → Certificate Master.
          </div>
        ) : (
          <div className="space-y-3">
            {certificates.map(cert => (
              <div key={cert.certificate_id} className="flex items-center gap-4 border border-gray-100 rounded-lg p-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    {cert.certificate_name}
                    {cert.uploaded && <span className="badge-green flex items-center gap-1"><CheckCircle2 size={11} /> Uploaded</span>}
                  </p>
                  {cert.uploaded && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Uploaded {new Date(cert.uploaded_at).toLocaleDateString('en-IN')}
                      {cert.file_url && (
                        <a href={cert.file_url} target="_blank" rel="noreferrer" className="text-blue-600 ml-2 inline-flex items-center gap-1">
                          View <ExternalLink size={11} />
                        </a>
                      )}
                    </p>
                  )}
                </div>

                <input
                  type="file"
                  onChange={e => handleFileChange(cert.certificate_id, e.target.files?.[0] || null)}
                  className="form-input text-xs max-w-[180px]"
                />
                <button
                  type="button"
                  onClick={() => handleUpload(cert.certificate_id)}
                  disabled={uploadMutation.isPending}
                  className="btn-primary btn-sm flex-shrink-0"
                >
                  <Upload size={14} /> {cert.uploaded ? 'Replace' : 'Upload'}
                </button>
                {cert.uploaded && (
                  <button
                    type="button"
                    onClick={() => { if (window.confirm(`Remove ${cert.certificate_name}?`)) deleteMutation.mutate(cert.certificate_id) }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded flex-shrink-0"
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
