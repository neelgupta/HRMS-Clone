"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MdPayments } from "react-icons/md";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Spinner } from "@/components/ui/loaders/spinner";
import { PayrollMonthDetail } from "@/components/payroll/payroll-month-detail";
import { generatePayroll } from "@/lib/client/payroll";
import { dismissToast, showError, showLoading, showSuccess } from "@/lib/toast";

function currentMonthYyyyMm(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function isValidMonth(value: string) {
  return /^\d{4}-\d{2}$/.test(value);
}

export default function PayrollGeneratePage() {
  const router = useRouter();
  const defaultMonth = useMemo(() => currentMonthYyyyMm(), []);
  const [month, setMonth] = useState(defaultMonth);
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleGenerate = async () => {
    if (!isValidMonth(month)) {
      showError("Month must be in YYYY-MM format.");
      return;
    }
    setGenerating(true);
    const toastId = showLoading("Generating payroll...");
    try {
      const result = await generatePayroll(month, true);
      if (result.error) {
        dismissToast(toastId);
        showError(result.error);
        return;
      }
      dismissToast(toastId);
      showSuccess("Payroll generated.");
      setShowPreview(true);
    } catch {
      dismissToast(toastId);
      showError("Failed to generate payroll.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <DashboardLayout title="Payroll" subtitle="Generate payroll, preview, and download PDF">
      <div className="space-y-6">
        <div>
          <button
            type="button"
            onClick={() => router.push("/dashboard/hr/payroll")}
            className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            ← Back to Payroll
          </button>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Select Month</label>
              <input
                type="month"
                value={month}
                onChange={(e) => {
                  setMonth(e.target.value);
                  setShowPreview(false);
                }}
                className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900"
              />
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-indigo-900/50"
            >
              {generating ? <Spinner className="text-white" label="Generating" /> : <MdPayments className="text-lg" />}
              Generate Payroll
            </button>
          </div>

          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            After generating, a preview will appear below. Use “Download PDF” in the preview to export.
          </p>
        </div>

        {showPreview ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Preview</p>
            <PayrollMonthDetail month={month} showMonthPicker={false} showGenerateButton={false} />
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
