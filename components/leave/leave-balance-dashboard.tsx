"use client";

import { useState, useEffect } from "react";
import { 
  MdCalendarToday, 
  MdEventNote, 
  MdTrendingUp, 
  MdWarning,
  MdCheckCircle,
  MdInfo,
  MdChevronLeft,
  MdChevronRight
} from "react-icons/md";
import { 
  type LeaveTypeConfig, 
  type LeaveBalance, 
  type LeaveApplication,
  type Holiday,
  leaveCategoryLabels,
  leaveStatusLabels,
  getLeaveBalances,
  getLeaveApplications,
  getHolidays
} from "@/lib/client/leave";
import { Skeleton } from "@/components/ui/loaders/skeleton";

interface LeaveBalanceDashboardProps {
  employeeId?: string;
}

export function LeaveBalanceDashboard({ employeeId }: LeaveBalanceDashboardProps) {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"balance" | "calendar" | "history">("balance");

  useEffect(() => {
    fetchData();
  }, [employeeId]);

  async function fetchData() {
    try {
      const [balancesRes, applicationsRes, holidaysRes] = await Promise.all([
        getLeaveBalances(employeeId),
        getLeaveApplications({ status: "APPROVED" }),
        getHolidays(new Date().getFullYear()),
      ]);

      if (balancesRes.data?.balances) {
        setBalances(balancesRes.data.balances);
      }
      if (applicationsRes.data?.applications) {
        setApplications(applicationsRes.data.applications);
      }
      if (holidaysRes.data?.holidays) {
        setHolidays(holidaysRes.data.holidays);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }

  function getLeaveCategory(type: string): string {
    const paidTypes = ["CASUAL", "SICK", "PRIVILEGE", "MATERNITY", "PATERNITY", "BEREAVEMENT", "COMP_OFF"];
    const unplannedTypes = ["UNPAID"];
    if (unplannedTypes.includes(type)) return "UNPLANNED";
    if (paidTypes.includes(type)) return "PAID";
    return "UNPAID";
  }

  function getTotalAvailable(): number {
    return balances
      .filter(b => getLeaveCategory(b.leaveTypeConfig?.type || "") === "PAID")
      .reduce((sum, b) => sum + (b.availableDays > 0 ? b.availableDays : 0), 0);
  }

  function getTotalUsed(): number {
    return balances
      .filter(b => getLeaveCategory(b.leaveTypeConfig?.type || "") === "PAID")
      .reduce((sum, b) => sum + b.usedDays, 0);
  }

  function getUpcomingLeaves(): LeaveApplication[] {
    const today = new Date();
    return applications
      .filter(app => new Date(app.startDate) > today && app.status === "APPROVED")
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 3);
  }

  function getCalendarDays(): Array<{ date: Date; isHoliday: boolean; isLeave: boolean; leave?: LeaveApplication }> {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      const isHoliday = holidays.some(h => h.date === dateStr);
      const leave = applications.find(app => {
        const start = new Date(app.startDate);
        const end = new Date(app.endDate);
        return date >= start && date <= end && app.status === "APPROVED";
      });

      days.push({
        date: new Date(date),
        isHoliday,
        isLeave: !!leave,
        leave
      });
    }

    return days;
  }

  function navigateMonth(direction: "prev" | "next") {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === "prev") {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Mode Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        <button
          onClick={() => setViewMode("balance")}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === "balance"
              ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          Balance Overview
        </button>
        <button
          onClick={() => setViewMode("calendar")}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === "calendar"
              ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          Calendar View
        </button>
        <button
          onClick={() => setViewMode("history")}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === "history"
              ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          Leave History
        </button>
      </div>

      {viewMode === "balance" && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total Available */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <MdTrendingUp className="text-xl text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Available</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {getTotalAvailable()}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Used */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <MdEventNote className="text-xl text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Used</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {getTotalUsed()}
                  </p>
                </div>
              </div>
            </div>

            {/* Pending */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <MdCalendarToday className="text-xl text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Pending</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {applications.filter(app => app.status === "PENDING").length}
                  </p>
                </div>
              </div>
            </div>

            {/* Upcoming */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <MdCheckCircle className="text-xl text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Upcoming</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {getUpcomingLeaves().length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Balance Breakdown */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white">Leave Balance Details</h3>
            </div>
            <div className="p-6">
              {/* Paid Leave Category */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.657-2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Paid Leave</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {balances
                    .filter(b => getLeaveCategory(b.leaveTypeConfig?.type || "") === "PAID")
                    .map(balance => {
                      const type = balance.leaveTypeConfig;
                      const isUnlimited = balance.availableDays === -1;
                      const usedPct = balance.allocatedDays > 0 ? (balance.usedDays / balance.allocatedDays) * 100 : 0;
                      
                      return (
                        <div key={balance.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-slate-900 dark:text-white">{type?.name}</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{type?.description}</p>
                            </div>
                            <span className={`text-lg font-bold ${isUnlimited ? "text-rose-600" : "text-emerald-600 dark:text-emerald-400"}`}>
                              {isUnlimited ? "∞" : balance.availableDays}
                            </span>
                          </div>
                          
                          {!isUnlimited && (
                            <>
                              <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden mb-2">
                                <div 
                                  className="h-full bg-emerald-500 rounded-full transition-all duration-300" 
                                  style={{ width: `${Math.min(usedPct, 100)}%` }} 
                                />
                              </div>
                              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                <span>Used: {balance.usedDays}</span>
                                <span>Total: {balance.allocatedDays}</span>
                              </div>
                            </>
                          )}

                          {balance.carriedForward > 0 && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                              +{balance.carriedForward} days carried forward
                            </p>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Unplanned Leave Category */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Unplanned Leave</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {balances
                    .filter(b => getLeaveCategory(b.leaveTypeConfig?.type || "") === "UNPLANNED")
                    .map(balance => {
                      const type = balance.leaveTypeConfig;
                      const isUnlimited = balance.availableDays === -1;
                      const usedPct = balance.allocatedDays > 0 ? (balance.usedDays / balance.allocatedDays) * 100 : 0;
                      
                      return (
                        <div key={balance.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-slate-900 dark:text-white">{type?.name}</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{type?.description}</p>
                            </div>
                            <span className={`text-lg font-bold ${isUnlimited ? "text-rose-600" : "text-amber-600 dark:text-amber-400"}`}>
                              {isUnlimited ? "∞" : balance.availableDays}
                            </span>
                          </div>
                          
                          {!isUnlimited && (
                            <>
                              <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden mb-2">
                                <div 
                                  className="h-full bg-amber-500 rounded-full transition-all duration-300" 
                                  style={{ width: `${Math.min(usedPct, 100)}%` }} 
                                />
                              </div>
                              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                <span>Used: {balance.usedDays}</span>
                                <span>Total: {balance.allocatedDays}</span>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Leaves */}
          {getUpcomingLeaves().length > 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white">Upcoming Approved Leaves</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {getUpcomingLeaves().map(app => (
                    <div key={app.id} className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                          <MdCalendarToday className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {app.leaveTypeConfig?.name || "Leave"}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {new Date(app.startDate).toLocaleDateString()} - {new Date(app.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                          {app.totalDays} {app.totalDays === 1 ? 'day' : 'days'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {viewMode === "calendar" && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth("prev")}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <MdChevronLeft className="text-xl text-slate-600 dark:text-slate-400" />
            </button>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
              {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h3>
            <button
              onClick={() => navigateMonth("next")}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <MdChevronRight className="text-xl text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Weekday Headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="text-center text-sm font-medium text-slate-500 dark:text-slate-400 py-2">
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {getCalendarDays().map((day, index) => (
              <div
                key={index}
                className={`aspect-square p-2 rounded-lg border text-sm ${
                  day.isHoliday 
                    ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
                    : day.isLeave
                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                <div className="text-center">
                  <div className="font-medium">{day.date.getDate()}</div>
                  {day.isHoliday && (
                    <div className="text-xs mt-1">Holiday</div>
                  )}
                  {day.isLeave && day.leave && (
                    <div className="text-xs mt-1 truncate">
                      {day.leave.leaveTypeConfig?.name}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"></div>
              <span className="text-slate-600 dark:text-slate-400">Holiday</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800"></div>
              <span className="text-slate-600 dark:text-slate-400">Leave</span>
            </div>
          </div>
        </div>
      )}

      {viewMode === "history" && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-white">Leave History</h3>
          </div>
          <div className="overflow-x-auto">
            {applications.length === 0 ? (
              <div className="p-12 text-center">
                <MdEventNote className="text-4xl text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-300 font-medium">No Leave History</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                  Your leave history will appear here
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Leave Type
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Applied On
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {applications.map(app => (
                    <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {app.leaveTypeConfig?.name || "Leave"}
                          </p>
                          {app.reason && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">
                              {app.reason}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          <div>
                            {new Date(app.startDate).toLocaleDateString()} - {new Date(app.endDate).toLocaleDateString()}
                          </div>
                          <div>{app.totalDays} {app.totalDays === 1 ? 'day' : 'days'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          app.status === "APPROVED" 
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : app.status === "PENDING"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            : app.status === "REJECTED"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400"
                        }`}>
                          {leaveStatusLabels[app.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
