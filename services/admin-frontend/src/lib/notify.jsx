import toast from 'react-hot-toast'
import { X, AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react'

/**
 * App-wide alert popups built on react-hot-toast.
 * Each alert is a dismissible card with an icon, a title, a message and a
 * cross (X) button. Use `notify.error(msg)`, `notify.success(msg)`, etc.
 *
 * The <Toaster /> is already mounted once in main.jsx.
 */

const VARIANTS = {
  error:   { Icon: AlertCircle,   bar: 'bg-red-500',    iconBg: 'bg-red-50',    iconColor: 'text-red-600',    ring: 'border-red-100' },
  success: { Icon: CheckCircle2,  bar: 'bg-green-500',  iconBg: 'bg-green-50',  iconColor: 'text-green-600',  ring: 'border-green-100' },
  warning: { Icon: AlertTriangle, bar: 'bg-amber-500',  iconBg: 'bg-amber-50',  iconColor: 'text-amber-600',  ring: 'border-amber-100' },
  info:    { Icon: Info,          bar: 'bg-blue-500',   iconBg: 'bg-blue-50',   iconColor: 'text-blue-600',   ring: 'border-blue-100' },
}

const DEFAULT_TITLES = { error: 'Something went wrong', success: 'Success', warning: 'Heads up', info: 'Notice' }
const DEFAULT_DURATION = { error: 6000, success: 3500, warning: 5000, info: 4000 }

function AlertCard({ t, type, title, message }) {
  const v = VARIANTS[type] || VARIANTS.info
  const { Icon } = v
  return (
    <div
      role="alert"
      className={`${t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
        transition-all duration-300 ease-out pointer-events-auto
        w-full max-w-sm bg-white rounded-xl shadow-lg border ${v.ring} flex overflow-hidden`}
    >
      <div className={`w-1.5 shrink-0 ${v.bar}`} />
      <div className="flex items-start gap-3 p-3.5 flex-1 min-w-0">
        <div className={`w-8 h-8 rounded-lg ${v.iconBg} flex items-center justify-center shrink-0`}>
          <Icon size={18} className={v.iconColor} />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-sm font-semibold text-gray-900">{title || DEFAULT_TITLES[type]}</p>
          {message && <p className="text-sm text-gray-600 mt-0.5 break-words leading-snug">{message}</p>}
        </div>
        <button
          type="button"
          onClick={() => toast.dismiss(t.id)}
          aria-label="Dismiss"
          className="shrink-0 -mt-1 -mr-1 p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

function show(type, message, opts = {}) {
  const { title, id, duration } = opts
  return toast.custom(
    (t) => <AlertCard t={t} type={type} title={title} message={message} />,
    {
      // Dedupe identical errors so a burst of failed calls collapses into one card.
      id: id ?? (type === 'error' ? `error:${message}` : undefined),
      duration: duration ?? DEFAULT_DURATION[type],
    },
  )
}

export const notify = {
  error:   (message, opts) => show('error', message, opts),
  success: (message, opts) => show('success', message, opts),
  warning: (message, opts) => show('warning', message, opts),
  info:    (message, opts) => show('info', message, opts),
  dismiss: (id) => toast.dismiss(id),
}

/**
 * Turn an axios error into a human-friendly message.
 * Handles DRF shapes: {detail: "..."} | {detail: ["..."]} | {field: ["msg"]} | "string".
 */
export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.code === 'ERR_CANCELED') return null
  if (!error?.response) {
    return 'Network error — unable to reach the server. Please check your connection.'
  }
  const { status, data } = error.response
  if (data) {
    if (typeof data === 'string') return data
    const detail = Array.isArray(data.detail) ? data.detail[0] : data.detail
    if (detail) return detail
    // First field error, e.g. {"name": ["This field is required."]}
    const firstKey = Object.keys(data).find((k) => k !== 'code')
    if (firstKey) {
      const val = data[firstKey]
      const msg = Array.isArray(val) ? val[0] : (typeof val === 'string' ? val : null)
      if (msg) {
        const label = firstKey === 'non_field_errors' ? '' : `${firstKey.replace(/_/g, ' ')}: `
        return `${label}${msg}`
      }
    }
  }
  const byStatus = {
    400: 'Invalid request — please check your input and try again.',
    403: 'You don’t have permission to perform this action.',
    404: 'The requested item could not be found.',
    409: 'This action conflicts with the current data.',
    500: 'Server error — please try again in a moment.',
    502: 'The server is unreachable right now. Please try again.',
    503: 'Service temporarily unavailable. Please try again.',
  }
  return byStatus[status] || fallback
}

export default notify
