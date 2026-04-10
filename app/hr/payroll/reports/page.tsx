"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MdAssessment, MdDownload, MdTrendingUp, MdMoney, MdPeople, MdArrowBack } from "react-icons/md";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function PayrollReportsPage() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <MdArrowBack className="text-xl" />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Payroll Reports
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              View and export payroll reports and analytics
            </p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-300/50">
          <MdDownload className="text-lg" />
          Export Report
        </button>
      </div>

      <div className="flex flex-wrap gap-4">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          {months.map((month, index) => (
            <option key={month} value={index + 1}>{month}</option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          {[2026, 2025, 2024].map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <MdPeople className="text-2xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Employees</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">0</p>
            </div>
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <MdMoney className="text-2xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Earnings</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">₹0</p>
            </div>
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <MdTrendingUp className="text-2xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Deductions</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">₹0</p>
            </div>
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <MdAssessment className="text-2xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Net Payout</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">₹0</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Deductions Breakdown</h2>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <MdAssessment className="text-3xl text-slate-400" />
            </div>
            <h3 className="font-medium text-slate-900 dark:text-white">No data available</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Run payroll to see deduction breakdown
            </p>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Monthly Trend</h2>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <MdTrendingUp className="text-3xl text-slate-400" />
            </div>
            <h3 className="font-medium text-slate-900 dark:text-white">No data available</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Run payroll to see monthly trends
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Detailed Report</h2>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <MdDownload className="text-3xl text-slate-400" />
          </div>
          <h3 className="font-medium text-slate-900 dark:text-white">No payroll run data</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Run payroll to generate detailed reports
          </p>
        </div>
      </div>
    </div>
  );
}