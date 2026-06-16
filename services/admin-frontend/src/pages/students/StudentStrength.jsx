import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, TrendingUp, Printer, Download } from "lucide-react";
import { studentsApi } from "../../services/api";

export default function StudentStrength() {
  const [filters, setFilters] = useState({
    session: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
  });

  const { data: strengthData, isLoading } = useQuery({
    queryKey: ['studentStrength', filters],
    queryFn: () => studentsApi.getStrength(filters),
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!strengthData?.results) return;
    
    const csvContent = [
      ['Class', 'Total', 'Boys', 'Girls', 'Active', 'Inactive'].join(','),
      ...strengthData.results.map(item => 
        [item.class_name, item.total, item.boys, item.girls, item.active, item.inactive].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-strength-${filters.session}.csv`;
    a.click();
  };

  const totalStats = strengthData?.results?.reduce((acc, item) => ({
    total: acc.total + item.total,
    boys: acc.boys + item.boys,
    girls: acc.girls + item.girls,
    active: acc.active + item.active,
    inactive: acc.inactive + item.inactive,
  }), { total: 0, boys: 0, girls: 0, active: 0, inactive: 0 }) || { total: 0, boys: 0, girls: 0, active: 0, inactive: 0 };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-6 h-6" />
              Student Strength Report
            </h1>
            <p className="text-gray-600 mt-1">Class-wise student distribution and statistics</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 print:hidden">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Academic Session
            </label>
            <input
              type="text"
              value={filters.session}
              onChange={(e) => setFilters({ ...filters, session: e.target.value })}
              placeholder="e.g. 2024-2025"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Students</p>
              <p className="text-3xl font-bold mt-2">{totalStats.total}</p>
            </div>
            <Users className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Boys</p>
              <p className="text-3xl font-bold mt-2">{totalStats.boys}</p>
              <p className="text-green-100 text-xs mt-1">
                {totalStats.total > 0 ? ((totalStats.boys / totalStats.total) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm font-medium">Girls</p>
              <p className="text-3xl font-bold mt-2">{totalStats.girls}</p>
              <p className="text-pink-100 text-xs mt-1">
                {totalStats.total > 0 ? ((totalStats.girls / totalStats.total) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-pink-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Active Students</p>
              <p className="text-3xl font-bold mt-2">{totalStats.active}</p>
              <p className="text-purple-100 text-xs mt-1">
                {totalStats.total > 0 ? ((totalStats.active / totalStats.total) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <Users className="w-12 h-12 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Class-wise Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Boys
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Girls
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inactive
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Boy %
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Girl %
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    Loading strength data...
                  </td>
                </tr>
              ) : strengthData?.results?.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No student data available
                  </td>
                </tr>
              ) : (
                <>
                  {strengthData?.results?.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {item.class_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center font-semibold text-blue-600">
                        {item.total}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-gray-900">
                        {item.boys}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-gray-900">
                        {item.girls}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-green-600">
                        {item.active}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-red-600">
                        {item.inactive}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-gray-600">
                        {item.total > 0 ? ((item.boys / item.total) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-gray-600">
                        {item.total > 0 ? ((item.girls / item.total) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 font-bold">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      TOTAL
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-blue-600">
                      {totalStats.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-900">
                      {totalStats.boys}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-900">
                      {totalStats.girls}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-green-600">
                      {totalStats.active}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-red-600">
                      {totalStats.inactive}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-600">
                      {totalStats.total > 0 ? ((totalStats.boys / totalStats.total) * 100).toFixed(1) : 0}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-600">
                      {totalStats.total > 0 ? ((totalStats.girls / totalStats.total) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
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
