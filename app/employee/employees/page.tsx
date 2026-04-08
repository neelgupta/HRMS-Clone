"use client";

import { Suspense } from "react";
import { MdPeople } from "react-icons/md";
import { EmployeeLayout } from "@/components/employee";

function EmployeesContent() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-12 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
          <MdPeople className="text-3xl text-slate-400 dark:text-slate-500" />
        </div>
        <p className="text-slate-600 dark:text-slate-300 font-medium">Employee Directory Coming Soon</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">You will be able to view and search employees here</p>
      </div>
    </div>
  );
}

export default function EmployeesPage() {
  return (
    <EmployeeLayout title="Employee Directory" subtitle="View your colleagues and team members">
      <Suspense fallback={<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>}>
        <EmployeesContent />
      </Suspense>
    </EmployeeLayout>
  );
}
