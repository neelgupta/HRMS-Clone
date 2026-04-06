"use client";

import { useState, Suspense } from "react";
import { MdEmail, MdSend, MdInbox as MdInboxIcon } from "react-icons/md";
import { EmployeeLayout } from "@/components/employee";

function InboxContent() {
  const [selectedTab, setSelectedTab] = useState<"inbox" | "sent">("inbox");

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
       
        <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
          <MdEmail className="text-lg" />
          Compose
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <button onClick={() => setSelectedTab("inbox")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            selectedTab === "inbox" ? "bg-indigo-600 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          }`}>
          <MdInboxIcon className="text-lg" />
          Inbox
          <span className="px-2 py-0.5 bg-white/20 dark:bg-slate-600/50 rounded-full text-xs">0</span>
        </button>
        <button onClick={() => setSelectedTab("sent")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            selectedTab === "sent" ? "bg-indigo-600 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          }`}>
          <MdSend className="text-lg" />
          Sent
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
            <MdInboxIcon className="text-3xl text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-slate-600 dark:text-slate-300 font-medium">No messages yet</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Messages from HR will appear here</p>
        </div>
      </div>
    </>
  );
}

export default function InboxPage() {
  return (
    <EmployeeLayout title="Inbox" subtitle="Communicate with HR and colleagues">
      <Suspense fallback={<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>}>
        <InboxContent />
      </Suspense>
    </EmployeeLayout>
  );
}
