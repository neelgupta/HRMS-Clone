"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import {
  MdDownload,
  MdReceipt,
  MdAccountBalance,
  MdTrendingUp,
  MdTrendingDown,
  MdPrint,
  MdFilePresent,
} from "react-icons/md";
import { EmployeeLayout } from "@/components/employee";

type Payslip = {
  id: string;
  month: number;
  year: number;
  basicSalary: number;
  grossPay: number;
  deductions: number;
  netPay: number;
  status: string;
};

type YTDData = {
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  totalTax: number;
  estimatedTax: number;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function monthName(month: number): string {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return months[month - 1] || "";
}

export default function PayslipsPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [profile, setProfile] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [payslipRes, profileRes, companyRes] = await Promise.all([
          fetch("/api/payroll/employee", { credentials: "include" }),
          fetch("/api/employees/me", { credentials: "include" }),
          fetch("/api/company", { credentials: "include" }),
        ]);

        if (payslipRes.ok) {
          const data = await payslipRes.json();
          const slips = (data.payroll || []).map((p: any) => ({
            id: p.runId,
            month: p.month,
            year: p.year,
            basicSalary: p.item.basicSalary,
            grossPay: p.item.grossPay,
            deductions: p.item.deductions,
            netPay: p.item.netPay,
            status: p.status,
          }));
          setPayslips(slips);
        }
        if (profileRes.ok) {
          setProfile(profileRes.json().then((d) => d.employee));
        }
        if (companyRes.ok) {
          setCompany(companyRes.json().then((d) => d.company));
        }
      } catch {
        toast.error("Failed to load payslips");
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, []);

  const ytdData = useMemo<YTDData>(() => {
    return payslips.reduce(
      (acc, p) => ({
        totalGross: acc.totalGross + p.grossPay,
        totalDeductions: acc.totalDeductions + p.deductions,
        totalNet: acc.totalNet + p.netPay,
        totalTax: acc.totalTax + (p.deductions * 0.3),
        estimatedTax: acc.estimatedTax + (p.grossPay * 0.2),
      }),
      { totalGross: 0, totalDeductions: 0, totalNet: 0, totalTax: 0, estimatedTax: 0 }
    );
  }, [payslips]);

  const handleDownload = (payslip: Payslip) => {
    const content = `
PAYSLIP - ${monthName(payslip.month)} ${payslip.year}
==============================================

Employee: ${profile?.firstName} ${profile?.lastName}
Employee Code: ${profile?.employeeCode}

EARNINGS:
Basic Salary: ${formatCurrency(payslip.basicSalary)}
Gross Pay: ${formatCurrency(payslip.grossPay)}

DEDUCTIONS:
Total Deductions: ${formatCurrency(payslip.deductions)}

NET PAY: ${formatCurrency(payslip.netPay)}

Status: ${payslip.status}
Company: ${company?.name || "Company"}
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Payslip_${monthName(payslip.month)}_${payslip.year}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Payslip downloaded");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <EmployeeLayout title="Payslip Access" subtitle="View and download your monthly payslips">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <MdReceipt className="text-xl" />
              </div>
              <p className="text-sm text-indigo-100">Total Payslips</p>
            </div>
            <p className="text-2xl font-bold">{payslips.length}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <MdTrendingUp className="text-emerald-600 dark:text-emerald-400 text-xl" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">YTD Gross</p>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(ytdData.totalGross)}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <MdTrendingDown className="text-rose-600 dark:text-rose-400 text-xl" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">YTD Deductions</p>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(ytdData.totalDeductions)}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <MdAccountBalance className="text-amber-600 dark:text-amber-400 text-xl" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Est. Tax Projection</p>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(ytdData.estimatedTax)}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 dark:border-slate-700 px-6 py-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">Salary Slips</h3>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading payslips...</p>
            </div>
          ) : payslips.length === 0 ? (
            <div className="p-12 text-center">
              <MdReceipt className="mx-auto text-5xl text-slate-300 dark:text-slate-600" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">No Payslips Found</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Your salary slips will appear here once they are generated.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/20">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Month / Year</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Basic Salary</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Gross Pay</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Deductions</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Net Pay</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {payslips.map((payslip) => (
                    <tr key={payslip.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <MdReceipt className="text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {monthName(payslip.month)} {payslip.year}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{formatCurrency(payslip.basicSalary)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{formatCurrency(payslip.grossPay)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-rose-600 dark:text-rose-400">{formatCurrency(payslip.deductions)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(payslip.netPay)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          payslip.status === "PAID"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : payslip.status === "PENDING"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                        }`}>
                          {payslip.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedPayslip(payslip);
                              setShowModal(true);
                            }}
                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                            title="View"
                          >
                            <MdFilePresent className="text-lg" />
                          </button>
                          <button
                            onClick={() => handleDownload(payslip)}
                            className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                            title="Download"
                          >
                            <MdDownload className="text-lg" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showModal && selectedPayslip && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white">Payslip - {monthName(selectedPayslip.month)} {selectedPayslip.year}</h3>
                <div className="flex items-center gap-2">
                  <button onClick={handlePrint} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg">
                    <MdPrint className="text-lg" />
                  </button>
                  <button onClick={() => handleDownload(selectedPayslip)} className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg">
                    <MdDownload className="text-lg" />
                  </button>
                  <button onClick={() => setShowModal(false)} className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                    Close
                  </button>
                </div>
              </div>
              <div className="p-6" id="print-content">
                <div className="text-center border-b border-slate-200 dark:border-slate-700 pb-4 mb-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{company?.name || "Company"}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{company?.addresses?.[0]?.addressLine1 || ""}</p>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 mb-6">
                  <p className="text-center text-lg font-semibold text-indigo-700 dark:text-indigo-300">PAYSLIP</p>
                  <p className="text-center text-sm text-indigo-600 dark:text-indigo-400">{monthName(selectedPayslip.month)} {selectedPayslip.year}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Employee Name</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{profile?.firstName} {profile?.lastName}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Employee Code</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{profile?.employeeCode}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Earnings</h4>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-300">Basic Salary</span>
                    <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(selectedPayslip.basicSalary)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-300">Gross Pay</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(selectedPayslip.grossPay)}</span>
                  </div>

                  <h4 className="font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 pt-4">Deductions</h4>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-300">Total Deductions</span>
                    <span className="font-medium text-rose-600 dark:text-rose-400">{formatCurrency(selectedPayslip.deductions)}</span>
                  </div>

                  <div className="flex justify-between py-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl px-4 mt-4">
                    <span className="font-semibold text-slate-900 dark:text-white">Net Pay</span>
                    <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(selectedPayslip.netPay)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}
