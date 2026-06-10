import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import Dashboard from './pages/Dashboard'

// Super Admin pages
import SchoolList from './pages/superadmin/SchoolList'
import CreateSchool from './pages/superadmin/CreateSchool'
import AdminList from './pages/superadmin/AdminList'
import CreateAdmin from './pages/superadmin/CreateAdmin'

// School Admin pages
import StudentList from './pages/students/StudentList'
import StudentStrength from './pages/students/StudentStrength'
import StaffList from './pages/staff/StaffList'
import DepartmentMaster from './pages/staff/DepartmentMaster'
import StudentAttendance from './pages/attendance/StudentAttendance'
import AttendanceRegister from './pages/attendance/AttendanceRegister'
import AbsentLog from './pages/attendance/AbsentLog'
import AttendanceSummary from './pages/attendance/AttendanceSummary'
import StaffAttendance from './pages/attendance/StaffAttendance'
import TimetableView from './pages/timetable/TimetableView'
import SubjectList from './pages/timetable/SubjectList'
import MarksFeeding from './pages/academics/MarksFeeding'
import SubjectAllocation from './pages/academics/SubjectAllocation'

function PrivateRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />
  return children
}

function HomeRedirect() {
  const { user } = useAuthStore()
  if (user?.role === 'super_admin') return <Navigate to="/schools" replace />
  return <Dashboard />
}

export default function App() {
  const initAuth = useAuthStore((s) => s.initAuth)

  useEffect(() => { initAuth() }, [initAuth])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={<PrivateRoute><Layout /></PrivateRoute>}
      >
        <Route index element={<HomeRedirect />} />

        {/* ────────── Super Admin only ────────── */}
        <Route path="schools"           element={<PrivateRoute roles={['super_admin']}><SchoolList /></PrivateRoute>} />
        <Route path="schools/create"    element={<PrivateRoute roles={['super_admin']}><CreateSchool /></PrivateRoute>} />
        <Route path="admins"            element={<PrivateRoute roles={['super_admin']}><AdminList /></PrivateRoute>} />
        <Route path="admins/create"     element={<PrivateRoute roles={['super_admin']}><CreateAdmin /></PrivateRoute>} />

        {/* ────────── School Admin / Staff ────────── */}
        <Route path="students"                    element={<PrivateRoute roles={['school_admin','staff','teacher']}><StudentList /></PrivateRoute>} />
        <Route path="students/strength"           element={<PrivateRoute roles={['school_admin','staff','teacher']}><StudentStrength /></PrivateRoute>} />
        <Route path="staff"                       element={<PrivateRoute roles={['school_admin','staff']}><StaffList /></PrivateRoute>} />
        <Route path="staff/departments"           element={<PrivateRoute roles={['school_admin']}><DepartmentMaster /></PrivateRoute>} />
        <Route path="attendance/students"         element={<PrivateRoute roles={['school_admin','staff','teacher']}><StudentAttendance /></PrivateRoute>} />
        <Route path="attendance/register"         element={<PrivateRoute roles={['school_admin','staff','teacher']}><AttendanceRegister /></PrivateRoute>} />
        <Route path="attendance/absent-log"       element={<PrivateRoute roles={['school_admin','staff','teacher']}><AbsentLog /></PrivateRoute>} />
        <Route path="attendance/summary"          element={<PrivateRoute roles={['school_admin','staff','teacher']}><AttendanceSummary /></PrivateRoute>} />
        <Route path="attendance/staff"            element={<PrivateRoute roles={['school_admin']}><StaffAttendance /></PrivateRoute>} />
        <Route path="timetable"                   element={<PrivateRoute roles={['school_admin','staff','teacher']}><TimetableView /></PrivateRoute>} />
        <Route path="timetable/subjects"          element={<PrivateRoute roles={['school_admin']}><SubjectList /></PrivateRoute>} />
        <Route path="academics/marks"             element={<PrivateRoute roles={['school_admin','staff','teacher']}><MarksFeeding /></PrivateRoute>} />
        <Route path="academics/subjects"          element={<PrivateRoute roles={['school_admin']}><SubjectAllocation /></PrivateRoute>} />
      </Route>
    </Routes>
  )
}
