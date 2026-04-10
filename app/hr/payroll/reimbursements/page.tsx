"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MdReceipt, MdAdd, MdCheckCircle, MdWarning, MdCancel, MdArrowBack } from "react-icons/md";

type Reimbursement = {
  id: string;
  employeeId: string;
  employeeName: string;
  category: string;
  amount: number;
  status: string;
  claimedDate: string;
  description: string;
};

export default function ReimbursementsPage() {
  const router = useRouter();
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/payroll/reimbursement")
      .then((res) => res.json())
      .then((data) => {
        if (data.reimbursements) {
          setReimbursements(data.reimbursements);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const pendingCount = reimbursements.filter((r) => r.status === "PENDING").length;
  const approvedCount = reimbursements.filter((r) => r.status === "APPROVED").length;
  const rejectedCount = reimbursements.filter((r) => r.status === "REJECTED").length;
  const totalAmount = reimbursements.reduce((sum, r) => sum + Number(r.amount), 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <MdCheckCircle className="text-emerald-500" />;
      case "PENDING":
        return <MdWarning className="text-amber-500" />;
      case "REJECTED":
        return <MdCancel className="text-red-500" />;
      default:
        return null;
    }
  };

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
              Reimbursements
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Process and manage employee reimbursement claims
            </p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-300/50">
          <MdAdd className="text-lg" />
          New Claim
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <MdReceipt className="text-2xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Claims</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">₹{totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <MdWarning className="text-2xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <MdCheckCircle className="text-2xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Approved</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{approvedCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <MdCancel className="text-2xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Rejected</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{rejectedCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">All Claims</h2>
        {reimbursements.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Employee</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Category</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Description</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Amount</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {reimbursements.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 px-4 text-slate-900 dark:text-white">{r.employeeName}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{r.category}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 truncate max-w-xs">{r.description}</td>
                    <td className="py-3 px-4 text-right text-slate-900 dark:text-white">₹{Number(r.amount).toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                        r.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : r.status === "PENDING"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {getStatusIcon(r.status)}
                        {r.status}
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
              <MdReceipt className="text-3xl text-slate-400" />
            </div>
            <h3 className="font-medium text-slate-900 dark:text-white">No reimbursement claims</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Employee claims will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}