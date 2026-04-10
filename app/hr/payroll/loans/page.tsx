"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MdMoney, MdAdd, MdWarning, MdCheckCircle, MdArrowBack } from "react-icons/md";

type Loan = {
  id: string;
  employeeId: string;
  employeeName: string;
  loanType: string;
  principalAmount: number;
  emiAmount: number;
  outstandingAmount: number;
  status: string;
  startDate: string;
};

export default function LoansPage() {
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/payroll/loan")
      .then((res) => res.json())
      .then((data) => {
        if (data.loans) {
          setLoans(data.loans);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const activeLoans = loans.filter((l) => l.status === "ACTIVE");
  const pendingLoans = loans.filter((l) => l.status === "PENDING");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

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
              Loans & Advances
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Manage employee loans and advances
            </p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-300/50">
          <MdAdd className="text-lg" />
          New Loan
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <MdMoney className="text-2xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Loans</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{loans.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <MdCheckCircle className="text-2xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Loans</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeLoans.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <MdWarning className="text-2xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Approval</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{pendingLoans.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">All Loans</h2>
        {loans.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Employee</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Type</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Principal</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">EMI</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Outstanding</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr key={loan.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 px-4 text-slate-900 dark:text-white">{loan.employeeName}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{loan.loanType}</td>
                    <td className="py-3 px-4 text-right text-slate-900 dark:text-white">₹{Number(loan.principalAmount).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-slate-900 dark:text-white">₹{Number(loan.emiAmount).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-slate-900 dark:text-white">₹{Number(loan.outstandingAmount).toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                        loan.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : loan.status === "PENDING"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                      }`}>
                        {loan.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <MdMoney className="text-3xl text-slate-400" />
            </div>
            <h3 className="font-medium text-slate-900 dark:text-white">No loans yet</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Add employee loans to manage repayments
            </p>
          </div>
        )}
      </div>
    </div>
  );
}