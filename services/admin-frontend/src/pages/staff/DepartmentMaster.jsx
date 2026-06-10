import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { staffApi } from '../../services/api'
import api from '../../services/api'

export default function DepartmentMaster() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', code: '' })

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => staffApi.departments().then(r => r.data.results || r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/staff/departments/', data),
    onSuccess: () => {
      qc.invalidateQueries(['departments'])
      setShowForm(false)
      setForm({ name: '', code: '' })
      toast.success('Department created!')
    },
    onError: () => toast.error('Failed to create department'),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Department Master</h1>
          <p className="text-sm text-gray-500">Manage school departments</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Department
        </button>
      </div>

      {showForm && (
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Add Department</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Department Name</label>
              <input
                className="form-input"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Mathematics"
              />
            </div>
            <div>
              <label className="form-label">Code</label>
              <input
                className="form-input"
                value={form.code}
                onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
                placeholder="e.g. MATH"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => createMutation.mutate(form)} className="btn-primary">Save</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="table-header px-4 py-3 text-left">#</th>
                <th className="table-header px-4 py-3 text-left">Department Name</th>
                <th className="table-header px-4 py-3 text-left">Code</th>
                <th className="table-header px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-gray-400">No departments found</td></tr>
              ) : (
                departments.map((dept, idx) => (
                  <tr key={dept.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium">{dept.name}</td>
                    <td className="px-4 py-3">{dept.code}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button className="p-1.5 hover:bg-blue-50 rounded text-blue-600"><Edit size={14} /></button>
                        <button className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
