"use client";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { PayrollMonthDetail } from "@/components/payroll/payroll-month-detail";

function isValidMonth(value: string) {
  return /^\d{4}-\d{2}$/.test(value);
}

export default function PayrollMonthPage({ params }: { params: { month: string } }) {
  const router = useRouter();
  const month = params.month;

  if (!isValidMonth(month)) {
    return (
      <DashboardLayout title="Payroll" subtitle="Invalid month">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-600 dark:text-slate-400">Month must be in YYYY-MM format.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Payroll" subtitle={`Payroll details for ${month}`}>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push("/dashboard/hr/payroll")}
          className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          ← Back to Months
        </button>
      </div>

      <PayrollMonthDetail
        month={month}
        onChangeMonth={(m) => {
          if (!isValidMonth(m)) return;
          router.push(`/dashboard/hr/payroll/${m}`);
        }}
      />
    </DashboardLayout>
  );
}

