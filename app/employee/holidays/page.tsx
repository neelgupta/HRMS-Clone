"use client";

import { Suspense } from "react";
import { MdCalendarMonth } from "react-icons/md";
import { EmployeeLayout } from "@/components/employee";

const holidays = [
  { date: "2026-01-26", name: "Republic Day", day: "Monday" },
  { date: "2026-03-10", name: "Holi", day: "Tuesday" },
  { date: "2026-04-03", name: "Good Friday", day: "Friday" },
  { date: "2026-08-15", name: "Independence Day", day: "Saturday" },
  { date: "2026-10-02", name: "Gandhi Jayanti", day: "Friday" },
  { date: "2026-11-04", name: "Diwali", day: "Wednesday" },
  { date: "2026-12-25", name: "Christmas", day: "Friday" },
];

function HolidaysContent() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Holidays</p>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{holidays.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">This Month</p>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">0</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">Upcoming</p>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">1</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Holiday Calendar 2026</h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {holidays.map((holiday, index) => {
            const holidayDate = new Date(holiday.date);
            const isUpcoming = holidayDate > new Date();
            return (
              <div key={index} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isUpcoming ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400" : "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
                }`}>
                  <MdCalendarMonth className="text-xl" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white">{holiday.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{holiday.day}</p>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${isUpcoming ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}`}>
                    {holidayDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                  {isUpcoming && (
                    <span className="text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full">Upcoming</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default function HolidaysPage() {
  return (
    <EmployeeLayout title="My Holidays" subtitle="View company holidays and leave calendar">
      <Suspense fallback={<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>}>
        <HolidaysContent />
      </Suspense>
    </EmployeeLayout>
  );
}
