import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, PieChart, Printer, Download } from "lucide-react";
import { attendanceApi, studentsApi } from "../../services/api";

export default function AttendanceSummary() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);

  // Fetch attendance summary
  const { data: summaryData, isLoading } = useQuery({
    queryKey: ['attendance-summary', selectedDate],
    queryFn: async () => {
      const response = await attendanceApi.summary({ date: selectedDate });
      return response.data;
    },
  });

  const summary = Array.isArray(summaryData) ? summaryData : (summaryData?.results || []);

  // Calculate totals
  const totals = summary.reduce((acc, item) => ({
    total: acc.total + (item.total || 0),
    present: acc.present + (item.present || 0),
    absent: acc.absent + (item.absent || 0),
    late: acc.late + (item.late || 0),
  }), { total: 0, present: 0, absent: 0, late: 0 });

  const overallPercentage = totals.total > 0 
    ? ((totals.present / totals.total) * 100).toFixed(1)
    : 0;

  const handlePrint = () => window.print();

  const handleExport = () => {
    const csvContent = [
      ['Class', 'Section', 'Total', 'Present', 'Absent', 'Late', 'Attendance %'].join(','),
      ...summary.map(item => [
        item.class_name || '-',
        item.section || '-',
        item.total || 0,
        item.present || 0,
        item.absent || 0,
        item.late || 0,
        item.total > 0 ? ((item.present / item.total) * 100).toFixed(1) + '%' : '0%'
      ].join(',')),
      ['TOTAL', '', totals.total, totals.present, totals.absent, totals.late, overallPercentage + '%'].join(','),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-summary-${selectedDate}.csv`;
    a.click();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <PieChart className="w-6 h-6" />
              Date Wise Summary
            </h1>
            <p className="text-gray-600 mt-1">Class-wise attendance summary for selected date</p>
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

      {/* Date Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 print:hidden">
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Select Date *
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={today}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-600 font-medium">Total Students</p>
          <p className="text-2xl font-bold text-blue-700">{totals.total}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-xs text-green-600 font-medium">Present</p>
          <p className="text-2xl font-bold text-green-700">{totals.present}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-xs text-red-600 font-medium">Absent</p>
          <p className="text-2xl font-bold text-red-700">{totals.absent}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-xs text-yellow-600 font-medium">Late</p>
          <p className="text-2xl font-bold text-yellow-700">{totals.late}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-xs text-purple-600 font-medium">Overall %</p>
          <p className="text-2xl font-bold text-purple-700">{overallPercentage}%</p>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block mb-4 text-center border-b-2 border-gray-300 pb-3">
        <h2 className="text-xl font-bold">Attendance Summary</h2>
        <p className="text-sm">Date: {new Date(selectedDate).toLocaleDateString()}</p>
      </div>

      {/* Class-wise Summary */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading summary...</div>
        ) : summary.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <PieChart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>No attendance data found for selected date</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Present</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Absent</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Late</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Attendance %</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {summary.map((item, index) => {
                  const percentage = item.total > 0 
                    ? ((item.present / item.total) * 100).toFixed(1)
                    : 0;
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {item.class_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.section || '-'}</td>
                      <td className="px-4 py-3 text-center text-sm font-semibold text-blue-600">
                        {item.total || 0}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-green-700 font-medium">
                        {item.present || 0}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-red-700 font-medium">
                        {item.absent || 0}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-yellow-700 font-medium">
                        {item.late || 0}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          percentage >= 90 ? 'bg-green-100 text-green-700' :
                          percentage >= 75 ? 'bg-blue-100 text-blue-700' :
                          percentage >= 60 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {percentage}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {percentage >= 75 ? (
                          <span className="text-green-600 font-medium">✓ Good</span>
                        ) : percentage >= 60 ? (
                          <span className="text-yellow-600 font-medium">⚠ Average</span>
                        ) : (
                          <span className="text-red-600 font-medium">✗ Poor</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-gray-100 font-bold">
                  <td colSpan="3" className="px-4 py-3 text-sm text-gray-900">TOTAL</td>
                  <td className="px-4 py-3 text-center text-sm text-blue-600">{totals.total}</td>
                  <td className="px-4 py-3 text-center text-sm text-green-700">{totals.present}</td>
                  <td className="px-4 py-3 text-center text-sm text-red-700">{totals.absent}</td>
                  <td className="px-4 py-3 text-center text-sm text-yellow-700">{totals.late}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      overallPercentage >= 90 ? 'bg-green-100 text-green-700' :
                      overallPercentage >= 75 ? 'bg-blue-100 text-blue-700' :
                      overallPercentage >= 60 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {overallPercentage}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {overallPercentage >= 75 ? (
                      <span className="text-green-600 font-medium">✓ Good</span>
                    ) : overallPercentage >= 60 ? (
                      <span className="text-yellow-600 font-medium">⚠ Average</span>
                    ) : (
                      <span className="text-red-600 font-medium">✗ Poor</span>
                    )}
                  </td>
                </tr>
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
