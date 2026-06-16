import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, FileText, Printer, Download } from "lucide-react";
import { attendanceApi, studentsApi } from "../../services/api";

export default function AttendanceRegister() {
  const currentDate = new Date();
  const [filters, setFilters] = useState({
    date: currentDate.toISOString().split('T')[0],
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

  // Fetch attendance for selected date
  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['attendance-register', filters],
    queryFn: async () => {
      const response = await attendanceApi.studentList({
        date: filters.date,
        class_id: filters.classId,
        section: filters.section,
      });
      return response.data;
    },
    enabled: !!filters.date && !!filters.classId && !!filters.section,
  });

  const students = studentsData?.results || studentsData || [];
  const attendance = Array.isArray(attendanceData) ? attendanceData : (attendanceData?.results || []);

  // Create attendance map for quick lookup
  const attendanceMap = {};
  attendance.forEach(att => {
    attendanceMap[att.student] = att;
  });

  const stats = {
    total: students.length,
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    late: attendance.filter(a => a.status === 'late').length,
    notMarked: students.length - attendance.length,
  };

  const handlePrint = () => window.print();

  const handleExport = () => {
    const csvContent = [
      ['S.No', 'Admission No', 'Student Name', 'Father Name', 'Status', 'Remarks'].join(','),
      ...students.map((student, index) => {
        const att = attendanceMap[student.id];
        return [
          index + 1,
          student.admission_no,
          student.student_name,
          student.father_name,
          att?.status || 'Not Marked',
          att?.remarks || ''
        ].join(',');
      }),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-register-${filters.date}.csv`;
    a.click();
  };

  const selectedClass = classes.find(c => c.id == filters.classId);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 print:mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Attendance Register
            </h1>
            <p className="text-gray-600 mt-1">Date-wise attendance register for students</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date *
            </label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
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

      {/* Statistics */}
      {students.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 print:mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs text-blue-600 font-medium">Total</p>
            <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-xs text-green-600 font-medium">Present</p>
            <p className="text-2xl font-bold text-green-700">{stats.present}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-xs text-red-600 font-medium">Absent</p>
            <p className="text-2xl font-bold text-red-700">{stats.absent}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-xs text-yellow-600 font-medium">Late</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.late}</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-600 font-medium">Not Marked</p>
            <p className="text-2xl font-bold text-gray-700">{stats.notMarked}</p>
          </div>
        </div>
      )}

      {/* Register Header for Print */}
      <div className="hidden print:block mb-4 text-center border-b-2 border-gray-300 pb-3">
        <h2 className="text-xl font-bold">Attendance Register</h2>
        <p className="text-sm">Class: {selectedClass?.class_name} - {filters.section} | Date: {new Date(filters.date).toLocaleDateString()}</p>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading register...</div>
        ) : !filters.classId || !filters.section ? (
          <div className="p-8 text-center text-gray-500">
            Please select date, class, and section to view register
          </div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No students found in selected class and section
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16">S.No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Father Name</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase print:hidden">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student, index) => {
                  const att = attendanceMap[student.id];
                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{student.admission_no}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.student_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{student.father_name}</td>
                      <td className="px-4 py-3 text-center">
                        {att ? (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            att.status === 'present' ? 'bg-green-100 text-green-700' :
                            att.status === 'absent' ? 'bg-red-100 text-red-700' :
                            att.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                            att.status === 'half_day' ? 'bg-orange-100 text-orange-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {att.status.replace('_', ' ').toUpperCase()}
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            NOT MARKED
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 print:hidden">
                        {att?.remarks || '-'}
                      </td>
                    </tr>
                  );
                })}
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
