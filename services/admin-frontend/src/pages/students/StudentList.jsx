import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, Eye, Users } from 'lucide-react'
import DataTable from '../../components/common/DataTable'
import { studentApi } from '../../services/api'

export default function StudentList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [classId, setClassId] = useState('')
  const [status, setStatus] = useState('active')
  const [page, setPage] = useState(1)

  const { data: classes } = useQuery({
    queryKey: ['class-masters'],
    queryFn: () => studentApi.classMasters().then(r => r.data.results || r.data),
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['students', search, classId, status, page],
    queryFn: () => studentApi.list({ 
      search, 
      class_id: classId, 
      status: status || undefined,
      page 
    }).then(r => r.data),
    keepPreviousData: true,
  })

  const students = data?.results || data || []
  const total = data?.count || students.length

  console.log('Student List Debug:', { 
    isLoading, 
    error: error?.message,
    dataReceived: data,
    studentsCount: students.length,
    filters: { search, classId, status, page }
  })

  const columns = [
    { 
      key: 'admission_no', 
      label: 'Admission No.', 
      width: '120px',
      render: (val) => <span className="font-mono text-sm font-semibold text-gray-700">{val}</span>
    },
    {
      key: 'student_name',
      label: 'Student Name',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
            {val?.charAt(0)?.toUpperCase() || 'S'}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{val}</div>
            <div className="text-xs text-gray-500">{row.gender === 'M' ? 'Male' : row.gender === 'F' ? 'Female' : 'Other'}</div>
          </div>
        </div>
      ),
    },
    { 
      key: 'class_name', 
      label: 'Class',
      width: '100px',
      render: (val) => <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">{val}</span>
    },
    { 
      key: 'father_name', 
      label: "Father's Name",
      render: (val) => <span className="text-gray-700">{val}</span>
    },
    { 
      key: 'father_mobile', 
      label: 'Contact',
      width: '130px',
      render: (val) => <span className="font-mono text-sm text-gray-600">{val}</span>
    },
    {
      key: 'admission_date',
      label: 'Admission Date',
      width: '130px',
      render: (val) => {
        if (!val) return '-'
        const date = new Date(val)
        return <span className="text-sm text-gray-600">{date.toLocaleDateString('en-GB')}</span>
      }
    },
    {
      key: 'status',
      label: 'Status',
      width: '100px',
      render: (val) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
          val === 'active' ? 'bg-green-100 text-green-700' : 
          val === 'inactive' ? 'bg-gray-100 text-gray-600' :
          'bg-orange-100 text-orange-700'
        }`}>
          {val === 'active' ? '✓ Active' : 
           val === 'inactive' ? '✕ Inactive' : 
           'TC Issued'}
        </span>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      width: '80px',
      render: (id) => (
        <button 
          onClick={() => navigate(`/students/view/${id}`)}
          className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-all hover:shadow-sm flex items-center gap-1.5"
          title="View Details"
        >
          <Eye size={16} />
          <span className="text-xs font-medium">View</span>
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Users size={32} />
              Student List
            </h1>
            <p className="text-blue-100 mt-1">View all enrolled students</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{total}</div>
            <div className="text-sm text-blue-100">Total Students</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, admission no, father name, mobile..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={classId}
            onChange={(e) => { setClassId(e.target.value); setPage(1) }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-w-[150px]"
          >
            <option value="">All Classes</option>
            {classes?.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.class_name}</option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-w-[150px]"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="tc_issued">TC Issued</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {error && (
          <div className="p-6 text-center">
            <div className="text-red-600 mb-2">Error loading students</div>
            <div className="text-sm text-gray-600">{error.message}</div>
          </div>
        )}
        
        {!error && (
          <DataTable
            columns={columns}
            data={students}
            loading={isLoading}
            emptyText="No students found"
            pagination={{ page, pageSize: 20, total }}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  )
}
