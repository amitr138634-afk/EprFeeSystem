import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, TrendingUp, Printer, Download } from "lucide-react";
import { attendanceApi, studentsApi } from "../../services/api";

export default function MonthlyAttendance() {
  const currentDate = new Date();
  const [filters, setFilters] = useState({
    month: (currentDate.getMonth() + 1).toString().padStart(2, '0'),
    year: currentDate.getFullYear().toString(),
    classId: '',
    section: '',
  });

  // Fetch classes
  const { data: classesResponse } = useQuery({
    queryKey: ['classMasters'],
    queryFn: async () => {
      const response = await studentsApi.classMasters();
      return response.data;
    },
  });

  let classes = [];
  if (Array.isArray(classesResponse)) {
    classes = classesResponse;
  } else if (classesResponse?.results) {
    classes = classesResponse.results;
  } else if (classesResponse?.data) {
    classes = Array.isArray(classesResponse.data) ? classesResponse.data : [];
  }

  // Fetch sections
  const { data: sectionsResponse } = useQuery({
    queryKey: ['sectionMasters', filters.classId],
    queryFn: async () => {
      const response = await studentsApi.sectionMasters({ class_id: filters.classId });
      return response.data;
    },
    enabled: !!filters.classId,
  });

  let sections = [];
  if (Array.isArray(sectionsResponse)) {
    sections = sectionsResponse;
  } else if (sectionsResponse?.results) {
    sections = sectionsResponse.results;
  } else if (sectionsResponse?.data) {
    sections = Array.isArray(sectionsResponse.data) ? sectionsResponse.data : [];
  }

  // Fetch students
  const { data: studentsData } = useQuery({
    queryKey: ['students', filters.classId, filters.section],
    queryFn: async () => {
      const selectedClass = classes.find(c => c.id == filters.classId);
      const response = await studentsApi.list({
        class_name: selectedClass?.class_name,
        section: filters.section,
        status: 'active',
      });
      return response.data;
    },
    enabled: !!filters.classId && !!filters.section && classes.length > 0,
  });

  // Fetch monthly attendance
  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['monthly-attendance', filters],
    queryFn: async () => {
      const response = await attendanceApi.studentList({
        class_id: filters.classId,
        section: filters.section,
        month: filters.month,
        year: filters.year,
      });
      return response.data;
    },
    enabled: !!filters.classId && !!filters.section,
  });

  const students = studentsData?.results || studentsData || [];
  const attendance = Array.isArray(attendanceData) ? attendanceData : (attendanceData?.results || []);

  // Get days in month
  const daysInMonth = new Date(filters.year, filters.month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Create attendance map: { studentId: { date: status } }
  const attendanceMap = {};
  attendance.forEach(att => {
    if (!attendanceMap[att.student]) {
      attendanceMap[att.student] = {};
    }
    const day = new Date(att.date).getDate();
    attendanceMap[att.student][day] = att.status;
  });

  // Calculate statistics for each student
  const studentStats = students.map(student => {
    const studentAtt = attendanceMap[student.id] || {};
    const present = Object.values(studentAtt).filter(s => s === 'present').length;
    const absent = Object.values(studentAtt).filter(s => s === 'absent').length;
    const late = Object.values(studentAtt).filter(s => s === 'late').length;
    const totalMarked = Object.keys(studentAtt).length;
    const percentage = totalMarked > 0 ? ((present / totalMarked) * 100).toFixed(1) : 0;

    return {
      ...student,
      present,
      absent,
      late,
      totalMarked,
      percentage,
    };
  });

  const handlePrint = () => window.print();

  const handleExport = () => {
    const csvContent = [
      ['S.No', 'Admission No', 'Student Name', 'Present', 'Absent', 'Late', 'Total Marked', 'Attendance %'].join(','),
      ...studentStats.map((student, index) => [
        index + 1,
        student.admission_no,
        student.student_name,
        student.present,
        student.absent,
        student.late,
        student.totalMarked,
        student.percentage
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monthly-attendance-${filters.year}-${filters.month}.csv`;
    a.click();
  };

  const selectedClass = classes.find(c => c.id == filters.classId);
  const monthName = new Date(filters.year, filters.month - 1).toLocaleDateString('en-US', { month: 'long' });

  return (
    <div className="p-6 max-w-full mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Class Wise Attendance Status
            </h1>
            <p className="text-gray-600 mt-1">Monthly attendance status for students</p>
          </div>
          <div className="flex gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Month *
            </label>
            <select
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                  {new Date(2024, i).toLocaleDateString('en-US', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = currentDate.getFullYear() - 2 + i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
            <select
              value={filters.classId}
              onChange={(e) => setFilters({ ...filters, classId: e.target.value, section: '' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Class</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.class_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Section *</label>
            <select
              value={filters.section}
              onChange={(e) => setFilters({ ...filters, section: e.target.value })}
              disabled={!filters.classId}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select Section</option>
              {sections.map(sec => (
                <option key={sec.id} value={sec.section_name}>{sec.section_name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block mb-4 text-center border-b-2 border-gray-300 pb-3">
        <h2 className="text-xl font-bold">Monthly Attendance Status</h2>
        <p className="text-sm">Class: {selectedClass?.class_name} - {filters.section} | Month: {monthName} {filters.year}</p>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading attendance...</div>
        ) : !filters.classId || !filters.section ? (
          <div className="p-8 text-center text-gray-500">
            Please select month, year, class, and section
          </div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No students found in selected class and section
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">S.No</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase sticky left-12 bg-gray-50">Admission No</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase sticky left-32 bg-gray-50">Student Name</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">P</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">A</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">L</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {studentStats.map((student, index) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-900 sticky left-0 bg-white">{index + 1}</td>
                    <td className="px-3 py-2 text-gray-900 sticky left-12 bg-white">{student.admission_no}</td>
                    <td className="px-3 py-2 font-medium text-gray-900 sticky left-32 bg-white">{student.student_name}</td>
                    <td className="px-3 py-2 text-center text-green-700 font-medium">{student.present}</td>
                    <td className="px-3 py-2 text-center text-red-700 font-medium">{student.absent}</td>
                    <td className="px-3 py-2 text-center text-yellow-700 font-medium">{student.late}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        student.percentage >= 75 ? 'bg-green-100 text-green-700' :
                        student.percentage >= 50 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {student.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
