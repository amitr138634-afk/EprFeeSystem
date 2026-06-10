import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import Dashboard from './pages/Dashboard'
import ComingSoon from './pages/ComingSoon'

// Super Admin pages
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard'
import SchoolList from './pages/superadmin/SchoolList'
import CreateSchool from './pages/superadmin/CreateSchool'
import AdminList from './pages/superadmin/AdminList'
import CreateAdmin from './pages/superadmin/CreateAdmin'

// School Admin — Students
import StudentList from './pages/students/StudentList'
import StudentStrength from './pages/students/StudentStrength'
import ClassMaster from './pages/students/ClassMaster'

// School Admin — Staff
import StaffList from './pages/staff/StaffList'
import DepartmentMaster from './pages/staff/DepartmentMaster'

// School Admin — Attendance
import StudentAttendance from './pages/attendance/StudentAttendance'
import AttendanceRegister from './pages/attendance/AttendanceRegister'
import AbsentLog from './pages/attendance/AbsentLog'
import AttendanceSummary from './pages/attendance/AttendanceSummary'
import StaffAttendance from './pages/attendance/StaffAttendance'

// School Admin — Timetable
import TimetableView from './pages/timetable/TimetableView'

// School Admin — Academics / CCE
import MarksFeeding from './pages/academics/MarksFeeding'
import SubjectAllocation from './pages/academics/SubjectAllocation'

const SCHOOL_ROLES = ['school_admin', 'staff', 'teacher']
const ADMIN_ONLY   = ['school_admin']

function PrivateRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />
  return children
}

function SR({ roles, children }) {
  return <PrivateRoute roles={roles}>{children}</PrivateRoute>
}

function CS({ title, roles }) {
  return <SR roles={roles || SCHOOL_ROLES}><ComingSoon title={title} /></SR>
}

function HomeRedirect() {
  const { user } = useAuthStore()
  if (user?.role === 'super_admin') return <Navigate to="/dashboard" replace />
  return <Dashboard />
}

export default function App() {
  const initAuth = useAuthStore((s) => s.initAuth)
  useEffect(() => { initAuth() }, [initAuth])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<HomeRedirect />} />

        {/* ── Super Admin ───────────────────────────────────────────── */}
        <Route path="dashboard"      element={<SR roles={['super_admin']}><SuperAdminDashboard /></SR>} />
        <Route path="schools"        element={<SR roles={['super_admin']}><SchoolList /></SR>} />
        <Route path="schools/create" element={<SR roles={['super_admin']}><CreateSchool /></SR>} />
        <Route path="admins"         element={<SR roles={['super_admin']}><AdminList /></SR>} />
        <Route path="admins/create"  element={<SR roles={['super_admin']}><CreateAdmin /></SR>} />

        {/* ── Students ─────────────────────────────────────────────── */}
        <Route path="students"         element={<SR roles={SCHOOL_ROLES}><StudentList /></SR>} />
        <Route path="students/strength"element={<SR roles={SCHOOL_ROLES}><StudentStrength /></SR>} />
        <Route path="students/classes" element={<SR roles={ADMIN_ONLY}><ClassMaster /></SR>} />

        {/* ── Staff ────────────────────────────────────────────────── */}
        <Route path="staff"                 element={<SR roles={SCHOOL_ROLES}><StaffList /></SR>} />
        <Route path="staff/departments"     element={<SR roles={ADMIN_ONLY}><DepartmentMaster /></SR>} />
        <Route path="staff/designations"    element={<CS title="Designation Master" roles={ADMIN_ONLY} />} />

        {/* ── Student Attendance ───────────────────────────────────── */}
        <Route path="attendance/students"   element={<SR roles={SCHOOL_ROLES}><StudentAttendance /></SR>} />
        <Route path="attendance/register"   element={<SR roles={SCHOOL_ROLES}><AttendanceRegister /></SR>} />
        <Route path="attendance/absent-log" element={<SR roles={SCHOOL_ROLES}><AbsentLog /></SR>} />
        <Route path="attendance/summary"    element={<SR roles={SCHOOL_ROLES}><AttendanceSummary /></SR>} />
        <Route path="attendance/date-wise"  element={<CS title="Date Wise Summary" />} />

        {/* ── Staff Attendance ─────────────────────────────────────── */}
        <Route path="attendance/staff"                  element={<SR roles={ADMIN_ONLY}><StaffAttendance /></SR>} />
        <Route path="attendance/staff/shifts"           element={<CS title="Manage Shift"                    roles={ADMIN_ONLY} />} />
        <Route path="attendance/staff/monthly"          element={<CS title="Monthly Staff Attendance Report" roles={ADMIN_ONLY} />} />
        <Route path="attendance/staff/holidays"         element={<CS title="Staff Holiday List"              roles={ADMIN_ONLY} />} />
        <Route path="attendance/staff/leave-requests"   element={<CS title="Staff Leave Request"             roles={ADMIN_ONLY} />} />
        <Route path="attendance/staff/leave-balance"    element={<CS title="Leave Balance Report"            roles={ADMIN_ONLY} />} />
        <Route path="attendance/staff/date-wise"        element={<CS title="Date Wise Staff Summary"         roles={ADMIN_ONLY} />} />

        {/* ── Timetable ────────────────────────────────────────────── */}
        <Route path="timetable"                   element={<SR roles={SCHOOL_ROLES}><TimetableView /></SR>} />
        <Route path="timetable/teacher"           element={<CS title="View Teacher Timetable" />} />
        <Route path="timetable/day-wise"          element={<CS title="View Day Wise Timetable" />} />
        <Route path="timetable/class-wise"        element={<CS title="Class Wise Timetable" />} />
        <Route path="timetable/workload"          element={<CS title="Timetable Workload" />} />
        <Route path="timetable/substitute"        element={<CS title="Teacher Substitute Report" />} />
        <Route path="timetable/substitute-monthly"element={<CS title="Month Wise Substitute Report" />} />

        {/* ── CCE — Assign Subject & Test ──────────────────────────── */}
        <Route path="academics/marks"             element={<SR roles={SCHOOL_ROLES}><MarksFeeding /></SR>} />
        <Route path="academics/subjects"          element={<SR roles={ADMIN_ONLY}><SubjectAllocation /></SR>} />
        <Route path="cce/subjects"                element={<CS title="Assign Subject & Test" roles={ADMIN_ONLY} />} />
        <Route path="cce/calculation-master"      element={<CS title="Calculation Master"    roles={ADMIN_ONLY} />} />
        <Route path="cce/remark-master"           element={<CS title="Remark Master"         roles={ADMIN_ONLY} />} />
        <Route path="cce/signature-master"        element={<CS title="Signature Master"      roles={ADMIN_ONLY} />} />
        <Route path="cce/report-card"             element={<CS title="Generate Report Card"  roles={ADMIN_ONLY} />} />

        {/* ── CCE — Subject Allocation ─────────────────────────────── */}
        <Route path="cce/student-subjects"          element={<CS title="Add Subject (Student)"     roles={ADMIN_ONLY} />} />
        <Route path="cce/multiple-subject-mapping"  element={<CS title="Multiple Subject Mapping"  roles={ADMIN_ONLY} />} />
      </Route>
    </Routes>
  )
}
