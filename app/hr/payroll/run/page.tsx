"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { MdPlayArrow, MdArrowBack, MdCheck, MdClose } from "react-icons/md";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function RunPayrollPage() {
  const router = useRouter();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [processing, setProcessing] = useState(false);

  async function handleRunPayroll() {
    setProcessing(true);
    try {
      const res = await fetch("/api/payroll/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year }),
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Payroll processed successfully!");
        router.push("/hr/payroll");
      } else {
        toast.error(data.message || "Failed to run payroll");
      }
    } catch (error) {
      toast.error("Failed to run payroll");
    } finally {
      setProcessing(false);
    }
  }

  // Get last 12 months for selection
  const availableYears = [2026, 2025, 2024];

  return (
    <div className="space-y-8">
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
            Run Payroll
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Process salary for the selected month
          </p>
        </div>
      </div>

      <div className="max-w-xl">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              <MdPlayArrow className="text-2xl" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Select Period</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Choose month and year to process payroll</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Month
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                >
                  {monthNames.map((m, idx) => (
                    <option key={idx} value={idx + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Note:</strong> Running payroll will calculate salary for all active employees based on their assigned salary structures. This action cannot be undone.
              </p>
            </div>

            <button
              onClick={handleRunPayroll}
              disabled={processing}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Processing...
                </>
              ) : (
                <>
                  <MdPlayArrow className="text-xl" />
                  Run Payroll for {monthNames[month - 1]} {year}
                </>
              )}
            </button>
          </div>
        </div>

        {/* What will happen */}
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 mt-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">This will:</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <MdCheck className="text-sm text-green-600 dark:text-green-400" />
              </div>
              <span className="text-slate-600 dark:text-slate-400">Calculate working days and attendance</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <MdCheck className="text-sm text-green-600 dark:text-green-400" />
              </div>
              <span className="text-slate-600 dark:text-slate-400">Process leave and LOP deductions</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <MdCheck className="text-sm text-green-600 dark:text-green-400" />
              </div>
              <span className="text-slate-600 dark:text-slate-400">Calculate PF, ESI, TDS deductions</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <MdCheck className="text-sm text-green-600 dark:text-green-400" />
              </div>
              <span className="text-slate-600 dark:text-slate-400">Add overtime and reimbursements</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <MdCheck className="text-sm text-green-600 dark:text-green-400" />
              </div>
              <span className="text-slate-600 dark:text-slate-400">Generate payslips for all employees</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}