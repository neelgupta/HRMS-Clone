"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MdPayments, MdTrendingDown, MdTrendingUp, MdMoreTime, MdCardGiftcard } from "react-icons/md";
import { EmployeeLayout } from "@/components/employee";
import { Spinner } from "@/components/ui/loaders/spinner";
import { Modal } from "@/components/ui/modal";
import { fetchEmployeePayroll, type EmployeePayrollMonth } from "@/lib/client/payroll";
import { fetchCompanySummary } from "@/lib/client/company";

function formatCurrency(amount: number | null) {
  if (amount === null) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);
}

function monthLabel(month: number) {
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return labels[month - 1] || String(month);
}

function fiscalMonths() {
  // Apr -> Mar
  return [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
}

function fiscalYearLabel(year: number) {
  return `${year} - ${year + 1}`;
}

function currentFiscalStartYear() {
  const now = new Date();
  return now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1;
}

function toMonthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function formatMonthLong(value: { year: number; month: number }) {
  const date = new Date(value.year, Math.max(0, value.month - 1), 1);
  if (Number.isNaN(date.getTime())) return `${value.year}-${value.month}`;
  return new Intl.DateTimeFormat("en-IN", { year: "numeric", month: "long" }).format(date);
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { year: "numeric", month: "short", day: "2-digit" }).format(date);
}

function daysInMonth(year: number, month: number) {
  const d = new Date(year, month, 0);
  if (Number.isNaN(d.getTime())) return null;
  return d.getDate();
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

type CompanySlipInfo = {
  name: string;
  logoUrl: string | null;
  phone: string | null;
  addressLines: string[];
};

type EmployeeSlipInfo = {
  employeeCode: string;
  fullName: string;
  department: string | null;
  designation: string | null;
  dateOfJoining: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  pfNumber: string | null;
  pfUAN: string | null;
  esiNumber: string | null;
  panNumber: string | null;
};

function PayrollSlipModal({
  open,
  onClose,
  month,
  companySlip,
  employeeSlip,
}: {
  open: boolean;
  onClose: () => void;
  month: EmployeePayrollMonth | null;
  companySlip: CompanySlipInfo | null;
  employeeSlip: EmployeeSlipInfo | null;
}) {
  const paidLeave = month ? round2(Math.max(0, month.item.payableDays - month.item.presentDays)) : 0;
  const workingDays = month?.calendar?.workingDays ?? month?.item.workingDays ?? 0;
  const unpaidLeave = month ? round2(Math.max(0, workingDays - month.item.payableDays)) : 0;
  const absentDays = unpaidLeave;
  const totalDays = month ? daysInMonth(month.year, month.month) : null;

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="grid grid-cols-[160px_12px_1fr] items-start gap-2 text-sm">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-slate-400 dark:text-slate-500">:</span>
      <span className="min-w-0 font-medium text-slate-900 dark:text-white">{value}</span>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title="Salary Slip" size="xl">
      {month ? (
        <div className="p-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900/10">
            <p className="text-center text-base font-semibold text-slate-900 dark:text-white">
              Salary Slip - {formatMonthLong({ year: month.year, month: month.month })}
            </p>
            <div className="mt-4 h-px w-full bg-slate-200 dark:bg-slate-700" />

            <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                {companySlip?.logoUrl ? (
                  <img
                    src={companySlip.logoUrl}
                    alt="Company logo"
                    className="h-14 w-14 rounded-2xl border border-slate-200 bg-white object-contain p-2 dark:border-slate-700 dark:bg-slate-800"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-lg font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {(companySlip?.name?.trim()?.[0] || "C").toUpperCase()}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{companySlip?.name || "Company"}</p>
                  {companySlip?.addressLines?.length ? (
                    <div className="mt-1 space-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {companySlip.addressLines.map((line) => (
                        <p key={line} className="truncate">
                          {line}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Company address not set</p>
                  )}
                  {companySlip?.phone ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{companySlip.phone}</p> : null}
                </div>
              </div>

              <div className="w-full max-w-sm rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-right dark:border-emerald-900/40 dark:bg-emerald-900/20">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-200">Net Payable Amount</p>
                <p className="mt-1 text-xl font-bold text-emerald-800 dark:text-emerald-100">{formatCurrency(month.item.netPay)}</p>
              </div>
            </div>

            <div className="mt-6 h-px w-full bg-slate-200 dark:bg-slate-700" />

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <Row label="Employee ID" value={employeeSlip?.employeeCode || "—"} />
                <Row label="Employee Name" value={employeeSlip?.fullName || "—"} />
                <Row label="Department" value={employeeSlip?.department || "—"} />
                <Row label="Job Title" value={employeeSlip?.designation || "—"} />
                <Row label="Bank Name" value={employeeSlip?.bankName || "—"} />
                <Row label="Bank A/C Number" value={employeeSlip?.bankAccountNumber || "—"} />
                <Row label="PF A/C Number" value={employeeSlip?.pfNumber || "—"} />
                <Row label="UAN Number" value={employeeSlip?.pfUAN || "—"} />
                <Row label="ESI Number" value={employeeSlip?.esiNumber || "—"} />
                <Row label="PAN Number" value={employeeSlip?.panNumber || "—"} />
              </div>

              <div className="space-y-3">
                <Row label="Joining Date" value={formatDate(employeeSlip?.dateOfJoining ?? null)} />
                <Row label="Total Days" value={totalDays !== null ? String(totalDays) : "—"} />
                <Row label="Working Days" value={String(workingDays)} />
                <Row label="Present Days" value={String(month.item.presentDays)} />
                <Row label="Holiday Days" value={month.calendar ? String(month.calendar.holidays) : "—"} />
                <Row label="Weekoff Days" value={month.calendar ? String(month.calendar.weekOffDays) : "—"} />
                <Row label="Paid Leave" value={String(paidLeave)} />
                <Row label="Unpaid Leave" value={String(unpaidLeave)} />
                <Row label="Paid Days" value={String(month.item.payableDays)} />
                <Row label="Absent Days" value={String(absentDays)} />
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Salary Summary</p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/30">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Basic Salary</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(month.item.basicSalary)}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/30">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Gross Pay</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(month.item.grossPay)}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/30">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Deductions</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(month.item.deductions)}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/30">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Net Pay</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(month.item.netPay)}</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">Status: {month.status}</p>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

export default function EmployeePayrollPage() {
  const [year, setYear] = useState(currentFiscalStartYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchEmployeePayroll>>["data"] | null>(null);
  const [selected, setSelected] = useState<EmployeePayrollMonth | null>(null);
  const [companySlip, setCompanySlip] = useState<CompanySlipInfo | null>(null);
  const [employeeSlip, setEmployeeSlip] = useState<EmployeeSlipInfo | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [companyRes, employeeRes] = await Promise.all([
          fetchCompanySummary(),
          fetch("/api/employees/me", { credentials: "include" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);

        if (!mounted) return;

        const company = companyRes.company;
        if (company) {
          const address = company.addresses?.[0];
          const addressLines = address
            ? [
                [address.addressLine1, address.addressLine2].filter(Boolean).join(", "),
                [address.city, address.state, address.pincode].filter(Boolean).join(", "),
                [address.country].filter(Boolean).join(", "),
              ].filter((line) => line.trim().length > 0)
            : [];

          setCompanySlip({
            name: company.name || "Company",
            logoUrl: company.logoUrl?.trim() ? company.logoUrl : null,
            phone: company.primaryPhone?.trim() ? company.primaryPhone : null,
            addressLines,
          });
        }

        if (employeeRes?.employee) {
          const e = employeeRes.employee as {
            employeeCode: string;
            firstName: string;
            lastName: string;
            department: string | null;
            designation: string | null;
            dateOfJoining: string | null;
            bankName: string | null;
            bankAccountNumber: string | null;
            pfNumber: string | null;
            pfUAN: string | null;
            esiNumber: string | null;
            panNumber: string | null;
          };
          setEmployeeSlip({
            employeeCode: e.employeeCode,
            fullName: `${e.firstName} ${e.lastName}`.trim(),
            department: e.department,
            designation: e.designation,
            dateOfJoining: e.dateOfJoining,
            bankName: e.bankName,
            bankAccountNumber: e.bankAccountNumber,
            pfNumber: e.pfNumber,
            pfUAN: e.pfUAN,
            esiNumber: e.esiNumber,
            panNumber: e.panNumber,
          });
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchEmployeePayroll(year);
        if (!mounted) return;
        if (res.error) {
          setError(res.error);
          setData(null);
          return;
        }
        setData(res.data ?? null);
      } catch {
        if (mounted) {
          setError("Failed to load payroll.");
          setData(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [year]);

  const employeeName = data?.employee ? `${data.employee.firstName} ${data.employee.lastName}` : "Employee";
  const employeeInitials = data?.employee
    ? `${data.employee.firstName.charAt(0)}${data.employee.lastName.charAt(0)}`
    : "E";

  const monthsByKey = useMemo(() => {
    const map = new Map<string, EmployeePayrollMonth>();
    for (const m of data?.payroll ?? []) {
      map.set(toMonthKey(m.year, m.month), m);
    }
    return map;
  }, [data]);

  const ytd = useMemo(() => {
    const list = data?.payroll ?? [];
    return list.reduce(
      (acc, m) => {
        acc.fixPay += m.item.grossPay ?? 0;
        acc.deductions += m.item.deductions ?? 0;
        return acc;
      },
      { fixPay: 0, deductions: 0, overtime: 0, bonus: 0 },
    );
  }, [data]);

  const chartData = useMemo(() => {
    // fiscal year chart: Apr(year) -> Mar(year+1)
    const months = fiscalMonths();
    return months.map((m) => {
      const y = m >= 4 ? year : year + 1;
      const key = toMonthKey(y, m);
      const found = monthsByKey.get(key);
      return {
        month: monthLabel(m),
        earning: found?.item.grossPay ?? 0,
        deduction: found?.item.deductions ?? 0,
      };
    });
  }, [monthsByKey, year]);

  const recent = useMemo(() => {
    const list = [...(data?.payroll ?? [])];
    list.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
    return list.slice(0, 6);
  }, [data]);

  return (
    <EmployeeLayout title="Payroll" subtitle="Manage your salary slips and monthly payroll">
      <div className="space-y-6">
        <div className="flex items-center justify-end">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-900"
          >
            {[year - 1, year, year + 1].map((y) => (
              <option key={y} value={y}>
                {fiscalYearLabel(y)}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="py-14">
            <Spinner className="mx-auto text-indigo-600" label="Loading" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {error}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
                  <div className="absolute inset-0 opacity-60" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.35), transparent 45%), radial-gradient(circle at 80% 0%, rgba(168,85,247,0.35), transparent 40%)" }} />
                  <div className="relative flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-lg font-bold">
                      {employeeInitials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">Let&apos;s Manage Your Payroll</p>
                      <p className="mt-1 truncate text-xs text-slate-200">{employeeName}</p>
                      <p className="mt-1 text-xs text-slate-300">{data?.employee.department || "—"} • {data?.employee.designation || "—"}</p>
                      <p className="mt-2 text-xs text-slate-200">
                        Base Salary: <span className="font-semibold text-white">{formatCurrency(data?.employee.basicSalary ?? null)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
                  <MdTrendingUp className="text-xl" />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(ytd.fixPay)}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Total Fix Pay</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300">
                  <MdTrendingDown className="text-xl" />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(ytd.deductions)}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Total Deductions</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
                  <MdMoreTime className="text-xl" />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(ytd.overtime)}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Total Overtime</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
                  <MdCardGiftcard className="text-xl" />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(ytd.bonus)}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Total Bonus</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Earnings and Deductions</p>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded bg-indigo-500" /> Earning
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded bg-rose-400" /> Deduction
                  </span>
                </div>
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={18}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12 }} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const earning = payload.find((p) => p.dataKey === "earning")?.value as number | undefined;
                        const deduction = payload.find((p) => p.dataKey === "deduction")?.value as number | undefined;
                        return (
                          <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
                            <p className="font-semibold text-slate-900 dark:text-white">{label}</p>
                            <p className="mt-2 text-slate-600 dark:text-slate-300">Earning: <span className="font-semibold">{formatCurrency(earning ?? 0)}</span></p>
                            <p className="text-slate-600 dark:text-slate-300">Deduction: <span className="font-semibold">{formatCurrency(deduction ?? 0)}</span></p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="earning" fill="#6366F1" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="deduction" fill="#FB7185" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Recent Salary</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-900/20">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Month Year</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Earning</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Deduction</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Net Payable Amount</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {recent.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-14 text-center">
                          <div className="mx-auto max-w-sm">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-200">
                              <MdPayments className="text-2xl" />
                            </div>
                            <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">No data to display</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Your salary slips will appear here after payroll is generated.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      recent.map((m) => (
                        <tr key={m.runId} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40">
                          <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                            {monthLabel(m.month)} {m.year}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{formatCurrency(m.item.grossPay)}</td>
                          <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{formatCurrency(m.item.deductions)}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(m.item.netPay)}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelected(m)}
                              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                              View Slip
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <PayrollSlipModal
          open={!!selected}
          onClose={() => setSelected(null)}
          month={selected}
          companySlip={companySlip}
          employeeSlip={employeeSlip}
        />
      </div>
    </EmployeeLayout>
  );
}
