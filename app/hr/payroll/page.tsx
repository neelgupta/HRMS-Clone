import { requireUser } from "@/lib/auth-guard";
import { getPayrollRuns, getPayrollSettings } from "@/lib/server/payroll";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { MdSettings, MdAccountTree, MdMoney, MdReceipt, MdAssessment, MdAdd, MdChevronRight } from "react-icons/md";

async function getPayrollData(companyId: string) {
  const runs = await getPayrollRuns(companyId, 1, 10);
  const settings = await getPayrollSettings(companyId);
  return { runs, settings };
}

export default async function PayrollPage() {
  const authResult = await requireUser();
  if ("response" in authResult) {
    return <div>Unauthorized</div>;
  }

  const { companyId, name: userName } = authResult;
  const { runs, settings } = await getPayrollData(companyId);

  const stats = {
    totalEmployees: 0,
    monthlyPayout: 0,
    pendingReimbursements: 0,
    activeLoans: 0,
  };

  const menuItems = [
    {
      title: "Payroll Settings",
      description: "Configure PF, ESI, TDS, salary components",
      href: ROUTES.HR.PAYROLL.SETTINGS,
      icon: MdSettings,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Salary Components",
      description: "Create salary components",
      href: ROUTES.HR.PAYROLL.COMPONENTS,
      icon: MdMoney,
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "Salary Structure",
      description: "Create and manage salary structures",
      href: ROUTES.HR.PAYROLL.SALARY_STRUCTURE,
      icon: MdAccountTree,
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Loans",
      description: "Manage employee loans and advances",
      href: ROUTES.HR.PAYROLL.LOANS,
      icon: MdMoney,
      color: "from-amber-500 to-orange-500",
    },
    {
      title: "Reimbursements",
      description: "Process reimbursement claims",
      href: ROUTES.HR.PAYROLL.REIMBURSEMENTS,
      icon: MdReceipt,
      color: "from-emerald-500 to-teal-500",
    },
    {
      title: "Reports",
      description: "View payroll reports and analytics",
      href: ROUTES.HR.PAYROLL.REPORTS,
      icon: MdAssessment,
      color: "from-indigo-500 to-violet-500",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Payroll Management
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Manage salary structures, run payroll, and handle deductions
          </p>
        </div>
        <Link
          href={ROUTES.HR.PAYROLL.RUN}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-300/50 dark:shadow-indigo-900/30 dark:hover:shadow-indigo-800/50"
        >
          <MdAdd className="text-lg" />
          Run Payroll
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <MdAccountTree className="text-2xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Employees</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalEmployees}</p>
            </div>
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <MdMoney className="text-2xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Monthly Payout</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">₹0</p>
            </div>
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <MdReceipt className="text-2xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Reimbursements</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pendingReimbursements}</p>
            </div>
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <MdSettings className="text-2xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Loans</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.activeLoans}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Quick Actions</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-transparent hover:shadow-lg dark:border-slate-700 dark:bg-slate-800/50"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 transition-opacity group-hover:opacity-10`} />
                  <div className="relative">
                    <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-white shadow-lg`}>
                      <Icon className="text-xl" />
                    </div>
                    <h3 className="font-medium text-slate-900 dark:text-white">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Payroll Runs</h2>
            <Link
              href={ROUTES.HR.PAYROLL.REPORTS}
              className="flex items-center gap-1 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              View all
              <MdChevronRight className="text-lg" />
            </Link>
          </div>
          {runs && runs.runs.length > 0 ? (
            <div className="space-y-4">
              {runs.runs.slice(0, 5).map((run: any) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      run.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : run.status === "PROCESSING"
                        ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                    }`}>
                      <MdMoney className="text-xl" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {new Date(run.runDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {run.totalEmployees || 0} employees • ₹{(Number(run.totalGross) || 0).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                    run.status === "COMPLETED"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : run.status === "PROCESSING"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                  }`}>
                    {run.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <MdMoney className="text-3xl text-slate-400" />
              </div>
              <h3 className="font-medium text-slate-900 dark:text-white">No payroll runs yet</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Run your first payroll to get started
              </p>
              <Link
                href={ROUTES.HR.PAYROLL.SETTINGS}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              >
                <MdAdd className="text-lg" />
                Run Payroll
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Payroll Configuration</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">PF Contribution</p>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
              {settings?.pfEnabled ? "12%" : "Disabled"}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Employee + Employer</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">ESI Contribution</p>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
              {settings?.esiEnabled ? "0.75% / 3.25%" : "Disabled"}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Employee / Employer</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">TDS Calculation</p>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
              {settings?.tdsEnabled ? "Enabled" : "Disabled"}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Monthly tax deduction</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Wage Ceiling</p>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">₹15,000</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">PF applicability limit</p>
          </div>
        </div>
      </div>
    </div>
  );
}