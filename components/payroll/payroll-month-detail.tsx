"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MdDownload, MdPayments, MdRefresh, MdShare, MdVisibility } from "react-icons/md";
import { Spinner } from "@/components/ui/loaders/spinner";
import { Modal } from "@/components/ui/modal";
import { fetchCompanySummary } from "@/lib/client/company";
import { dismissToast, showError, showLoading, showSuccess } from "@/lib/toast";
import { downloadPayrollPdf, fetchPayroll, generatePayroll, setPayrollShared } from "@/lib/client/payroll";
import type { PayrollApiResult } from "@/lib/types/payroll";

function formatCurrency(amount: number | null) {
  if (amount === null) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);
}

function formatMonthLong(value: string) {
  const [y, m] = value.split("-").map((v) => Number(v));
  if (!Number.isFinite(y) || !Number.isFinite(m)) return value;
  const date = new Date(y, Math.max(0, m - 1), 1);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { year: "numeric", month: "long" }).format(date);
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { year: "numeric", month: "short", day: "2-digit" }).format(date);
}

function daysInMonth(month: string) {
  const [y, m] = month.split("-").map((v) => Number(v));
  if (!Number.isFinite(y) || !Number.isFinite(m)) return null;
  const d = new Date(y, m, 0);
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

export function PayrollMonthDetail({
  month,
  onChangeMonth,
  showMonthPicker = true,
  showRefreshButton = true,
  showGenerateButton = true,
  showDownloadButton = true,
}: {
  month: string;
  onChangeMonth?: (month: string) => void;
  showMonthPicker?: boolean;
  showRefreshButton?: boolean;
  showGenerateButton?: boolean;
  showDownloadButton?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [data, setData] = useState<PayrollApiResult | null>(null);
  const [selectedRow, setSelectedRow] = useState<PayrollApiResult["rows"][number] | null>(null);
  const [companySlip, setCompanySlip] = useState<CompanySlipInfo | null>(null);
  const [employeeSlip, setEmployeeSlip] = useState<EmployeeSlipInfo | null>(null);
  const [employeeSlipLoading, setEmployeeSlipLoading] = useState(false);

  const missingSalaryCount = useMemo(() => {
    if (!data) return 0;
    return data.rows.filter((r) => r.basicSalary === null).length;
  }, [data]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchPayroll(month);
      if (result.error) {
        showError(result.error);
        return;
      }
      if (result.data) setData(result.data);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const result = await fetchCompanySummary();
        const company = result.company;
        if (!mounted || !company) return;

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
      if (!selectedRow) {
        setEmployeeSlip(null);
        return;
      }
      setEmployeeSlipLoading(true);
      try {
        const res = await fetch(`/api/employees/${selectedRow.employee.id}`, { credentials: "include" });
        if (!res.ok) return;
        const employee = (await res.json()) as {
          employeeCode?: string;
          firstName?: string;
          lastName?: string;
          department?: string | null;
          designation?: string | null;
          dateOfJoining?: string | null;
          bankName?: string | null;
          bankAccountNumber?: string | null;
          pfNumber?: string | null;
          pfUAN?: string | null;
          esiNumber?: string | null;
          panNumber?: string | null;
        };
        if (!mounted) return;

        setEmployeeSlip({
          employeeCode: employee.employeeCode || selectedRow.employee.employeeCode,
          fullName: `${employee.firstName || selectedRow.employee.firstName} ${employee.lastName || selectedRow.employee.lastName}`.trim(),
          department: employee.department ?? selectedRow.employee.departmentName ?? null,
          designation: employee.designation ?? selectedRow.employee.designationName ?? null,
          dateOfJoining: employee.dateOfJoining ?? selectedRow.employee.dateOfJoining ?? null,
          bankName: employee.bankName ?? selectedRow.employee.bankName ?? null,
          bankAccountNumber: employee.bankAccountNumber ?? selectedRow.employee.bankAccountNumber ?? null,
          pfNumber: employee.pfNumber ?? selectedRow.employee.pfNumber ?? null,
          pfUAN: employee.pfUAN ?? selectedRow.employee.pfUAN ?? null,
          esiNumber: employee.esiNumber ?? selectedRow.employee.esiNumber ?? null,
          panNumber: employee.panNumber ?? selectedRow.employee.panNumber ?? null,
        });
      } catch {
        // ignore
      } finally {
        if (mounted) setEmployeeSlipLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedRow]);

  const handleGenerate = async () => {
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
      await load();
    } catch {
      dismissToast(toastId);
      showError("Failed to generate payroll.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    const toastId = showLoading("Preparing PDF...");
    try {
      const result = await downloadPayrollPdf(month);
      if (result.error) {
        dismissToast(toastId);
        showError(result.error);
        return;
      }
      dismissToast(toastId);
      showSuccess("PDF downloaded.");
    } catch {
      dismissToast(toastId);
      showError("Failed to download PDF.");
    } finally {
      setDownloading(false);
    }
  };

  const handleToggleShare = async () => {
    if (!data?.run) {
      showError("Generate payroll first to share with employees.");
      return;
    }
    setSharing(true);
    const nextShare = !data.run.sharedWithEmployees;
    const toastId = showLoading(nextShare ? "Sharing with employees..." : "Unsharing from employees...");
    try {
      const result = await setPayrollShared(month, nextShare);
      if (result.error) {
        dismissToast(toastId);
        showError(result.error);
        return;
      }
      dismissToast(toastId);
      showSuccess(nextShare ? "Shared with employees." : "Unshared from employees.");
      await load();
    } catch {
      dismissToast(toastId);
      showError("Failed to update share settings.");
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {showMonthPicker ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Month</label>
            <input
              type="month"
              value={month}
              onChange={(e) => onChangeMonth?.(e.target.value)}
              className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900"
            />
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-3">
          {showRefreshButton ? (
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <MdRefresh className="text-lg" />
              Refresh
            </button>
          ) : null}

          {data?.run ? (
            <button
              type="button"
              onClick={handleToggleShare}
              disabled={sharing || loading}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
                data.run.sharedWithEmployees
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200 dark:hover:bg-emerald-900/30"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              }`}
              title={data.run.sharedWithEmployees ? "Employees can view this month's slip" : "Share this month's slip to employees"}
            >
              {sharing ? <Spinner className="text-indigo-600 dark:text-indigo-300" label="Sharing" /> : <MdShare className="text-lg" />}
              {data.run.sharedWithEmployees ? "Shared" : "Share"}
            </button>
          ) : null}

          {showDownloadButton ? (
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading || loading || !data?.run}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              title={data?.run ? "Download payroll PDF" : "Generate payroll to download PDF"}
            >
              {downloading ? <Spinner className="text-indigo-600 dark:text-indigo-300" label="Downloading" /> : <MdDownload className="text-lg" />}
              Download PDF
            </button>
          ) : null}

          {showGenerateButton ? (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-indigo-900/50"
            >
              {generating ? <Spinner className="text-white" label="Generating" /> : <MdPayments className="text-lg" />}
              Generate Payroll
            </button>
          ) : null}
        </div>
      </div>

      {missingSalaryCount > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
          {missingSalaryCount} employee(s) have no `basicSalary` set, so net pay is shown as “—”.
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-700">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Payroll Rows</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {data?.run
              ? `Working days (company): ${data.run.workingDays}, Holidays: ${data.run.holidays}, Week offs: ${data.run.weekOffDays}`
              : "No payroll generated for this month yet."}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Employee
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Code
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Basic Salary
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Working Days
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Payable Days
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Net Pay
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Slip
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Spinner className="mx-auto text-indigo-600" label="Loading" />
                  </td>
                </tr>
              ) : !data || data.rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">No payroll rows to show.</p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      Click “Generate Payroll” to compute payroll from attendance for this month.
                    </p>
                  </td>
                </tr>
              ) : (
                data.rows.map((row) => (
                  <tr key={row.employee.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {row.employee.firstName} {row.employee.lastName}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-slate-600 dark:text-slate-400">{row.employee.employeeCode}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-slate-700 dark:text-slate-300">{formatCurrency(row.basicSalary)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-slate-700 dark:text-slate-300">{row.workingDays}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-slate-700 dark:text-slate-300">{row.payableDays}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(row.netPay)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedRow(row)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        title="View salary slip"
                      >
                        <MdVisibility className="text-xl" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        title="Salary Slip"
        size="xl"
      >
        {selectedRow ? (
          <div className="p-6">

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900/10">

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
                    {companySlip?.phone ? (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{companySlip.phone}</p>
                    ) : null}
                  </div>
                </div>

                <div className="w-full max-w-sm rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-right dark:border-emerald-900/40 dark:bg-emerald-900/20">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-200">Net Payable Amount</p>
                  <p className="mt-1 text-xl font-bold text-emerald-800 dark:text-emerald-100">{formatCurrency(selectedRow.netPay)}</p>
                </div>
              </div>

              <div className="mt-6 h-px w-full bg-slate-200 dark:bg-slate-700" />

              {(() => {
                const totalDays = daysInMonth(month);
                const paidLeave = round2(Math.max(0, selectedRow.payableDays - selectedRow.presentDays));
                const unpaidLeave = round2(Math.max(0, selectedRow.workingDays - selectedRow.payableDays));
                const absentDays = unpaidLeave;

                const leftItems: Array<[string, string]> = [
                  ["Employee ID", employeeSlip?.employeeCode || selectedRow.employee.employeeCode],
                  ["Employee Name", employeeSlip?.fullName || `${selectedRow.employee.firstName} ${selectedRow.employee.lastName}`.trim()],
                  ["Department", employeeSlip?.department || selectedRow.employee.departmentName || "—"],
                  ["Job Title", employeeSlip?.designation || selectedRow.employee.designationName || "—"],
                  ["Bank Name", employeeSlip?.bankName || selectedRow.employee.bankName || "—"],
                  ["Bank A/C Number", employeeSlip?.bankAccountNumber || selectedRow.employee.bankAccountNumber || "—"],
                  ["PF A/C Number", employeeSlip?.pfNumber || selectedRow.employee.pfNumber || "—"],
                  ["UAN Number", employeeSlip?.pfUAN || selectedRow.employee.pfUAN || "—"],
                  ["ESI Number", employeeSlip?.esiNumber || selectedRow.employee.esiNumber || "—"],
                  ["PAN Number", employeeSlip?.panNumber || selectedRow.employee.panNumber || "—"],
                ];

                const rightItems: Array<[string, string]> = [
                  ["Joining Date", formatDate(employeeSlip?.dateOfJoining ?? selectedRow.employee.dateOfJoining)],
                  ["Total Days", totalDays !== null ? String(totalDays) : "—"],
                  ["Working Days", String(selectedRow.workingDays)],
                  ["Present Days", String(selectedRow.presentDays)],
                  ["Holiday Days", data?.run ? String(data.run.holidays) : "—"],
                  ["Weekoff Days", data?.run ? String(data.run.weekOffDays) : "—"],
                  ["Paid Leave", String(paidLeave)],
                  ["Unpaid Leave", String(unpaidLeave)],
                  ["Paid Days", String(selectedRow.payableDays)],
                  ["Absent Days", String(absentDays)],
                ];

                const Row = ({ label, value }: { label: string; value: string }) => (
                  <div className="grid grid-cols-[160px_12px_1fr] items-start gap-2 text-sm">
                    <span className="text-slate-500 dark:text-slate-400">{label}</span>
                    <span className="text-slate-400 dark:text-slate-500">:</span>
                    <span className="min-w-0 font-medium text-slate-900 dark:text-white">{value}</span>
                  </div>
                );

                return (
                  <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {employeeSlipLoading ? (
                      <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/20 dark:text-slate-300">
                        Loading employee details…
                      </div>
                    ) : null}
                    <div className="space-y-3">
                      {leftItems.map(([label, value]) => (
                        <Row key={label} label={label} value={value} />
                      ))}
                    </div>
                    <div className="space-y-3">
                      {rightItems.map(([label, value]) => (
                        <Row key={label} label={label} value={value} />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
