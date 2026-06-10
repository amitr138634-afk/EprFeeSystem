import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import {
  Plus, Search, Eye, Edit, Trash2, X, Upload, Download,
  FileSpreadsheet, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import DataTable from '../../components/common/DataTable'
import { studentApi } from '../../services/api'

/* ── Add Student Modal ──────────────────────────────────────────────────── */
function AddStudentModal({ onClose, onCreated }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const selectedClass = watch('class_ref')

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => studentApi.classes().then(r => r.data.results || r.data),
  })

  const { data: sections } = useQuery({
    queryKey: ['sections', selectedClass],
    queryFn: () => studentApi.sections({ class_id: selectedClass }).then(r => r.data.results || r.data),
    enabled: !!selectedClass,
  })

  const mutation = useMutation({
    mutationFn: (data) => studentApi.create(data),
    onSuccess: () => { toast.success('Student added successfully'); onCreated() },
    onError: (err) => {
      const d = err.response?.data
      const msg = d?.detail || (typeof d === 'object' ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join(' | ') : 'Failed to add student')
      toast.error(msg)
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Add New Student</h2>
            <p className="text-xs text-gray-400">Fill in student details</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit(mutation.mutate)} className="p-6 space-y-5">
          {/* Basic Info */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3 pb-1 border-b border-gray-100">Basic Information</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Admission No <span className="text-red-500">*</span></label>
                <input className="form-input" placeholder="ADM001" {...register('admission_no', { required: 'Required' })} />
                {errors.admission_no && <p className="text-red-500 text-xs mt-1">{errors.admission_no.message}</p>}
              </div>
              <div>
                <label className="form-label">Roll No</label>
                <input className="form-input" {...register('roll_no')} />
              </div>
              <div>
                <label className="form-label">First Name <span className="text-red-500">*</span></label>
                <input className="form-input" {...register('first_name', { required: 'Required' })} />
                {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
              </div>
              <div>
                <label className="form-label">Last Name</label>
                <input className="form-input" {...register('last_name')} />
              </div>
              <div>
                <label className="form-label">Date of Birth <span className="text-red-500">*</span></label>
                <input type="date" className="form-input" {...register('date_of_birth', { required: 'Required' })} />
                {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth.message}</p>}
              </div>
              <div>
                <label className="form-label">Gender <span className="text-red-500">*</span></label>
                <select className="form-input" {...register('gender', { required: 'Required' })}>
                  <option value="">Select</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
                {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>}
              </div>
              <div>
                <label className="form-label">Category</label>
                <select className="form-input" {...register('category')}>
                  {['GEN', 'OBC', 'SC', 'ST', 'EWS'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Blood Group</label>
                <input className="form-input" placeholder="A+" {...register('blood_group')} />
              </div>
            </div>
          </div>

          {/* Academic */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3 pb-1 border-b border-gray-100">Academic Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Class <span className="text-red-500">*</span></label>
                <select className="form-input" {...register('class_ref', { required: 'Required' })}>
                  <option value="">Select Class</option>
                  {(classes || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.class_ref && <p className="text-red-500 text-xs mt-1">{errors.class_ref.message}</p>}
              </div>
              <div>
                <label className="form-label">Section</label>
                <select className="form-input" {...register('section')}>
                  <option value="">Select Section</option>
                  {(sections || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Session Year <span className="text-red-500">*</span></label>
                <input className="form-input" placeholder="2024-25" {...register('session_year', { required: 'Required' })} />
                {errors.session_year && <p className="text-red-500 text-xs mt-1">{errors.session_year.message}</p>}
              </div>
              <div>
                <label className="form-label">Admission Date <span className="text-red-500">*</span></label>
                <input type="date" className="form-input" {...register('admission_date', { required: 'Required' })} />
                {errors.admission_date && <p className="text-red-500 text-xs mt-1">{errors.admission_date.message}</p>}
              </div>
            </div>
          </div>

          {/* Parent Info */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3 pb-1 border-b border-gray-100">Parent / Guardian</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Father's Name <span className="text-red-500">*</span></label>
                <input className="form-input" {...register('father_name', { required: 'Required' })} />
                {errors.father_name && <p className="text-red-500 text-xs mt-1">{errors.father_name.message}</p>}
              </div>
              <div>
                <label className="form-label">Father's Phone <span className="text-red-500">*</span></label>
                <input className="form-input" {...register('father_phone', { required: 'Required' })} />
                {errors.father_phone && <p className="text-red-500 text-xs mt-1">{errors.father_phone.message}</p>}
              </div>
              <div>
                <label className="form-label">Mother's Name</label>
                <input className="form-input" {...register('mother_name')} />
              </div>
              <div>
                <label className="form-label">Mother's Phone</label>
                <input className="form-input" {...register('mother_phone')} />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3 pb-1 border-b border-gray-100">Address</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="form-label">Address <span className="text-red-500">*</span></label>
                <input className="form-input" {...register('address', { required: 'Required' })} />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
              </div>
              <div>
                <label className="form-label">City</label>
                <input className="form-input" {...register('city')} />
              </div>
              <div>
                <label className="form-label">State</label>
                <input className="form-input" {...register('state')} />
              </div>
              <div>
                <label className="form-label">Pincode</label>
                <input className="form-input" {...register('pincode')} />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex items-center gap-2">
              {mutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Add Student'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Excel Import Modal ─────────────────────────────────────────────────── */
function ImportModal({ onClose, onImported }) {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const downloadTemplate = async () => {
    try {
      const res = await studentApi.importTemplate()
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'student_import_template.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to download template')
    }
  }

  const importMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('file', file)
      return studentApi.bulkImport(fd)
    },
    onSuccess: (res) => {
      setResult(res.data)
      if (res.data.created > 0) onImported()
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Import failed'),
  })

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
              <FileSpreadsheet size={18} className="text-green-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Import from Excel</h2>
              <p className="text-xs text-gray-400">Bulk upload students via .xlsx file</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Download template */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div>
              <p className="text-sm font-semibold text-blue-800">Step 1 — Download Template</p>
              <p className="text-xs text-blue-600 mt-0.5">Fill in the Excel template and upload it back</p>
            </div>
            <button onClick={downloadTemplate} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
              <Download size={13} /> Template
            </button>
          </div>

          {/* File drop zone */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Step 2 — Upload Filled File</p>
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                dragging ? 'border-blue-500 bg-blue-50' : file ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
              }`}
            >
              <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => setFile(e.target.files[0])} />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileSpreadsheet size={30} className="text-green-500" />
                  <p className="text-sm font-semibold text-green-700">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <Upload size={30} />
                  <p className="text-sm font-medium">Drop .xlsx file here or click to browse</p>
                </div>
              )}
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className={`p-4 rounded-xl ${result.errors?.length > 0 ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={16} className="text-green-600" />
                <p className="text-sm font-semibold text-green-800">{result.created} student(s) imported successfully</p>
              </div>
              {result.errors?.length > 0 && (
                <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                  <p className="text-xs font-semibold text-orange-700 flex items-center gap-1">
                    <AlertCircle size={13} /> {result.errors.length} row(s) had errors:
                  </p>
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-orange-700 bg-orange-100 rounded px-2 py-1">
                      Row {e.row}: {e.error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => importMutation.mutate()}
              disabled={!file || importMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors"
            >
              {importMutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Importing…</> : <><Upload size={14} /> Import Students</>}
            </button>
            <button onClick={onClose} className="btn-secondary">Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Main Page ──────────────────────────────────────────────────────────── */
export default function StudentList() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [classId, setClassId] = useState('')
  const [page, setPage] = useState(1)
  const [showAdd, setShowAdd] = useState(false)
  const [showImport, setShowImport] = useState(false)

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

  const refreshStudents = () => {
    qc.invalidateQueries(['students'])
    setShowAdd(false)
    setShowImport(false)
  }

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
        }`}>{val}</span>
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
          >
            <FileSpreadsheet size={15} /> Import Excel
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> Add Student
          </button>
        </div>
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

      {showAdd && <AddStudentModal onClose={() => setShowAdd(false)} onCreated={refreshStudents} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onImported={refreshStudents} />}
    </div>
  )
}
