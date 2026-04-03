"use client";

import { useState, useEffect, Suspense } from "react";
import { toast } from "react-hot-toast";
import {
  MdTrendingUp,
  MdTrendingDown,
  MdHistory,
  MdInfo,
  MdCalendarToday,
} from "react-icons/md";
import { EmployeeLayout } from "@/components/employee";
import { SelectInput } from "@/components/ui/select-input";
import { FormField } from "@/components/ui/form-field";
import { Skeleton } from "@/components/ui/loaders/skeleton";
import {
  type LeaveBalance,
  type LeaveApplication,
  type LeaveTypeConfig,
  getLeaveBalances,
  getLeaveTypes,
} from "@/lib/client/leave";

interface MonthlyForecast {
  month: string;
  monthIndex: number;
  year: number;
  opening: number;
  accrual: number;
  used: number;
  closing: number;
}

function LeaveHistoryContent() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeConfig[]>([]);
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedType, setSelectedType] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState<MonthlyForecast[]>([]);

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  async function fetchData() {
    setLoading(true);
    try {
      const [balanceRes, typesRes, appsRes] = await Promise.all([
        getLeaveBalances(undefined, selectedYear),
        getLeaveTypes(),
        fetch(`/api/leave`, { credentials: "include" }).then((r) => r.json()),
      ]);

      if (balanceRes.data?.balances) {
        setBalances(balanceRes.data.balances);
      }
      if (typesRes.data?.leaveTypes) {
        setLeaveTypes(typesRes.data.leaveTypes);
        if (typesRes.data.leaveTypes.length > 0 && !selectedType) {
          setSelectedType(typesRes.data.leaveTypes[0].id);
        }
      }
      if (appsRes.applications) {
        setApplications(appsRes.applications);
      }
    } catch {
      toast.error("Failed to fetch leave data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (balances.length > 0 && selectedType) {
      generateForecast();
    }
  }, [balances, selectedType, selectedYear]);

  function generateForecast() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const selectedBalance = balances.find((b) => b.leaveTypeId === selectedType);
    const selectedTypeConfig = leaveTypes.find((t) => t.id === selectedType);

    if (!selectedBalance || !selectedTypeConfig) return;

    const typeApplications = applications.filter(
      (app) =>
        app.leaveTypeId === selectedType &&
        new Date(app.startDate).getFullYear() === parseInt(selectedYear.toString())
    );

    const forecasts: MonthlyForecast[] = [];
    let runningBalance = selectedBalance.carriedForward || 0;

    for (let month = 0; month < 12; month++) {
      const monthApplications = typeApplications.filter(
        (app) => new Date(app.startDate).getMonth() === month
      );

      let accrual = 0;
      if (selectedTypeConfig.accrualType === "MONTHLY") {
        accrual = selectedTypeConfig.accrualRate;
      } else if (month === 0) {
        accrual = selectedTypeConfig.annualDays;
      }

      const used = monthApplications
        .filter((app) => app.status === "APPROVED")
        .reduce((sum, app) => sum + app.totalDays, 0);

      const pending = monthApplications
        .filter((app) => app.status === "PENDING")
        .reduce((sum, app) => sum + app.totalDays, 0);

      const opening = runningBalance;
      const closing = opening + accrual - used;

      forecasts.push({
        month: new Date(selectedYear, month).toLocaleString("en-US", { month: "long" }),
        monthIndex: month,
        year: selectedYear,
        opening,
        accrual,
        used,
        closing,
      });

      runningBalance = closing;
    }

    setForecast(forecasts);
  }

  function getYearlyStats() {
    if (!selectedType) return { total: 0, used: 0, pending: 0, available: 0 };

    const selectedBalance = balances.find((b) => b.leaveTypeId === selectedType);
    const typeApplications = applications.filter(
      (app) =>
        app.leaveTypeId === selectedType &&
        new Date(app.startDate).getFullYear() === parseInt(selectedYear.toString())
    );

    const used = typeApplications
      .filter((app) => app.status === "APPROVED")
      .reduce((sum, app) => sum + app.totalDays, 0);

    const pending = typeApplications
      .filter((app) => app.status === "PENDING")
      .reduce((sum, app) => sum + app.totalDays, 0);

    return {
      total: selectedBalance?.allocatedDays || 0,
      used,
      pending,
      available: (selectedBalance?.availableDays || 0) - pending,
    };
  }

  const stats = getYearlyStats();
  const selectedTypeConfig = leaveTypes.find((t) => t.id === selectedType);

  const monthlyUsage = forecast.map((f) => ({
    month: f.month.substring(0, 3),
    used: f.used,
    accrual: f.accrual,
  }));

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Leave History</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          View your leave balance history and projections
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div className="w-48">
          <FormField label="Year">
            <SelectInput
              value={selectedYear.toString()}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {[selectedYear - 1, selectedYear, selectedYear + 1].map((year) => (
                <option key={year} value={year.toString()}>
                  {year}
                </option>
              ))}
            </SelectInput>
          </FormField>
        </div>
        <div className="w-64">
          <FormField label="Leave Type">
            <SelectInput
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              {leaveTypes.filter((t) => t.isActive).map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </SelectInput>
          </FormField>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">Annual Allocation</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats.total}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">days per year</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
              <div className="flex items-center gap-2">
                <p className="text-sm text-slate-500 dark:text-slate-400">Used</p>
                <MdTrendingDown className="text-red-500" />
              </div>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.used}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">days taken</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
              <div className="flex items-center gap-2">
                <p className="text-sm text-slate-500 dark:text-slate-400">Pending</p>
                <MdHistory className="text-yellow-500" />
              </div>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{stats.pending}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">awaiting approval</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
              <div className="flex items-center gap-2">
                <p className="text-sm text-slate-500 dark:text-slate-400">Available</p>
                <MdTrendingUp className="text-green-500" />
              </div>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.available}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">days remaining</p>
            </div>
          </div>

          {/* Usage Progress */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 mb-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Yearly Usage</h3>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500 dark:text-slate-400">Used vs Available</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {stats.used} / {stats.total} days
                </span>
              </div>
              <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                  style={{ width: `${Math.min((stats.used / stats.total) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {Math.max(0, stats.available)}
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">Available</p>
              </div>
              <div className="p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20">
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">Pending</p>
              </div>
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.used}</p>
                <p className="text-xs text-red-700 dark:text-red-300">Used</p>
              </div>
            </div>
          </div>

          {/* Monthly Forecast */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white">Monthly Breakdown</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Month
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Opening
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Accrual
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Used
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Closing
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {forecast.map((month, index) => {
                    const isCurrentMonth =
                      new Date().getMonth() === month.monthIndex &&
                      new Date().getFullYear() === month.year;

                    return (
                      <tr
                        key={index}
                        className={`${
                          isCurrentMonth
                            ? "bg-indigo-50 dark:bg-indigo-900/20"
                            : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900 dark:text-white">
                              {month.month}
                            </span>
                            {isCurrentMonth && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                Current
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">
                          {month.opening}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-green-600 dark:text-green-400">
                            +{month.accrual}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {month.used > 0 ? (
                            <span className="text-red-600 dark:text-red-400">-{month.used}</span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`font-semibold ${
                              month.closing < 0
                                ? "text-red-600 dark:text-red-400"
                                : month.closing < 2
                                ? "text-yellow-600 dark:text-yellow-400"
                                : "text-slate-900 dark:text-white"
                            }`}
                          >
                            {month.closing}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info Box */}
          {selectedTypeConfig && (
            <div className="mt-6 rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
              <div className="flex items-start gap-3">
                <MdInfo className="text-xl text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    About {selectedTypeConfig.name}
                  </p>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <p>
                      <strong>Accrual Type:</strong>{" "}
                      {selectedTypeConfig.accrualType === "MONTHLY"
                        ? `Monthly accrual of ${selectedTypeConfig.accrualRate} days`
                        : "Annual allocation at year start"}
                    </p>
                    {selectedTypeConfig.allowCarryForward && (
                      <p>
                        <strong>Carry Forward:</strong> Up to {selectedTypeConfig.maxCarryForward} days can
                        be carried forward
                      </p>
                    )}
                    {selectedTypeConfig.expiryDays > 0 && (
                      <p>
                        <strong>Expiry:</strong> Unused leave expires after {selectedTypeConfig.expiryDays}{" "}
                        days
                      </p>
                    )}
                    {selectedTypeConfig.maxConsecutive > 0 && (
                      <p>
                        <strong>Max Consecutive:</strong> {selectedTypeConfig.maxConsecutive} days at a
                        time
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default function LeaveHistoryPage() {
  return (
    <EmployeeLayout title="Leave History" subtitle="View your leave balance and projections">
      <Suspense fallback={
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      }>
        <LeaveHistoryContent />
      </Suspense>
    </EmployeeLayout>
  );
}
