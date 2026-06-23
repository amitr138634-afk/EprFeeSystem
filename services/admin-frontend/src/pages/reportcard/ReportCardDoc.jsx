import { GraduationCap } from 'lucide-react'

/**
 * Presentational, print-friendly report card.
 * Accepts a `report` row (from /academics/report-card/ or /academics/results/),
 * the `exam` meta, class/section labels, and an optional grade scale legend.
 */
const SIGNATURE_LABELS = { class_teacher: 'Class Teacher', examination_ic: 'Examination IC', principal: 'Principal' }

export default function ReportCardDoc({ report, exam, className, sectionName, gradeScale = [], signatures = [], schoolName = 'Shyam ERP School' }) {
  if (!report) return null
  const cls = report.class_name || className || ''
  const sec = report.section_name || sectionName || ''

  return (
    <div className="report-card bg-white border border-gray-300 rounded-lg p-6 print:border-0 print:rounded-none">
      {/* School header */}
      <div className="flex items-center justify-center gap-3 border-b-2 border-gray-800 pb-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
          <GraduationCap size={22} className="text-white" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900 leading-none">{schoolName}</h2>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
            Report Card · {exam?.name} {exam?.session_year ? `(${exam.session_year})` : ''}
          </p>
        </div>
      </div>

      {/* Student meta */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-y-1 gap-x-4 text-sm mb-4">
        <Meta label="Name" value={report.name} />
        <Meta label="Admission No" value={report.admission_no} />
        <Meta label="Roll No" value={report.roll_no || '—'} />
        <Meta label="Class" value={`${cls}${sec ? ' - ' + sec : ''}`} />
        {report.father_name && <Meta label="Father" value={report.father_name} />}
        {report.mother_name && <Meta label="Mother" value={report.mother_name} />}
      </div>

      {/* Marks table */}
      <table className="w-full border border-gray-300 text-sm mb-4">
        <thead>
          <tr className="bg-gray-100 text-gray-700">
            <th className="border border-gray-300 px-3 py-1.5 text-left">Subject</th>
            <th className="border border-gray-300 px-3 py-1.5 text-center">Max</th>
            <th className="border border-gray-300 px-3 py-1.5 text-center">Obtained</th>
            <th className="border border-gray-300 px-3 py-1.5 text-center">Grade</th>
          </tr>
        </thead>
        <tbody>
          {report.subjects.map((s, i) => (
            <tr key={s.subject_id ?? i}>
              <td className="border border-gray-300 px-3 py-1.5">{s.subject}</td>
              <td className="border border-gray-300 px-3 py-1.5 text-center">{s.max_marks}</td>
              <td className="border border-gray-300 px-3 py-1.5 text-center">
                {s.is_absent ? <span className="text-red-500">AB</span> : (s.obtained ?? '—')}
              </td>
              <td className="border border-gray-300 px-3 py-1.5 text-center">{s.grade || '—'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 font-semibold">
            <td className="border border-gray-300 px-3 py-1.5 text-right">Total</td>
            <td className="border border-gray-300 px-3 py-1.5 text-center">{report.total_max}</td>
            <td className="border border-gray-300 px-3 py-1.5 text-center">{report.total_obtained}</td>
            <td className="border border-gray-300 px-3 py-1.5 text-center">{report.grade || '—'}</td>
          </tr>
        </tfoot>
      </table>

      {/* Summary */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm mb-5">
        <span><strong>Percentage:</strong> {report.percentage}%</span>
        <span><strong>Overall Grade:</strong> {report.grade || '—'}</span>
        <span>
          <strong>Result:</strong>{' '}
          <span className={report.result === 'Pass' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
            {report.result}
          </span>
        </span>
      </div>

      {/* Grade scale legend */}
      {gradeScale.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Grading Scale</p>
          <div className="flex flex-wrap gap-2 text-xs text-gray-600">
            {gradeScale.map(g => (
              <span key={g.id} className="px-2 py-0.5 border border-gray-200 rounded">
                {g.grade}: {g.min_percent}–{g.max_percent}%
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Signatures — printed from Signature Master; falls back to a plain
          label if no active signature has been configured for this slot. */}
      <div className="flex justify-between pt-8 text-xs text-gray-500">
        {['class_teacher', 'examination_ic', 'principal'].map(designation => {
          const sig = signatures.find(s => s.designation === designation)
          const imgSrc = sig?.processed_image || sig?.original_image
          return (
            <div key={designation} className="flex flex-col items-center">
              <div className="h-12 flex items-end justify-center mb-1">
                {imgSrc && <img src={imgSrc} alt={SIGNATURE_LABELS[designation]} className="h-12 object-contain" />}
              </div>
              <span className="border-t border-gray-400 pt-1 px-6">{SIGNATURE_LABELS[designation]}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Meta({ label, value }) {
  return (
    <div>
      <span className="text-gray-400">{label}: </span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  )
}
