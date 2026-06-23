import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Edit2, Trash2, Check, X, Loader2, AlertTriangle, PenLine,
  ToggleLeft, ToggleRight, Upload, Wand2, RotateCcw, Eye,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { academicsApi, studentsApi } from '../../services/api'

const listOf = (r) => r.data.results || r.data

const DESIGNATIONS = [
  { value: 'principal', label: 'Principal' },
  { value: 'examination_ic', label: 'Examination IC' },
]

// A plain brightness cutoff only catches white/near-white paper — a yellow,
// cream or tan background can be just as "light" to the eye but have a much
// lower average brightness (its blue channel pulls the average down), so it
// would never cross a brightness threshold. Instead, sample the actual
// background color from the four corners (signature ink should never be
// right at the very edges of a sensibly cropped image) and remove any pixel
// close to that color, regardless of what color it happens to be.
const BG_DISTANCE_THRESHOLD = 45  // color distance below this = background, removed
const BG_DISTANCE_FEATHER = 30    // soft fade band just above the threshold

function sampleBackgroundColor(ctx, w, h) {
  const patch = Math.max(1, Math.min(6, Math.floor(Math.min(w, h) / 4)))
  const corners = [[0, 0], [w - patch, 0], [0, h - patch], [w - patch, h - patch]]
  let r = 0, g = 0, b = 0, n = 0
  for (const [cx, cy] of corners) {
    const data = ctx.getImageData(Math.max(0, cx), Math.max(0, cy), patch, patch).data
    for (let i = 0; i < data.length; i += 4) {
      r += data[i]; g += data[i + 1]; b += data[i + 2]; n++
    }
  }
  return { r: r / n, g: g / n, b: b / n }
}

function removeBackground(ctx, w, h) {
  const bg = sampleBackgroundColor(ctx, w, h)
  const imageData = ctx.getImageData(0, 0, w, h)
  const d = imageData.data
  for (let i = 0; i < d.length; i += 4) {
    const dr = d[i] - bg.r, dg = d[i + 1] - bg.g, db = d[i + 2] - bg.b
    const dist = Math.sqrt(dr * dr + dg * dg + db * db)
    if (dist <= BG_DISTANCE_THRESHOLD) {
      d[i + 3] = 0
    } else if (dist <= BG_DISTANCE_THRESHOLD + BG_DISTANCE_FEATHER) {
      const t = (dist - BG_DISTANCE_THRESHOLD) / BG_DISTANCE_FEATHER
      d[i + 3] = Math.round(d[i + 3] * t)
    }
  }
  ctx.putImageData(imageData, 0, 0)
}

function DeleteConfirm({ label, onConfirm, onCancel, isPending }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
      <AlertTriangle size={14} className="text-red-500 shrink-0" />
      <span className="text-xs text-red-700">Delete <strong>{label}</strong>?</span>
      <button
        onClick={onConfirm}
        disabled={isPending}
        className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded disabled:opacity-50"
      >
        {isPending ? <Loader2 size={11} className="animate-spin" /> : 'Yes'}
      </button>
      <button onClick={onCancel} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
    </div>
  )
}

/* ── Crop + background-removal editor (entirely client-side via canvas) ── */
function SignatureEditor({ onProcessed }) {
  const canvasRef = useRef(null)
  const imgRef = useRef(null)
  const [hasImage, setHasImage] = useState(false)
  const [selection, setSelection] = useState(null) // {x,y,w,h} in canvas pixel space
  const dragRef = useRef(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  function redrawBase() {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  }

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      imgRef.current = img
      setSelection(null)
      setPreviewUrl(null)
      onProcessed(null, file)
      redrawBase()
      setHasImage(true)
    }
    img.src = URL.createObjectURL(file)
  }

  function canvasPoint(e) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  function onMouseDown(e) {
    if (!hasImage) return
    dragRef.current = canvasPoint(e)
    setSelection(null)
  }

  function onMouseMove(e) {
    if (!dragRef.current || !hasImage) return
    const cur = canvasPoint(e)
    const start = dragRef.current
    const rect = {
      x: Math.min(start.x, cur.x), y: Math.min(start.y, cur.y),
      w: Math.abs(cur.x - start.x), h: Math.abs(cur.y - start.y),
    }
    setSelection(rect)
    redrawBase()
    const ctx = canvasRef.current.getContext('2d')
    ctx.strokeStyle = '#2563eb'
    ctx.lineWidth = Math.max(2, canvasRef.current.width / 200)
    ctx.setLineDash([8, 6])
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h)
  }

  function onMouseUp() {
    dragRef.current = null
  }

  function resetSelection() {
    setSelection(null)
    redrawBase()
  }

  function applyCropAndRemoveBackground() {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return
    const sel = (selection && selection.w > 4 && selection.h > 4)
      ? selection
      : { x: 0, y: 0, w: canvas.width, h: canvas.height }

    const out = document.createElement('canvas')
    out.width = Math.round(sel.w)
    out.height = Math.round(sel.h)
    const ctx = out.getContext('2d')
    // sel is in canvas-pixel space, which already equals the image's
    // natural pixel space (canvas.width/height = img.naturalWidth/Height).
    ctx.drawImage(img, sel.x, sel.y, sel.w, sel.h, 0, 0, out.width, out.height)
    removeBackground(ctx, out.width, out.height)

    setPreviewUrl(out.toDataURL('image/png'))
    out.toBlob((blob) => {
      const processedFile = new File([blob], 'signature_processed.png', { type: 'image/png' })
      onProcessed(processedFile)
    }, 'image/png')
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="form-label">Upload Signature Image <span className="text-red-500">*</span></label>
        <input type="file" accept="image/*" onChange={handleFile} className="form-input" />
      </div>

      {/* Canvas stays mounted at all times so canvasRef is never null when an
          image finishes loading — only its visibility is toggled. */}
      <div style={{ display: hasImage ? 'block' : 'none' }}>
        <p className="text-xs text-gray-400 mb-1.5">
          Drag on the image to select the exact signature area (optional — skip to use the whole image), then click Apply.
        </p>
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 inline-block">
          <canvas
            ref={canvasRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            className="max-w-full cursor-crosshair"
            style={{ width: '100%', maxWidth: 420, display: 'block' }}
          />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <button type="button" onClick={resetSelection} className="btn-secondary flex items-center gap-1.5 text-xs py-1.5">
            <RotateCcw size={12} /> Reset Selection
          </button>
          <button type="button" onClick={applyCropAndRemoveBackground} className="btn-primary flex items-center gap-1.5 text-xs py-1.5">
            <Wand2 size={12} /> Crop & Remove Background
          </button>
        </div>
      </div>

      {previewUrl && (
        <div>
          <p className="form-label flex items-center gap-1.5"><Eye size={12} /> Preview (this is what prints on the report card)</p>
          <div className="border border-gray-200 rounded-lg p-3 bg-[repeating-conic-gradient(#f3f4f6_0%_25%,white_0%_50%)] bg-[length:16px_16px] inline-block">
            <img src={previewUrl} alt="Processed signature preview" className="max-h-20" />
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Add/Edit form ───────────────────────────────────────────────────────── */
function SignatureForm({ designation, editing, onDone }) {
  const qc = useQueryClient()
  const [classId, setClassId] = useState(editing?.class_ref ? String(editing.class_ref) : '')
  const [sectionId, setSectionId] = useState(editing?.section ? String(editing.section) : '')
  const [isActive, setIsActive] = useState(editing ? editing.is_active : true)
  const [originalFile, setOriginalFile] = useState(null)
  const [processedFile, setProcessedFile] = useState(null)

  const isClassTeacher = designation === 'class_teacher'

  const { data: classes = [] } = useQuery({
    queryKey: ['classMasters'],
    queryFn: () => studentsApi.classMasters().then(listOf),
    enabled: isClassTeacher,
  })
  const { data: sections = [] } = useQuery({
    queryKey: ['sectionMasters', classId],
    queryFn: () => studentsApi.sectionMasters({ class_id: classId }).then(listOf),
    enabled: isClassTeacher && !!classId,
  })
  const { data: lookup } = useQuery({
    queryKey: ['classTeacherLookup', classId, sectionId],
    queryFn: () => academicsApi.classTeacherLookup({ class_id: classId, section_id: sectionId }).then(r => r.data),
    enabled: isClassTeacher && !!classId && !!sectionId,
  })

  const saveMut = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('designation', designation)
      fd.append('is_active', isActive ? 'true' : 'false')
      if (isClassTeacher) {
        fd.append('class_ref', classId)
        fd.append('section', sectionId)
      }
      if (originalFile) fd.append('original_image', originalFile)
      if (processedFile) fd.append('processed_image', processedFile)
      return editing
        ? academicsApi.updateSignature(editing.id, fd)
        : academicsApi.createSignature(fd)
    },
    onSuccess: () => {
      qc.invalidateQueries(['signatures'])
      toast.success(editing ? 'Signature updated' : 'Signature saved')
      onDone()
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to save signature'),
  })

  const canSave = isClassTeacher
    ? !!classId && !!sectionId && (editing ? true : !!processedFile)
    : (editing ? true : !!processedFile)

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        {editing ? 'Edit' : 'Add'} {DESIGNATIONS.find(d => d.value === designation)?.label || 'Class Teacher'} Signature
      </h3>

      {isClassTeacher && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="form-label">Class <span className="text-red-500">*</span></label>
            <select
              className="form-select"
              value={classId}
              disabled={!!editing}
              onChange={e => { setClassId(e.target.value); setSectionId('') }}
            >
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Section <span className="text-red-500">*</span></label>
            <select
              className="form-select"
              value={sectionId}
              disabled={!!editing || !classId}
              onChange={e => setSectionId(e.target.value)}
            >
              <option value="">Select Section</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.section_name}</option>)}
            </select>
          </div>
          {classId && sectionId && (
            <div className="col-span-2 -mt-1">
              <p className="text-xs text-gray-500">
                Class Teacher: <span className="font-semibold text-gray-700">
                  {lookup ? (lookup.person_name || 'No class teacher assigned to this class+section yet') : '...'}
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      {editing && (
        <p className="text-xs text-gray-400 mb-4">Leave the upload empty to keep the existing signature image and only change Active status.</p>
      )}

      <SignatureEditor onProcessed={(processed, original) => {
        if (original) setOriginalFile(original)
        setProcessedFile(processed)
      }} />

      <div className="flex items-center gap-6 mt-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={e => setIsActive(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm text-gray-700">Active on report cards</span>
        </label>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => saveMut.mutate()}
          disabled={!canSave || saveMut.isPending}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          {saveMut.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Check size={14} /> Save Signature</>}
        </button>
        <button onClick={onDone} className="btn-secondary">Cancel</button>
      </div>
    </div>
  )
}

/* ── Singleton card (Principal / Examination IC) ────────────────────────── */
function SingletonCard({ designation, label, record, onAdd, onEdit }) {
  const qc = useQueryClient()
  const [confirming, setConfirming] = useState(false)

  const toggleMut = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('is_active', record.is_active ? 'false' : 'true')
      return academicsApi.updateSignature(record.id, fd)
    },
    onSuccess: () => qc.invalidateQueries(['signatures']),
  })

  const deleteMut = useMutation({
    mutationFn: () => academicsApi.deleteSignature(record.id),
    onSuccess: () => { qc.invalidateQueries(['signatures']); toast.success('Signature deleted') },
    onError: () => toast.error('Failed to delete signature'),
  })

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
        {record ? (
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(record)} className="p-1.5 hover:bg-blue-50 rounded text-blue-500">
              <Edit2 size={14} />
            </button>
            <button onClick={() => setConfirming(true)} className="p-1.5 hover:bg-red-50 rounded text-red-400">
              <Trash2 size={14} />
            </button>
          </div>
        ) : (
          <button onClick={() => onAdd(designation)} className="btn-primary text-xs py-1.5 flex items-center gap-1.5">
            <Plus size={13} /> Add {label}
          </button>
        )}
      </div>

      {confirming && (
        <div className="mt-3">
          <DeleteConfirm
            label={label}
            onConfirm={() => { deleteMut.mutate(); setConfirming(false) }}
            onCancel={() => setConfirming(false)}
            isPending={deleteMut.isPending}
          />
        </div>
      )}

      {record && (
        <div className="mt-3 flex items-center gap-4">
          <img
            src={record.processed_image || record.original_image}
            alt={label}
            className="h-16 border border-gray-100 rounded bg-[repeating-conic-gradient(#f3f4f6_0%_25%,white_0%_50%)] bg-[length:14px_14px] p-1"
          />
          <button onClick={() => toggleMut.mutate()} className="inline-flex items-center gap-1.5 text-xs">
            {record.is_active
              ? <><ToggleRight size={20} className="text-green-500" /><span className="badge badge-green">Active</span></>
              : <><ToggleLeft size={20} className="text-gray-400" /><span className="badge badge-gray">Inactive</span></>
            }
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Class Teacher rows table ────────────────────────────────────────────── */
function ClassTeacherRow({ rec, onEdit }) {
  const qc = useQueryClient()
  const [confirming, setConfirming] = useState(false)

  const toggleMut = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('is_active', rec.is_active ? 'false' : 'true')
      return academicsApi.updateSignature(rec.id, fd)
    },
    onSuccess: () => qc.invalidateQueries(['signatures']),
  })

  const deleteMut = useMutation({
    mutationFn: () => academicsApi.deleteSignature(rec.id),
    onSuccess: () => { qc.invalidateQueries(['signatures']); toast.success('Signature deleted') },
    onError: () => toast.error('Failed to delete signature'),
  })

  return (
    <tr className="hover:bg-gray-50 group">
      <td className="px-4 py-3 text-sm font-medium text-gray-800">{rec.class_name}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{rec.section_name}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{rec.person_name || <span className="text-gray-400">Not assigned</span>}</td>
      <td className="px-4 py-3">
        <img
          src={rec.processed_image || rec.original_image}
          alt="signature"
          className="h-10 border border-gray-100 rounded bg-[repeating-conic-gradient(#f3f4f6_0%_25%,white_0%_50%)] bg-[length:12px_12px] p-0.5"
        />
      </td>
      <td className="px-4 py-3 text-center">
        <button onClick={() => toggleMut.mutate()} className="inline-flex items-center gap-1.5 text-xs">
          {rec.is_active
            ? <><ToggleRight size={20} className="text-green-500" /><span className="badge badge-green">Active</span></>
            : <><ToggleLeft size={20} className="text-gray-400" /><span className="badge badge-gray">Inactive</span></>
          }
        </button>
      </td>
      <td className="px-4 py-3">
        {confirming ? (
          <DeleteConfirm
            label={`${rec.class_name}-${rec.section_name}`}
            onConfirm={() => { deleteMut.mutate(); setConfirming(false) }}
            onCancel={() => setConfirming(false)}
            isPending={deleteMut.isPending}
          />
        ) : (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(rec)} className="p-1.5 hover:bg-blue-50 rounded text-blue-500">
              <Edit2 size={14} />
            </button>
            <button onClick={() => setConfirming(true)} className="p-1.5 hover:bg-red-50 rounded text-red-400">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

export default function SignatureMaster() {
  const [formState, setFormState] = useState(null) // { designation, editing } | null

  const { data: signatures = [], isLoading } = useQuery({
    queryKey: ['signatures'],
    queryFn: () => academicsApi.signatures().then(listOf),
  })

  const principal = signatures.find(s => s.designation === 'principal')
  const examIc = signatures.find(s => s.designation === 'examination_ic')
  const classTeachers = signatures.filter(s => s.designation === 'class_teacher')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Signature Master</h1>
          <p className="page-sub">Upload signatures for Principal, Examination IC and Class Teachers — printed automatically on report cards.</p>
        </div>
      </div>

      {formState ? (
        <SignatureForm
          designation={formState.designation}
          editing={formState.editing}
          onDone={() => setFormState(null)}
        />
      ) : isLoading ? (
        <div className="card p-12 text-center text-sm text-gray-400">Loading…</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SingletonCard
              designation="principal" label="Principal" record={principal}
              onAdd={(d) => setFormState({ designation: d, editing: null })}
              onEdit={(rec) => setFormState({ designation: rec.designation, editing: rec })}
            />
            <SingletonCard
              designation="examination_ic" label="Examination IC" record={examIc}
              onAdd={(d) => setFormState({ designation: d, editing: null })}
              onEdit={(rec) => setFormState({ designation: rec.designation, editing: rec })}
            />
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Class Teacher Signatures</h3>
              <button
                onClick={() => setFormState({ designation: 'class_teacher', editing: null })}
                className="btn-primary text-xs py-1.5 flex items-center gap-1.5"
              >
                <Plus size={13} /> Add Class Teacher Signature
              </button>
            </div>

            {classTeachers.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <PenLine size={28} className="text-indigo-500" />
                </div>
                <h3 className="font-semibold text-gray-700 mb-1">No class teacher signatures configured</h3>
                <p className="text-sm text-gray-400">Add a signature for each class+section — the teacher's name is fetched automatically from the Staff module.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Class</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Section</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Class Teacher</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Signature</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {classTeachers.map(rec => (
                      <ClassTeacherRow
                        key={rec.id}
                        rec={rec}
                        onEdit={(r) => setFormState({ designation: r.designation, editing: r })}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
