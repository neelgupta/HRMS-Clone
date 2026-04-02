"use client";

import { useState, Suspense } from "react";
import { MdHelpOutline } from "react-icons/md";
import { EmployeeLayout } from "@/components/employee";

function HelpContent() {
  const [issueTitle, setIssueTitle] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [issueCategory, setIssueCategory] = useState("general");

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 text-left hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-4">
            <MdHelpOutline className="text-2xl text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">General Inquiry</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Policy questions, general help</p>
        </button>
        <button className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 text-left hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mb-4">
            <MdHelpOutline className="text-2xl text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">IT Support</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Technical issues, software help</p>
        </button>
        <button className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 text-left hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center mb-4">
            <MdHelpOutline className="text-2xl text-red-600 dark:text-red-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Report Issue</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Report bugs or system errors</p>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Submit a Support Ticket</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
            <select value={issueCategory} onChange={(e) => setIssueCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white">
              <option value="general">General Inquiry</option>
              <option value="it">IT Support</option>
              <option value="hr">HR Related</option>
              <option value="bug">Bug Report</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
            <input type="text" value={issueTitle} onChange={(e) => setIssueTitle(e.target.value)}
              placeholder="Brief summary of your issue"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea rows={5} value={issueDescription} onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="Describe your issue in detail..."
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"></textarea>
          </div>
          <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors">
            Submit Ticket
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">My Tickets</h2>
        </div>
        <div className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
            <MdHelpOutline className="text-3xl text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-slate-600 dark:text-slate-300 font-medium">No Tickets Submitted</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Your support tickets will appear here</p>
        </div>
      </div>
    </>
  );
}

export default function HelpDeskPage() {
  return (
    <EmployeeLayout title="Help Desk" subtitle="Submit support tickets and get help from HR">
      <Suspense fallback={<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>}>
        <HelpContent />
      </Suspense>
    </EmployeeLayout>
  );
}
