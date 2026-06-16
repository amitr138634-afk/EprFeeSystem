import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Users, CheckCircle2, XCircle, Clock, FileText, Save, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import { attendanceApi, studentsApi } from "../../services/api";

export default function StudentAttendance() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const [filters, setFilters] = useState({
    date: today,
    classId: '',
    section: '',
  });

  const [attendance, setAttendance] = useState({});
  const [selectAll, setSelectAll] = useState('present');

  // Fetch classes
  const { data: classesResponse, isLoading: loadingClasses, error: classesError } = useQuery({
    queryKey: ['classMasters'],
    queryFn: async () => {
      const response = await studentsApi.classMasters();
      return response.data;
    },
  });

  // Handle different response formats
  let classes = [];
  if (Array.isArray(classesResponse)) {
    classes = classesResponse;
  } else if (classesResponse?.results) {
    classes = classesResponse.results;
  } else if (classesResponse?.data) {
    classes = Array.isArray(classesResponse.data) ? classesResponse.data : [];
  }

  // Fetch sections for selected class
  const { data: sectionsResponse, isLoading: loadingSections } = useQuery({
    queryKey: ['sectionMasters', filters.classId],
    queryFn: async () => {
      const response = await studentsApi.sectionMasters({ class_id: filters.classId });
      return response.data;
    },
    enabled: !!filters.classId,
  });

  // Handle different response formats for sections
  let sections = [];
  if (Array.isArray(sectionsResponse)) {
    sections = sectionsResponse;
  } else if (sectionsResponse?.results) {
    sections = sectionsResponse.results;
  } else if (sectionsResponse?.data) {
    sections = Array.isArray(sectionsResponse.data) ? sectionsResponse.data : [];
  }

  // Fetch students based on class and section
  const { data: studentsData, isLoading: loadingStudents } = useQuery({
    queryKey: ['students', filters],
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

  // Fetch existing attendance for the date
  const { data: existingAttendanceResponse } = useQuery({
    queryKey: ['attendance', filters.date, filters.classId, filters.section],
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

  const existingAttendance = Array.isArray(existingAttendanceResponse) 
    ? existingAttendanceResponse 
    : (existingAttendanceResponse?.data || existingAttendanceResponse?.results || []);

  // Initialize attendance state when data loads
  useEffect(() => {
    const students = studentsData?.results || studentsData || [];
    if (students.length > 0) {
      const initial = {};
      students.forEach(student => {
        const existing = existingAttendance?.find(a => a.student === student.id);
        initial[student.id] = {
          status: existing?.status || 'present',
          remarks: existing?.remarks || '',
        };
      });
      setAttendance(initial);
    }
  }, [studentsData, existingAttendance]);

  // Save attendance mutation
  const saveMutation = useMutation({
    mutationFn: (data) => attendanceApi.bulkMark(data),
    onSuccess: () => {
      toast.success('Attendance saved successfully!');
      queryClient.invalidateQueries(['attendance']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save attendance');
    },
  });

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const handleRemarksChange = (studentId, remarks) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks },
    }));
  };

  const handleSelectAll = (status) => {
    const updated = {};
    Object.keys(attendance).forEach(studentId => {
      updated[studentId] = { ...attendance[studentId], status };
    });
    setAttendance(updated);
    setSelectAll(status);
  };

  const handleSave = () => {
    if (!filters.date || !filters.classId || !filters.section) {
      toast.error('Please select date, class, and section');
      return;
    }

    const attendanceList = Object.entries(attendance).map(([studentId, data]) => ({
      student: parseInt(studentId),
      date: filters.date,
      status: data.status,
      remarks: data.remarks,
    }));

    saveMutation.mutate({
      date: filters.date,
      class_id: filters.classId,
      section: filters.section,
      attendance: attendanceList,
    });
  };

  const handleReset = () => {
    const reset = {};
    Object.keys(attendance).forEach(studentId => {
      reset[studentId] = { status: 'present', remarks: '' };
    });
    setAttendance(reset);
  };

  const students = studentsData?.results || studentsData || [];
  const stats = {
    total: students.length,
    present: Object.values(attendance).filter(a => a.status === 'present').length,
    absent: Object.values(attendance).filter(a => a.status === 'absent').length,
    late: Object.values(attendance).filter(a => a.status === 'late').length,
    halfDay: Object.values(attendance).filter(a => a.status === 'half_day').length,
    leave: Object.values(attendance).filter(a => a.status === 'leave').length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="w-6 h-6" />
          Student Attendance
        </h1>
        <p className="text-gray-600 mt-1">Mark daily attendance for students</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date *
            </label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              max={today}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class *
            </label>
            <select
              value={filters.classId}
              onChange={(e) => setFilters({ ...filters, classId: e.target.value, section: '' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Class</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.class_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section *
            </label>
            <select
              value={filters.section}
              onChange={(e) => setFilters({ ...filters, section: e.target.value })}
              disabled={!filters.classId}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Select Section</option>
              {sections.map(sec => (
                <option key={sec.id} value={sec.section_name}>{sec.section_name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleReset}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset All
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {students.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
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
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-xs text-orange-600 font-medium">Half Day</p>
            <p className="text-2xl font-bold text-orange-700">{stats.halfDay}</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-xs text-purple-600 font-medium">Leave</p>
            <p className="text-2xl font-bold text-purple-700">{stats.leave}</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {students.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Quick Mark All As:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleSelectAll('present')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Present
            </button>
            <button
              onClick={() => handleSelectAll('absent')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Absent
            </button>
            <button
              onClick={() => handleSelectAll('late')}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Late
            </button>
            <button
              onClick={() => handleSelectAll('half_day')}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Half Day
            </button>
            <button
              onClick={() => handleSelectAll('leave')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Leave
            </button>
          </div>
        </div>
      )}

      {/* Students List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loadingStudents ? (
          <div className="p-8 text-center text-gray-500">Loading students...</div>
        ) : !filters.classId || !filters.section ? (
          <div className="p-8 text-center text-gray-500">
            Please select class and section to view students
          </div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No students found in selected class and section
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16">S.No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Father Name</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Gender</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student, index) => {
                    const studentAttendance = attendance[student.id] || { status: 'present', remarks: '' };
                    return (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{student.admission_no}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.student_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{student.father_name}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                          <span className={`px-2 py-1 rounded text-xs ${
                            student.gender === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                          }`}>
                            {student.gender === 'M' ? 'Male' : 'Female'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={studentAttendance.status}
                            onChange={(e) => handleStatusChange(student.id, e.target.value)}
                            className={`w-full px-3 py-1.5 text-sm rounded-lg border focus:ring-2 focus:ring-blue-500 ${
                              studentAttendance.status === 'present' ? 'bg-green-50 border-green-300 text-green-700' :
                              studentAttendance.status === 'absent' ? 'bg-red-50 border-red-300 text-red-700' :
                              studentAttendance.status === 'late' ? 'bg-yellow-50 border-yellow-300 text-yellow-700' :
                              studentAttendance.status === 'half_day' ? 'bg-orange-50 border-orange-300 text-orange-700' :
                              'bg-purple-50 border-purple-300 text-purple-700'
                            }`}
                          >
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="late">Late</option>
                            <option value="half_day">Half Day</option>
                            <option value="leave">Leave</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={studentAttendance.remarks}
                            onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                            placeholder="Optional remarks..."
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Save Button */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saveMutation.isPending ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
