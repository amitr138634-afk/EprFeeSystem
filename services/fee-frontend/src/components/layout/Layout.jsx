import { Outlet } from 'react-router-dom'
import TopNav from './TopNav'
import SessionSelector from '../SessionSelector'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopNav />
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 bg-white py-3 px-4 sm:px-6">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-gray-500">
            © 2026 Shyam ERP Services · Fee Panel
          </p>
          <SessionSelector />
        </div>
      </footer>
    </div>
  )
}
