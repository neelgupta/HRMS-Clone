"use client";

import { useState, Suspense } from "react";
import { MdAdd, MdEventNote } from "react-icons/md";
import { EmployeeLayout } from "@/components/employee";

function LeaveContent() {
  const [activeTab, setActiveTab] = useState<"my" | "apply">("my");

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Leave</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your leave requests</p>
        </div>
        <button onClick={() => setActiveTab("apply")}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
          <MdAdd className="text-lg" />
          Apply Leave
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <button onClick={() => setActiveTab("my")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "my" ? "bg-indigo-600 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          }`}>
          My Leaves
        </button>
        <button onClick={() => setActiveTab("apply")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "apply" ? "bg-indigo-600 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          }`}>
          Apply for Leave
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Annual Leave", balance: 12, used: 3, color: "indigo" },
          { label: "Sick Leave", balance: 6, used: 1, color: "emerald" },
          { label: "Casual Leave", balance: 4, used: 2, color: "amber" },
          { label: "Loss of Pay", balance: 0, used: 0, color: "red" },
        ].map((leave) => (
          <div key={leave.label} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">{leave.label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{leave.balance - leave.used} <span className="text-sm font-normal text-slate-400 dark:text-slate-500">/ {leave.balance}</span></p>
            <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(leave.used / leave.balance) * 100}%` }}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {activeTab === "my" ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
              <MdEventNote className="text-3xl text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium">No Leave Records</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Your leave history will appear here</p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Leave Type</label>
                <select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white">
                  <option>Annual Leave</option>
                  <option>Sick Leave</option>
                  <option>Casual Leave</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Number of Days</label>
                <input type="number" min="1" placeholder="e.g., 2" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">From Date</label>
                <input type="date" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">To Date</label>
                <input type="date" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason</label>
                <textarea rows={3} placeholder="Enter reason for leave..." className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white"></textarea>
              </div>
            </div>
            <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors">
              Submit Request
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default function LeavePage() {
  return (
    <EmployeeLayout title="My Leave" subtitle="Manage your leave requests">
      <Suspense fallback={<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>}>
        <LeaveContent />
      </Suspense>
    </EmployeeLayout>
  );
}
