import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Search, ArrowRight, RefreshCw, User } from 'lucide-react'
import { feeApi } from '../../services/api'

export default function ChangeAdmissionNo() {
  const [currentNo, setCurrentNo] = useState('')
  const [debouncedCurrentNo, setDebouncedCurrentNo] = useState('')
  const [newNo, setNewNo] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedCurrentNo(currentNo.trim()), 400)
    return () => clearTimeout(t)
  }, [currentNo])

  const { data: foundStudent, isFetching, isError } = useQuery({
    queryKey: ['lookup-admission-no', debouncedCurrentNo],
    queryFn: () => feeApi.searchStudent(debouncedCurrentNo, { suppressErrorToast: true }).then(r => r.data),
    enabled: debouncedCurrentNo.length > 0,
    retry: false,
  })

  const changeMutation = useMutation({
    mutationFn: () => feeApi.changeAdmissionNo({ current_admission_no: currentNo.trim(), new_admission_no: newNo.trim() }),
    onSuccess: (res) => {
      toast.success(res.data?.detail || 'Admission number changed successfully!')
      setCurrentNo(res.data?.student?.admission_no || newNo)
      setDebouncedCurrentNo(res.data?.student?.admission_no || newNo)
      setNewNo('')
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to change admission number'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!foundStudent) {
      toast.error('Find a valid student by current admission no. first')
      return
    }
    if (!newNo.trim()) {
      toast.error('Enter the new admission number')
      return
    }
    changeMutation.mutate()
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Change Admission No.</h1>
        <p className="text-sm text-gray-500 mt-1">Look up a student by their current admission number, then assign a new one</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="form-label">Current Admission No. *</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              className="form-input pl-9"
              value={currentNo}
              onChange={e => setCurrentNo(e.target.value)}
              placeholder="Enter existing admission number"
              required
            />
          </div>

          {debouncedCurrentNo.length > 0 && (
            <div className="mt-2">
              {isFetching ? (
                <p className="text-xs text-gray-400">Looking up...</p>
              ) : isError ? (
                <p className="text-xs text-red-600">No student found with this admission no.</p>
              ) : foundStudent ? (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-800">
                  <User size={14} /> {foundStudent.student_name} — Class {foundStudent.class_name}-{foundStudent.section}
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center text-gray-300">
          <ArrowRight size={20} />
        </div>

        <div>
          <label className="form-label">New Admission No. *</label>
          <input
            className="form-input"
            value={newNo}
            onChange={e => setNewNo(e.target.value)}
            placeholder="Enter new admission number"
            required
          />
          <p className="text-xs text-gray-400 mt-1">Checked against all students to make sure it isn't already in use.</p>
        </div>

        <div className="flex justify-end border-t border-gray-100 pt-4">
          <button type="submit" disabled={changeMutation.isPending || !foundStudent} className="btn-primary">
            {changeMutation.isPending ? 'Saving...' : <><RefreshCw size={16} /> Change Admission No.</>}
          </button>
        </div>
      </form>
    </div>
  )
}
