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
      <footer className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <p className="text-sm text-gray-600">
            © 2026 Shyam Enterprise. All rights reserved.
          </p>
          <SessionSelector />
        </div>
      </footer>
    </div>
  )
}
