import { Clock } from 'lucide-react'

export default function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-5 animate-pulse">
        <Clock size={36} className="text-blue-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">{title || 'Coming Soon'}</h2>
      <p className="text-gray-400 text-sm max-w-xs">This feature is under development and will be available soon.</p>
    </div>
  )
}
