import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Eye, Edit, ToggleLeft, ToggleRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import DataTable from '../../components/common/DataTable'
import { schoolApi } from '../../services/api'

export default function SchoolList() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['schools'],
    queryFn: () => schoolApi.list().then(r => r.data.results || r.data),
  })

  const toggleMutation = useMutation({
    mutationFn: (id) => schoolApi.toggleStatus(id),
    onSuccess: () => {
      qc.invalidateQueries(['schools'])
      toast.success('School status updated')
    },
  })

  const schools = data || []

  const columns = [
    { key: 'code', label: 'Code', width: '80px' },
    { key: 'name', label: 'School Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'city', label: 'City' },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          val === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {val}
        </span>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button className="p-1.5 hover:bg-blue-50 rounded text-blue-600"><Eye size={14} /></button>
          <button className="p-1.5 hover:bg-green-50 rounded text-green-600"><Edit size={14} /></button>
          <button
            onClick={() => toggleMutation.mutate(row.id)}
            className={`p-1.5 rounded ${row.status === 'active' ? 'hover:bg-red-50 text-red-500' : 'hover:bg-green-50 text-green-600'}`}
          >
            {row.status === 'active' ? <ToggleLeft size={18} /> : <ToggleRight size={18} />}
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Schools</h1>
          <p className="text-sm text-gray-500">Manage all registered schools</p>
        </div>
        <button onClick={() => navigate('/schools/create')} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Create School
        </button>
      </div>

      <div className="card p-4">
        <DataTable
          columns={columns}
          data={schools}
          loading={isLoading}
          emptyText="No schools registered"
        />
      </div>
    </div>
  )
}
