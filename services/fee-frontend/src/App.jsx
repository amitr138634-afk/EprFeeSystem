import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import Dashboard from './pages/Dashboard'

// Existing fee pages
import FeeHeads from './pages/fees/FeeHeads'
import DefineFeeAmount from './pages/fees/DefineFeeAmount'
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
import AdmissionQuery from './pages/frontdesk/AdmissionQuery'
import VisitorList from './pages/frontdesk/VisitorList'
import Feedbacks from './pages/frontdesk/Feedbacks'
import ClassMaster from './pages/masters/ClassMaster'
import SectionMaster from './pages/masters/SectionMaster'
import SecMaster from './pages/masters/SecMaster'
import SessionMaster from './pages/masters/SessionMaster'

// Fee Management
import PayFeeNew from './pages/feemgmt/PayFee'
import StudentProfile from './pages/feemgmt/StudentProfile'

// Placeholder for unbuilt pages
import { Clock } from 'lucide-react'
function CS({ title }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      <div className="w-20 h-20 bg-teal-100 rounded-3xl flex items-center justify-center mx-auto mb-5 animate-pulse">
        <Clock size={36} className="text-teal-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">{title || 'Coming Soon'}</h2>
      <p className="text-gray-400 text-sm max-w-xs">This feature is under development.</p>
    </div>
  )
}

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

        {/* ── Fee Setup ──────────────────────────────────────────── */}
        <Route path="fees/heads"              element={<FeeHeads />} />
        <Route path="fees/structure"          element={<DefineFeeAmount />} />
        <Route path="fees/setup/teacher-extra"element={<CS title="Teacher Extra Heads" />} />
        <Route path="fees/setup/discounts"    element={<CS title="Configure Discount Heads" />} />
        <Route path="fees/setup/additional"   element={<CS title="Additional Fee Master" />} />
        <Route path="fees/setup/deposit"      element={<CS title="Deposit Fee Management" />} />

        {/* ── Fee Collection ─────────────────────────────────────── */}
        <Route path="fees/pay"                element={<PayFee />} />
        <Route path="fees/pay-extra"          element={<CS title="Pay Extra Fee" />} />
        <Route path="fees/late-fine"          element={<CS title="Late Fine Calculation" />} />
        <Route path="fees/reverify"           element={<CS title="Reverify Payment" />} />
        <Route path="fees/bill-generation"    element={<CS title="Fee Bill Generation" />} />

        {/* ── Fee Management (New) ───────────────────────────────── */}
        <Route path="feemgmt/pay-fee"         element={<PayFeeNew />} />
        <Route path="feemgmt/student-profile/:studentId" element={<StudentProfile />} />

        {/* ── Books ─────────────────────────────────────────────── */}
        <Route path="fees/books/sets"         element={<BookSets />} />
        <Route path="fees/books/inventory"    element={<CS title="Book Inventory" />} />
        <Route path="fees/books/sell"         element={<CS title="Sell Book Set" />} />
        <Route path="fees/books/receipts"     element={<CS title="Book Sales Receipts" />} />

        {/* ── Uniforms ──────────────────────────────────────────── */}
        <Route path="fees/uniforms"           element={<Uniforms />} />
        <Route path="fees/uniforms/stock"     element={<CS title="Stock Management" />} />
        <Route path="fees/uniforms/sell"      element={<CS title="Sell Uniform" />} />
        <Route path="fees/uniforms/tracking"  element={<CS title="Sales Tracking" />} />

        {/* ── History & Ledger ───────────────────────────────────── */}
        <Route path="fees/receipts"           element={<ReceiptHistory />} />
        <Route path="fees/late-fine-history"  element={<CS title="Previous Late Fine" />} />
        <Route path="fees/ledger"             element={<CS title="Student Fee Ledger" />} />

        {/* ── Fee Reports ────────────────────────────────────────── */}
        <Route path="fees/reports/daily"      element={<DailyCollection />} />
        <Route path="fees/reports/monthly"    element={<CS title="Monthly Collection Report" />} />
        <Route path="fees/reports/classwise"  element={<CS title="Class-wise Collection" />} />
        <Route path="fees/reports/headwise"   element={<CS title="Head-wise Collection" />} />
        <Route path="fees/reports/payment-mode" element={<CS title="Payment Mode Report" />} />
        <Route path="fees/reports/discount"   element={<CS title="Discount Report" />} />
        <Route path="fees/reports/cheque"     element={<CS title="Cheque Status Report" />} />
        <Route path="fees/reports/audit"      element={<CS title="Audit Log Report" />} />
        <Route path="fees/defaulters"         element={<FeeDefaulters />} />
        <Route path="fees/defaulters/datewise"element={<CS title="Date-wise Outstanding" />} />

        {/* ── Transport ─────────────────────────────────────────── */}
        <Route path="transport/vehicles"               element={<VehicleList />} />
        <Route path="transport/routes"                 element={<RouteList />} />
        <Route path="transport/students"               element={<TransportStudents />} />
        <Route path="transport/students/not-using"     element={<CS title="Students Not Using Transport" />} />
        <Route path="transport/setup/bus"              element={<CS title="Bus No. Master" />} />
        <Route path="transport/setup/stop"             element={<CS title="Stop Master" />} />
        <Route path="transport/setup/promote"          element={<CS title="Promote Route / Stop" />} />
        <Route path="transport/setup/vehicle-details"  element={<CS title="Vehicle Company / Model" />} />
        <Route path="transport/setup/parts"            element={<CS title="Vehicle Parts" />} />
        <Route path="transport/listing/buswise"        element={<CS title="Bus-wise List" />} />
        <Route path="transport/listing/routewise"      element={<CS title="Route-wise List" />} />
        <Route path="transport/listing/stopwise"       element={<CS title="Stop-wise List" />} />
        <Route path="transport/listing/bus-count"      element={<CS title="Bus-wise Student Count" />} />
        <Route path="transport/attendance"             element={<CS title="Transport Attendance Register" />} />
        <Route path="transport/apply"                  element={<CS title="Apply Transport" />} />

        {/* ── Students ──────────────────────────────────────────── */}
        <Route path="students/admissions"         element={<AdmissionList />} />
        <Route path="students/dynamic-report"     element={<CS title="Dynamic Student Report" />} />
        <Route path="students/change-admission-no"element={<CS title="Change Admission No." />} />
        <Route path="students/cbse-form"          element={<CS title="CBSE Registration Form" />} />
        <Route path="students/search"             element={<CS title="Search Student" />} />
        <Route path="students/admit-card"         element={<CS title="Admit Card" />} />
        <Route path="students/id-card"            element={<CS title="ID Card" />} />
        <Route path="students/edit-master"        element={<CS title="Student Edit Master" />} />
        <Route path="students/change-section"     element={<CS title="Change Section" />} />
        <Route path="students/sibling"            element={<CS title="Create Sibling" />} />
        <Route path="students/promote"            element={<CS title="Promote Student" />} />
        <Route path="students/demote"             element={<CS title="Demote Student" />} />
        <Route path="students/reports/strength"   element={<CS title="Class-wise Strength" />} />
        <Route path="students/reports/list"       element={<CS title="Student List" />} />
        <Route path="students/reports/cancelled"  element={<CS title="Cancelled Admissions" />} />
        <Route path="students/reports/tc"         element={<CS title="TC Issued" />} />
        <Route path="students/reports/age"        element={<CS title="Age Calculator Report" />} />
        <Route path="students/reports/category"   element={<CS title="Admission Category Report" />} />

        {/* ── Frontdesk ─────────────────────────────────────────── */}
        <Route path="frontdesk/visitors"              element={<VisitorList />} />
        <Route path="frontdesk/feedbacks"             element={<Feedbacks />} />
        <Route path="frontdesk/add-feedback"          element={<CS title="Add Feedback" />} />
        <Route path="frontdesk/setup/authorised"      element={<CS title="Authorised Persons" />} />
        <Route path="frontdesk/setup/followup"        element={<CS title="Follow Up Master" />} />
        <Route path="frontdesk/setup/halfday"         element={<CS title="Halfday Approval Master" />} />
        <Route path="frontdesk/short-leaves/add"      element={<CS title="Add Short Leave" />} />
        <Route path="frontdesk/short-leaves/list"     element={<CS title="List Short Leaves" />} />
        <Route path="frontdesk/enquiry/query"         element={<AdmissionQuery />} />
        <Route path="frontdesk/enquiry/dashboard"     element={<CS title="Enquiry Dashboard" />} />
        <Route path="frontdesk/enquiry/followup"      element={<CS title="Enquiry Follow Up" />} />
        <Route path="frontdesk/enquiry/test-subjects" element={<CS title="Test Subjects" />} />
        <Route path="frontdesk/enquiry/remarks"       element={<CS title="Remark Master" />} />
        <Route path="frontdesk/hrm/add"               element={<CS title="Add HRM" />} />
        <Route path="frontdesk/hrm/list"              element={<CS title="List HRM" />} />
        <Route path="frontdesk/hrm/letter"            element={<CS title="Add Letter" />} />

        {/* ── Master ─────────────────────────────────────────────── */}
        <Route path="masters/classes"                 element={<ClassMaster />} />
        <Route path="masters/sec-master"              element={<SecMaster />} />
        <Route path="masters/sections"                element={<SectionMaster />} />
        <Route path="masters/sessions"                element={<SessionMaster />} />
      </Route>
    </Routes>
  )
}
