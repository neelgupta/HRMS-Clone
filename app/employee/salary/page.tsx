"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { EmployeeLayout } from "@/components/employee";
import { 
  MdReceipt, 
  MdDownload, 
  MdCalendarMonth,
  MdArrowBack,
  MdArrowForward,
  MdAccountBalance,
  MdTrendingUp,
  MdMoney,
} from "react-icons/md";

type Payslip = {
  id: string;
  month: number;
  year: number;
  runDate: string;
  status: string;
  workingDays: number;
  daysWorked: number;
  lopDays: number;
  halfDays: number;
  earnings: {
    basic: number;
    hra: number;
    conveyance: number;
    specialAllowance: number;
    bonus: number;
    other: number;
    overtime: number;
    total: number;
  };
  deductions: {
    pf: number;
    esi: number;
    tds: number;
    professionalTax: number;
    loan: number;
    other: number;
    total: number;
  };
  grossSalary: number;
  netPay: number;
  reimbursements: number;
  arrears: number;
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function PayslipCard({ payslip, isSelected, onClick }: { payslip: Payslip; isSelected: boolean; onClick: () => void }) {
  const statusColors: Record<string, string> = {
    DRAFT: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    PROCESSED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    LOCKED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    PAID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border transition-all ${
        isSelected 
          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" 
          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">
            {monthNames[payslip.month - 1]} {payslip.year}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {payslip.daysWorked} days worked
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-slate-900 dark:text-white">
            ₹{payslip.netPay.toLocaleString("en-IN")}
          </p>
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[payslip.status] || "bg-slate-100"}`}>
            {payslip.status}
          </span>
        </div>
      </div>
    </button>
  );
}

function DetailedPayslip({ payslip, onClose }: { payslip: Payslip; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-3xl shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h2 className="text-2xl font-bold">Payslip</h2>
              <p className="text-indigo-100 mt-1">
                {monthNames[payslip.month - 1]} {payslip.year}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/20 text-white hover:bg-white/30 flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Working Days Summary */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
              <p className="text-xs text-slate-500 dark:text-slate-400">Working Days</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{payslip.workingDays}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
              <p className="text-xs text-slate-500 dark:text-slate-400">Days Worked</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{payslip.daysWorked}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
              <p className="text-xs text-slate-500 dark:text-slate-400">LOP Days</p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{payslip.lopDays}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
              <p className="text-xs text-slate-500 dark:text-slate-400">Half Days</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{payslip.halfDays}</p>
            </div>
          </div>
        </div>

        {/* Earnings */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4">
            <MdTrendingUp className="text-green-600" />
            Earnings
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400">Basic Salary</span>
              <span className="font-medium text-slate-900 dark:text-white">₹{payslip.earnings.basic.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400">House Rent Allowance (HRA)</span>
              <span className="font-medium text-slate-900 dark:text-white">₹{payslip.earnings.hra.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400">Conveyance</span>
              <span className="font-medium text-slate-900 dark:text-white">₹{payslip.earnings.conveyance.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400">Special Allowance</span>
              <span className="font-medium text-slate-900 dark:text-white">₹{payslip.earnings.specialAllowance.toLocaleString("en-IN")}</span>
            </div>
            {payslip.earnings.bonus > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Bonus</span>
                <span className="font-medium text-slate-900 dark:text-white">₹{payslip.earnings.bonus.toLocaleString("en-IN")}</span>
              </div>
            )}
            {payslip.earnings.overtime > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Overtime</span>
                <span className="font-medium text-slate-900 dark:text-white">₹{payslip.earnings.overtime.toLocaleString("en-IN")}</span>
              </div>
            )}
            {payslip.arrears > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Arrears</span>
                <span className="font-medium text-slate-900 dark:text-white">₹{payslip.arrears.toLocaleString("en-IN")}</span>
              </div>
            )}
            {payslip.reimbursements > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Reimbursements</span>
                <span className="font-medium text-slate-900 dark:text-white">₹{payslip.reimbursements.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-3 bg-green-50 dark:bg-green-900/20 rounded-xl px-4 mt-2">
              <span className="font-semibold text-slate-900 dark:text-white">Total Earnings</span>
              <span className="font-bold text-green-600 dark:text-green-400">₹{payslip.earnings.total.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Deductions */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4">
            <MdAccountBalance className="text-red-600" />
            Deductions
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400">Provident Fund (PF)</span>
              <span className="font-medium text-slate-900 dark:text-white">₹{payslip.deductions.pf.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400">Employee State Insurance (ESI)</span>
              <span className="font-medium text-slate-900 dark:text-white">₹{payslip.deductions.esi.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400">Tax Deducted at Source (TDS)</span>
              <span className="font-medium text-slate-900 dark:text-white">₹{payslip.deductions.tds.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400">Professional Tax</span>
              <span className="font-medium text-slate-900 dark:text-white">₹{payslip.deductions.professionalTax.toLocaleString("en-IN")}</span>
            </div>
            {payslip.deductions.loan > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Loan Deduction</span>
                <span className="font-medium text-slate-900 dark:text-white">₹{payslip.deductions.loan.toLocaleString("en-IN")}</span>
              </div>
            )}
            {payslip.deductions.other > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Other Deductions</span>
                <span className="font-medium text-slate-900 dark:text-white">₹{payslip.deductions.other.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-3 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 mt-2">
              <span className="font-semibold text-slate-900 dark:text-white">Total Deductions</span>
              <span className="font-bold text-red-600 dark:text-red-400">₹{payslip.deductions.total.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Net Pay */}
        <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-b-3xl">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Gross Salary</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">₹{payslip.grossSalary.toLocaleString("en-IN")}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 dark:text-slate-400">Net Pay</p>
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">₹{payslip.netPay.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SalaryContent() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  useEffect(() => {
    fetchPayslips();
  }, []);

  async function fetchPayslips() {
    try {
      const res = await fetch("/api/payroll/employee/payslips", { credentials: "include" });
      const data = await res.json();
      if (data.payslips) {
        setPayslips(data.payslips);
        if (data.payslips.length > 0) {
          setSelectedPayslip(data.payslips[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch payslips:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (payslips.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
          <MdReceipt className="text-3xl text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Payslips Yet</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Your salary slips will appear here after HR runs the payroll. Please contact HR if you have any questions.
        </p>
      </div>
    );
  }

  const currentPayslip = selectedPayslip || payslips[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Payslip List */}
      <div className="lg:col-span-1 space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <MdCalendarMonth className="text-indigo-600" />
          Salary History
        </h3>
        <div className="space-y-3">
          {payslips.map((payslip) => (
            <PayslipCard
              key={payslip.id}
              payslip={payslip}
              isSelected={selectedPayslip?.id === payslip.id}
              onClick={() => setSelectedPayslip(payslip)}
            />
          ))}
        </div>
      </div>

      {/* Current Payslip Summary */}
      <div className="lg:col-span-2">
        {currentPayslip && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {monthNames[currentPayslip.month - 1]} {currentPayslip.year}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Salary Slip
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentPayslip.status === "LOCKED" || currentPayslip.status === "PAID"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
              }`}>
                {currentPayslip.status}
              </span>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-center">
                <MdMoney className="text-2xl text-green-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400">Earnings</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  ₹{currentPayslip.earnings.total.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-center">
                <MdAccountBalance className="text-2xl text-red-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400">Deductions</p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  ₹{currentPayslip.deductions.total.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-center">
                <MdTrendingUp className="text-2xl text-indigo-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400">Net Pay</p>
                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  ₹{currentPayslip.netPay.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedPayslip(currentPayslip)}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              View Full Payslip
            </button>
          </div>
        )}
      </div>

      {/* Detailed Payslip Modal */}
      {selectedPayslip && (
        <DetailedPayslip 
          payslip={selectedPayslip} 
          onClose={() => setSelectedPayslip(null)} 
        />
      )}
    </div>
  );
}

export default function SalaryPage() {
  return (
    <EmployeeLayout 
      title="Salary & Payslip" 
      subtitle="View your salary details and payslips"
    >
      <SalaryContent />
    </EmployeeLayout>
  );
}