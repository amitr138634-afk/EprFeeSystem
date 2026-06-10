import { useState, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Upload, FileUp, Loader2, CheckCircle2, AlertTriangle, X, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import { academicsApi, studentApi, timetableApi } from '../../services/api'

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(l => l.trim())
  // skip header if it contains text in first column
  const dataLines = lines[0] && isNaN(lines[0].split(',')[0].trim()) ? lines.slice(1) : lines
  return dataLines.map((line, idx) => {
    const parts = line.split(',').map(p => p.trim())
    return {
      _row: idx + 1,
      admission_no: parts[0] ?? '',
      marks_obtained: parts[1] ?? '',
      grade: parts[2] ?? '',
      remarks: parts[3] ?? '',
    }
  })
}

export default function BulkMarks() {
  const fileRef = useRef(null)
  const [filters, setFilters] = useState({ class_id: '', section_id: '', exam_type_id: '', subject_id: '' })
  const [preview, setPreview] = useState(null)   // parsed rows
  const [parseError, setParseError] = useState('')
  const [fileName, setFileName] = useState('')

  const allSelected = filters.class_id && filters.section_id && filters.exam_type_id && filters.subject_id

  /* ── Lookups ──────────────────────────────────────────────────────────── */
  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => studentApi.classes().then(r => r.data.results ?? r.data),
  })

  const { data: sections = [] } = useQuery({
    queryKey: ['sections', filters.class_id],
    queryFn: () => studentApi.sections({ class_id: filters.class_id }).then(r => r.data.results ?? r.data),
    enabled: !!filters.class_id,
  })

  const { data: examTypes = [] } = useQuery({
    queryKey: ['exam-types'],
    queryFn: () => academicsApi.examTypes().then(r => r.data.results ?? r.data),
  })

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => timetableApi.subjects().then(r => r.data.results ?? r.data),
  })

  const { data: students = [] } = useQuery({
    queryKey: ['students', filters.class_id, filters.section_id],
    queryFn: () => studentApi.list({ class_id: filters.class_id, section_id: filters.section_id, status: 'active' }).then(r => r.data.results ?? r.data),
    enabled: !!(filters.class_id && filters.section_id),
  })

  /* ── File change ──────────────────────────────────────────────────────── */
  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setParseError('')
    setPreview(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const rows = parseCSV(ev.target.result)
        if (rows.length === 0) { setParseError('CSV file appears to be empty.'); return }
        setPreview(rows)
      } catch {
        setParseError('Could not parse CSV. Please check the file format.')
      }
    }
    reader.readAsText(file)
  }

  /* ── Submit ───────────────────────────────────────────────────────────── */
  const submitMut = useMutation({
    mutationFn: () => {
      // Resolve admission_no -> student_id
      const admissionMap = {}
      students.forEach(s => {
        const key = (s.admission_no ?? s.admission_number ?? '').toString().trim()
        if (key) admissionMap[key] = s.id
      })

      const marks = []
      const unknowns = []
      preview.forEach(row => {
        const sid = admissionMap[row.admission_no]
        if (!sid) { unknowns.push(row.admission_no); return }
        const mo = Number(row.marks_obtained)
        if (!isNaN(mo)) {
          marks.push({
            student_id: sid,
            marks_obtained: mo,
            grade: row.grade || '',
            remarks: row.remarks || '',
          })
        }
      })

      if (unknowns.length > 0) {
        toast.error(`Unknown admission numbers: ${unknowns.join(', ')}`, { duration: 5000 })
      }
      if (marks.length === 0) throw new Error('No valid marks rows to submit.')

      return academicsApi.bulkMarks({
        exam_type_id: Number(filters.exam_type_id),
        subject_id: Number(filters.subject_id),
        class_id: Number(filters.class_id),
        section_id: Number(filters.section_id),
        marks,
      })
    },
    onSuccess: () => {
      toast.success('Bulk marks uploaded successfully')
      setPreview(null)
      setFileName('')
      if (fileRef.current) fileRef.current.value = ''
    },
    onError: (err) => toast.error(err.message || err.response?.data?.detail || 'Upload failed'),
  })

  const selectedExamType = examTypes.find(e => String(e.id) === String(filters.exam_type_id))

  function clearFile() {
    setPreview(null)
    setFileName('')
    setParseError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Bulk Marks Upload</h1>
        <p className="page-sub">Upload marks for an entire class via CSV file.</p>
      </div>

      {/* CSV Format Instructions */}
      <div className="card p-5 border border-blue-100 bg-blue-50/50">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800 mb-2">CSV Format Instructions</p>
            <p className="text-xs text-blue-700 mb-2">
              The CSV file should have the following columns (header row is optional):
            </p>
            <div className="bg-white rounded-lg px-4 py-2 border border-blue-200 font-mono text-xs text-gray-700 mb-2">
              student_admission_no, marks_obtained, grade, remarks
            </div>
            <div className="bg-white rounded-lg px-4 py-2 border border-blue-200 font-mono text-xs text-gray-600">
              ADM001, 85, A, Good performance<br />
              ADM002, 72, B+, Satisfactory<br />
              ADM003, 91, A+, Excellent
            </div>
            <ul className="text-xs text-blue-700 mt-2 space-y-0.5 list-disc list-inside">
              <li><strong>admission_no</strong> must match exactly with student records</li>
              <li><strong>marks_obtained</strong> must be a number</li>
              <li><strong>grade</strong> and <strong>remarks</strong> are optional</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-5">
        <p className="text-sm font-semibold text-gray-700 mb-4">Step 1 — Select Class, Section, Exam Type &amp; Subject</p>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <label className="form-label">Class</label>
            <select
              className="form-select"
              value={filters.class_id}
              onChange={e => setFilters(p => ({ ...p, class_id: e.target.value, section_id: '' }))}
            >
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Section</label>
            <select
              className="form-select"
              value={filters.section_id}
              onChange={e => setFilters(p => ({ ...p, section_id: e.target.value }))}
              disabled={!filters.class_id}
            >
              <option value="">Select Section</option>
              {sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Exam Type</label>
            <select
              className="form-select"
              value={filters.exam_type_id}
              onChange={e => setFilters(p => ({ ...p, exam_type_id: e.target.value }))}
            >
              <option value="">Select Exam Type</option>
              {examTypes.map(et => <option key={et.id} value={et.id}>{et.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Subject</label>
            <select
              className="form-select"
              value={filters.subject_id}
              onChange={e => setFilters(p => ({ ...p, subject_id: e.target.value }))}
            >
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        {selectedExamType && (
          <p className="text-xs text-gray-500 mt-3">
            Max Marks: <strong>{selectedExamType.max_marks}</strong> &nbsp;|&nbsp;
            Passing Marks: <strong>{selectedExamType.passing_marks}</strong>
          </p>
        )}
      </div>

      {/* File Upload */}
      <div className="card p-5">
        <p className="text-sm font-semibold text-gray-700 mb-4">Step 2 — Upload CSV File</p>
        {!fileName ? (
          <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl py-10 cursor-pointer transition-colors ${allSelected ? 'border-blue-300 hover:border-blue-400 hover:bg-blue-50/50' : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'}`}>
            <FileUp size={32} className="text-blue-400 mb-2" />
            <span className="text-sm font-medium text-gray-700">Click to choose CSV file</span>
            <span className="text-xs text-gray-400 mt-1">or drag and drop</span>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              disabled={!allSelected}
              onChange={handleFile}
            />
          </label>
        ) : (
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <Upload size={18} className="text-green-500 shrink-0" />
            <span className="text-sm text-gray-700 flex-1">{fileName}</span>
            <button onClick={clearFile} className="p-1 hover:bg-gray-200 rounded text-gray-400">
              <X size={14} />
            </button>
          </div>
        )}

        {parseError && (
          <div className="flex items-center gap-2 mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertTriangle size={14} className="shrink-0" /> {parseError}
          </div>
        )}

        {!allSelected && !fileName && (
          <p className="text-xs text-gray-400 mt-2">Please select all filters above before uploading.</p>
        )}
      </div>

      {/* Preview */}
      {preview && preview.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <p className="text-sm font-semibold text-gray-700">Step 3 — Preview &amp; Submit</p>
              <p className="text-xs text-gray-400 mt-0.5">{preview.length} rows parsed from CSV</p>
            </div>
            <button
              onClick={() => submitMut.mutate()}
              disabled={submitMut.isPending}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {submitMut.isPending
                ? <><Loader2 size={14} className="animate-spin" /> Uploading…</>
                : <><CheckCircle2 size={14} /> Submit Marks</>
              }
            </button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Row</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Admission No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Marks Obtained</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Grade</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.map(row => (
                  <tr key={row._row} className={`hover:bg-gray-50 ${!row.admission_no || isNaN(Number(row.marks_obtained)) ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-2 text-xs text-gray-400">{row._row}</td>
                    <td className="px-4 py-2 text-sm font-mono text-gray-800">{row.admission_no || <span className="text-red-400 italic">missing</span>}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {row.marks_obtained !== '' && !isNaN(Number(row.marks_obtained))
                        ? row.marks_obtained
                        : <span className="text-red-400 italic">invalid</span>
                      }
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">{row.grade || '—'}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{row.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
