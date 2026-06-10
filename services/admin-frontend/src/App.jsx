import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import Dashboard from './pages/Dashboard'
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
import SchoolList from './pages/superadmin/SchoolList'
import CreateSchool from './pages/superadmin/CreateSchool'

function PrivateRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const initAuth = useAuthStore((s) => s.initAuth)

  useEffect(() => {
    initAuth()
  }, [initAuth])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />

        {/* Super Admin */}
        <Route path="schools" element={<PrivateRoute roles={['super_admin']}><SchoolList /></PrivateRoute>} />
        <Route path="schools/create" element={<PrivateRoute roles={['super_admin']}><CreateSchool /></PrivateRoute>} />

        {/* Students */}
        <Route path="students" element={<StudentList />} />
        <Route path="students/strength" element={<StudentStrength />} />

        {/* Staff */}
        <Route path="staff" element={<StaffList />} />
        <Route path="staff/departments" element={<DepartmentMaster />} />

        {/* Attendance */}
        <Route path="attendance/students" element={<StudentAttendance />} />
        <Route path="attendance/register" element={<AttendanceRegister />} />
        <Route path="attendance/absent-log" element={<AbsentLog />} />
        <Route path="attendance/summary" element={<AttendanceSummary />} />
        <Route path="attendance/staff" element={<StaffAttendance />} />

        {/* Timetable */}
        <Route path="timetable" element={<TimetableView />} />
        <Route path="timetable/subjects" element={<SubjectList />} />

        {/* Academics */}
        <Route path="academics/marks" element={<MarksFeeding />} />
        <Route path="academics/subjects" element={<SubjectAllocation />} />
      </Route>
    </Routes>
  )
}
