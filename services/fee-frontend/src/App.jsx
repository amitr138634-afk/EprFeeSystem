import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import Dashboard from './pages/Dashboard'
import FeeHeads from './pages/fees/FeeHeads'
import FeeStructure from './pages/fees/FeeStructure'
import PayFee from './pages/fees/PayFee'
import ReceiptHistory from './pages/fees/ReceiptHistory'
import DailyCollection from './pages/fees/DailyCollection'
import FeeDefaulters from './pages/fees/FeeDefaulters'
import BookSets from './pages/fees/BookSets'
import Uniforms from './pages/fees/Uniforms'
import VehicleList from './pages/transport/VehicleList'
import RouteList from './pages/transport/RouteList'
import TransportStudents from './pages/transport/TransportStudents'
import AdmissionList from './pages/students/AdmissionList'
import VisitorList from './pages/frontdesk/VisitorList'
import Feedbacks from './pages/frontdesk/Feedbacks'

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  const initAuth = useAuthStore((s) => s.initAuth)

  useEffect(() => { initAuth() }, [initAuth])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />

        {/* Fee Management */}
        <Route path="fees/heads" element={<FeeHeads />} />
        <Route path="fees/structure" element={<FeeStructure />} />
        <Route path="fees/pay" element={<PayFee />} />
        <Route path="fees/receipts" element={<ReceiptHistory />} />
        <Route path="fees/reports/daily" element={<DailyCollection />} />
        <Route path="fees/defaulters" element={<FeeDefaulters />} />
        <Route path="fees/books/sets" element={<BookSets />} />
        <Route path="fees/uniforms" element={<Uniforms />} />

        {/* Transport */}
        <Route path="transport/vehicles" element={<VehicleList />} />
        <Route path="transport/routes" element={<RouteList />} />
        <Route path="transport/students" element={<TransportStudents />} />

        {/* Students */}
        <Route path="students/admissions" element={<AdmissionList />} />

        {/* Frontdesk */}
        <Route path="frontdesk/visitors" element={<VisitorList />} />
        <Route path="frontdesk/feedbacks" element={<Feedbacks />} />
      </Route>
    </Routes>
  )
}
