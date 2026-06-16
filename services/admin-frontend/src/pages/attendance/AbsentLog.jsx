import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { XCircle, Calendar, Filter, Printer, Download } from "lucide-react";
import { attendanceApi, studentsApi } from "../../services/api";

export default function AbsentLog() {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    classId: '',
    section: '',
    search: '',
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

  // Fetch absent students
  const { data: absentData, isLoading } = useQuery({
    queryKey: ['absent-log', filters],
    queryFn: async () => {
      const response = await attendanceApi.studentList({
        ...filters,
        status: 'absent',
      });
      return response.data;
    },
  });

  const absentList = Array.isArray(absentData) ? absentData : (absentData?.results || []);

  // Filter by search
  const filteredList = absentList.filter(att => {
    if (!filters.search) return true;
    const search = filters.search.toLowerCase();
    return (
      att.student_name?.toLowerCase().includes(search) ||
      att.admission_no?.toLowerCase().includes(search)
    );
  });

  const handlePrint = () => window.print();

  const handleExport = () => {
    const csvContent = [
      ['Date', 'Admission No', 'Student Name', 'Class', 'Father Name', 'Contact', 'Remarks'].join(','),
      ...filteredList.map(att => [
        att.date,
        att.admission_no || '',
        att.student_name || '',
        `${att.class_name || ''} - ${att.section || ''}`,
        att.father_name || '',
        att.father_mobile || '',
        att.remarks || ''
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `absent-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <XCircle className="w-6 h-6 text-red-600" />
              Absent Log
            </h1>
            <p className="text-gray-600 mt-1">Track and monitor absent students</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Student name or admission no..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <select
              value={filters.classId}
              onChange={(e) => setFilters({ ...filters, classId: e.target.value, section: '' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.class_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
            <select
              value={filters.section}
              onChange={(e) => setFilters({ ...filters, section: e.target.value })}
              disabled={!filters.classId}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">All Sections</option>
              {sections.map(sec => (
                <option key={sec.id} value={sec.section_name}>{sec.section_name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-red-600 font-medium">Total Absent Records</p>
            <p className="text-3xl font-bold text-red-700 mt-1">{filteredList.length}</p>
          </div>
          <XCircle className="w-12 h-12 text-red-300" />
        </div>
      </div>

      {/* Absent List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading absent log...</div>
        ) : filteredList.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <XCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>No absent records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Father Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredList.map((att, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(att.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{att.admission_no || '-'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{att.student_name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {att.class_name && att.section ? `${att.class_name} - ${att.section}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{att.father_name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{att.father_mobile || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{att.remarks || '-'}</td>
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
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
