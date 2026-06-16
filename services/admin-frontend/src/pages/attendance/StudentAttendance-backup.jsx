import { useState } from "react";
import { Users } from "lucide-react";

export default function StudentAttendance() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="w-6 h-6" />
          Student Attendance - Test
        </h1>
        <p className="text-gray-600 mt-1">If you see this, the page is loading correctly</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-8">
        <p className="text-lg text-gray-700">
          ✅ Page is rendering successfully!
        </p>
      </div>
    </div>
  );
}
