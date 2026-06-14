import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import Dashboard from './pages/Dashboard'

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
import AddEditStaff from './pages/staff/AddEditStaff'
import ViewStaff from './pages/staff/ViewStaff'
import DepartmentMaster from './pages/staff/DepartmentMaster'
import DesignationMaster from './pages/staff/DesignationMaster'
import DeptDesignationMapping from './pages/staff/DeptDesignationMapping'

// School Admin — Student Attendance
import StudentAttendance from './pages/attendance/StudentAttendance'
import AttendanceRegister from './pages/attendance/AttendanceRegister'
import AbsentLog from './pages/attendance/AbsentLog'
import MonthlyAttendance from './pages/attendance/MonthlyAttendance'
import AttendanceSummary from './pages/attendance/AttendanceSummary'

// School Admin — Staff Attendance
import ShiftMaster from './pages/attendance/ShiftMaster'
import StaffAttendance from './pages/attendance/StaffAttendance'
import StaffMonthlyReport from './pages/attendance/StaffMonthlyReport'
import HolidayMaster from './pages/attendance/HolidayMaster'
import LeaveRequests from './pages/attendance/LeaveRequests'
import LeaveBalance from './pages/attendance/LeaveBalance'
import DateWiseStaffSummary from './pages/attendance/DateWiseStaffSummary'

// School Admin — Timetable
import SubjectMaster from './pages/timetable/SubjectMaster'
import PeriodMaster from './pages/timetable/PeriodMaster'
import AddUpdateTimetable from './pages/timetable/AddUpdateTimetable'
import ClassWiseTimetable from './pages/timetable/ClassWiseTimetable'
import TeacherTimetable from './pages/timetable/TeacherTimetable'
import DayWiseTimetable from './pages/timetable/DayWiseTimetable'
import WorkloadReport from './pages/timetable/WorkloadReport'
import SubstituteTeacher from './pages/timetable/SubstituteTeacher'
import SubstituteReport from './pages/timetable/SubstituteReport'
import MonthlySubstituteReport from './pages/timetable/MonthlySubstituteReport'

// School Admin — Masters
import MastersSubjects from './pages/masters/SubjectMaster'
import MastersPeriods from './pages/masters/PeriodMaster'

// School Admin — CCE / Assign Subject & Test
import ExamTypes from './pages/cce/ExamTypes'
import AssignSubjects from './pages/cce/AssignSubjects'
import EnterMarks from './pages/cce/EnterMarks'
import BulkMarks from './pages/cce/BulkMarks'
import RemarkMaster from './pages/cce/RemarkMaster'
import SignatureMaster from './pages/cce/SignatureMaster'

// School Admin — CCE / Subject Allocation
import ClassAllocation from './pages/cce/ClassAllocation'
import TeacherAllocation from './pages/cce/TeacherAllocation'
import StudentSubjects from './pages/cce/StudentSubjects'

// School Admin — Academics
import GradeScale from './pages/academics/GradeScale'
import CalculationMaster from './pages/academics/CalculationMaster'
import ClassResults from './pages/academics/ClassResults'

// School Admin — Report Card
import GenerateReportCard from './pages/reportcard/GenerateReportCard'
import BulkReportCards from './pages/reportcard/BulkReportCards'

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
        <Route path="students"          element={<SR roles={SCHOOL_ROLES}><StudentList /></SR>} />
        <Route path="students/strength" element={<SR roles={SCHOOL_ROLES}><StudentStrength /></SR>} />
        <Route path="students/classes"  element={<SR roles={ADMIN_ONLY}><ClassMaster /></SR>} />

        {/* ── Staff ────────────────────────────────────────────────── */}
        <Route path="staff"                          element={<SR roles={SCHOOL_ROLES}><StaffList /></SR>} />
        <Route path="staff/add"                      element={<SR roles={ADMIN_ONLY}><AddEditStaff /></SR>} />
        <Route path="staff/view/:id"                 element={<SR roles={SCHOOL_ROLES}><ViewStaff /></SR>} />
        <Route path="staff/edit/:id"                 element={<SR roles={ADMIN_ONLY}><AddEditStaff /></SR>} />
        <Route path="staff/departments"              element={<SR roles={ADMIN_ONLY}><DepartmentMaster /></SR>} />
        <Route path="staff/designations"             element={<SR roles={ADMIN_ONLY}><DesignationMaster /></SR>} />
        <Route path="staff/dept-designation-mapping" element={<SR roles={ADMIN_ONLY}><DeptDesignationMapping /></SR>} />

        {/* ── Student Attendance ───────────────────────────────────── */}
        <Route path="attendance/mark"       element={<SR roles={SCHOOL_ROLES}><StudentAttendance /></SR>} />
        <Route path="attendance/date-wise"  element={<SR roles={SCHOOL_ROLES}><AttendanceRegister /></SR>} />
        <Route path="attendance/absent-log" element={<SR roles={SCHOOL_ROLES}><AbsentLog /></SR>} />
        <Route path="attendance/monthly"    element={<SR roles={SCHOOL_ROLES}><MonthlyAttendance /></SR>} />
        <Route path="attendance/summary"    element={<SR roles={SCHOOL_ROLES}><AttendanceSummary /></SR>} />

        {/* ── Staff Attendance ─────────────────────────────────────── */}
        <Route path="attendance/staff/shifts"         element={<SR roles={ADMIN_ONLY}><ShiftMaster /></SR>} />
        <Route path="attendance/staff/mark"           element={<SR roles={ADMIN_ONLY}><StaffAttendance /></SR>} />
        <Route path="attendance/staff/monthly"        element={<SR roles={ADMIN_ONLY}><StaffMonthlyReport /></SR>} />
        <Route path="attendance/staff/holidays"       element={<SR roles={ADMIN_ONLY}><HolidayMaster /></SR>} />
        <Route path="attendance/staff/leave-requests" element={<SR roles={ADMIN_ONLY}><LeaveRequests /></SR>} />
        <Route path="attendance/staff/leave-balance"  element={<SR roles={ADMIN_ONLY}><LeaveBalance /></SR>} />
        <Route path="attendance/staff/date-wise"      element={<SR roles={ADMIN_ONLY}><DateWiseStaffSummary /></SR>} />

        {/* ── Timetable ────────────────────────────────────────────── */}
        <Route path="timetable/add-update"          element={<SR roles={ADMIN_ONLY}><AddUpdateTimetable /></SR>} />
        <Route path="timetable/teacher"             element={<SR roles={SCHOOL_ROLES}><TeacherTimetable /></SR>} />
        <Route path="timetable/day-wise"            element={<SR roles={SCHOOL_ROLES}><DayWiseTimetable /></SR>} />
        <Route path="timetable/class-wise"          element={<SR roles={SCHOOL_ROLES}><ClassWiseTimetable /></SR>} />
        <Route path="timetable/workload"            element={<SR roles={SCHOOL_ROLES}><WorkloadReport /></SR>} />
        <Route path="timetable/substitute-report"   element={<SR roles={SCHOOL_ROLES}><SubstituteReport /></SR>} />
        <Route path="timetable/monthly-substitute"  element={<SR roles={SCHOOL_ROLES}><MonthlySubstituteReport /></SR>} />

        {/* ── CCE — Assign Subject & Test ──────────────────────────── */}
        <Route path="cce/exam-types"      element={<SR roles={ADMIN_ONLY}><ExamTypes /></SR>} />
        <Route path="cce/assign-subjects" element={<SR roles={ADMIN_ONLY}><AssignSubjects /></SR>} />
        <Route path="cce/enter-marks"     element={<SR roles={SCHOOL_ROLES}><EnterMarks /></SR>} />
        <Route path="cce/bulk-marks"      element={<SR roles={SCHOOL_ROLES}><BulkMarks /></SR>} />
        <Route path="cce/remarks"         element={<SR roles={ADMIN_ONLY}><RemarkMaster /></SR>} />
        <Route path="cce/signatures"      element={<SR roles={ADMIN_ONLY}><SignatureMaster /></SR>} />

        {/* ── CCE — Subject Allocation ─────────────────────────────── */}
        <Route path="cce/class-allocation"   element={<SR roles={ADMIN_ONLY}><ClassAllocation /></SR>} />
        <Route path="cce/teacher-allocation" element={<SR roles={ADMIN_ONLY}><TeacherAllocation /></SR>} />
        <Route path="cce/student-subjects"   element={<SR roles={ADMIN_ONLY}><StudentSubjects /></SR>} />

        {/* ── Academics ────────────────────────────────────────────── */}
        <Route path="academics/grade-scale" element={<SR roles={ADMIN_ONLY}><GradeScale /></SR>} />
        <Route path="academics/calculation" element={<SR roles={ADMIN_ONLY}><CalculationMaster /></SR>} />
        <Route path="academics/results"     element={<SR roles={SCHOOL_ROLES}><ClassResults /></SR>} />

        {/* ── Masters ──────────────────────────────────────────────── */}
        <Route path="masters/subjects" element={<SR roles={ADMIN_ONLY}><MastersSubjects /></SR>} />
        <Route path="masters/periods"  element={<SR roles={ADMIN_ONLY}><MastersPeriods /></SR>} />

        {/* ── Report Card ──────────────────────────────────────────── */}
        <Route path="report-card/generate" element={<SR roles={SCHOOL_ROLES}><GenerateReportCard /></SR>} />
        <Route path="report-card/bulk"     element={<SR roles={SCHOOL_ROLES}><BulkReportCards /></SR>} />
      </Route>
    </Routes>
  )
}
