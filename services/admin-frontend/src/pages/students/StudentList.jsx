import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, Filter, Eye, Edit, Trash2 } from 'lucide-react'
import DataTable from '../../components/common/DataTable'
import { studentApi } from '../../services/api'

export default function StudentList() {
  const [search, setSearch] = useState('')
  const [classId, setClassId] = useState('')
  const [page, setPage] = useState(1)

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => studentApi.classes().then(r => r.data.results || r.data),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['students', search, classId, page],
    queryFn: () => studentApi.list({ search, class_id: classId, page }).then(r => r.data),
    keepPreviousData: true,
  })

  const students = data?.results || data || []
  const total = data?.count || students.length

  const columns = [
    { key: 'admission_no', label: 'Adm. No.', width: '100px' },
    {
      key: 'full_name',
      label: 'Student Name',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-semibold">
            {row.first_name?.charAt(0)}
          </div>
          <span className="font-medium">{row.full_name || `${row.first_name} ${row.last_name}`}</span>
        </div>
      ),
    },
    { key: 'class_name', label: 'Class' },
    { key: 'section_name', label: 'Section' },
    { key: 'father_name', label: "Father's Name" },
    { key: 'father_phone', label: 'Phone' },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          val === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
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
          <button className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 size={14} /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Student List</h1>
          <p className="text-sm text-gray-500">Manage all students</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Student
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, admission no, phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="form-input pl-9"
            />
          </div>
          <select
            value={classId}
            onChange={(e) => { setClassId(e.target.value); setPage(1) }}
            className="form-input w-40"
          >
            <option value="">All Classes</option>
            {classes?.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
          <button className="btn-secondary flex items-center gap-2">
            <Filter size={15} /> Filter
          </button>
        </div>

        <DataTable
          columns={columns}
          data={students}
          loading={isLoading}
          emptyText="No students found"
          pagination={{ page, pageSize: 20, total }}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
