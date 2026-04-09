"use client";

import { EmployeeListItem } from "@/lib/client/employee";

interface EmployeeCardProps {
  employee: EmployeeListItem;
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
  const fullName = `${employee.firstName} ${employee.lastName}`;
  const initials = `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`;
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {employee.photoUrl ? (
            <img
              src={employee.photoUrl}
              alt={fullName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
              <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                {initials}
              </span>
            </div>
          )}
        </div>

        {/* Employee Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
            {fullName}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {employee.designation || "No designation"}
          </p>
        </div>

        {/* Employment Status Badge */}
        <div className="flex-shrink-0">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            employee.employmentStatus === 'Active' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : employee.employmentStatus === 'On Leave'
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
          }`}>
            {employee.employmentStatus}
          </span>
        </div>
      </div>

      {/* Employee Details */}
      <div className="mt-3 space-y-1">
        <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
          <span className="font-medium w-20">ID:</span>
          <span className="truncate">{employee.employeeCode}</span>
        </div>
        
        <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
          <span className="font-medium w-20">Email:</span>
          <span className="truncate">{employee.email}</span>
        </div>

        {employee.phone && (
          <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
            <span className="font-medium w-20">Phone:</span>
            <span className="truncate">{employee.phone}</span>
          </div>
        )}

        {employee.department && (
          <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
            <span className="font-medium w-20">Department:</span>
            <span className="truncate">{employee.department}</span>
          </div>
        )}

        {employee.branch && (
          <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
            <span className="font-medium w-20">Location:</span>
            <span className="truncate">{employee.branch.name}</span>
          </div>
        )}

        <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
          <span className="font-medium w-20">Type:</span>
          <span className="truncate">{employee.employmentType}</span>
        </div>
      </div>
    </div>
  );
}
