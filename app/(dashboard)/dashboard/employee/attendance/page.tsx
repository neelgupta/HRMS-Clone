"use client";

import { useState, useEffect, Suspense } from "react";
import {
  MdFreeBreakfast,
  MdCheckCircle,
  MdLogout as MdClockOut,
  MdCalendarMonth,
  MdWork,
  MdEventBusy,
  MdBeachAccess,
  MdAccessTime,
} from "react-icons/md";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { EmployeeLayout } from "@/components/employee";
import { breakStart, breakEnd, fetchTodayAttendance, clockOut, clockIn, fetchAttendances, fetchAttendanceSummary } from "@/lib/client/attendance";
import type { ShiftListItem, AttendanceListItem } from "@/lib/client/attendance";
import { showError, showLoading, dismissToast, showSuccess } from "@/lib/toast";

const STATUS_COLORS: Record<string, string> = {
  PRESENT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  ABSENT: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  LATE: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  HALF_DAY: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ON_LEAVE: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  HOLIDAY: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  WEEK_OFF: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
  PENDING: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
};

type ModalType = "clockIn" | "clockOut" | "breakStart" | "breakEnd";

function AttendanceContent() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [breakLoading, setBreakLoading] = useState(false);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalType, setModalType] = useState<ModalType>("clockOut");
  const [remarks, setRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [shift, setShift] = useState<ShiftListItem | null>(null);
  const [totalHoursWorked, setTotalHoursWorked] = useState<number>(0);

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const [dateFrom, setDateFrom] = useState(firstDay.toISOString().split("T")[0]);
  const [dateTo, setDateTo] = useState(today.toISOString().split("T")[0]);

  const [attendances, setAttendances] = useState<AttendanceListItem[]>([]);
  const [loadingAttendances, setLoadingAttendances] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  const [summary, setSummary] = useState<{
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    totalHalfDay: number;
    totalOnLeave: number;
    totalHoliday: number;
    totalWeekOff: number;
    totalOvertimeHours: number;
  } | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [chartData, setChartData] = useState<Array<{ name: string; hours: number }>>([]);

  const loadTodayAttendance = async () => {
    const result = await fetchTodayAttendance();
    if (result.data?.attendance) {
      const attendance = result.data.attendance;
      setIsClockedIn(!!attendance.clockIn);
      setIsOnBreak(!!attendance.breakStart && !attendance.breakEnd);
      
      if (attendance.clockIn && !attendance.clockOut) {
        const clockInTime = new Date(attendance.clockIn).getTime();
        const now = Date.now();
        let workedHours = (now - clockInTime) / (1000 * 60 * 60);
        
        if (attendance.totalBreakMins) {
          workedHours -= attendance.totalBreakMins / 60;
        }
        setTotalHoursWorked(Math.max(0, workedHours));
      }
    }
    if (result.data?.shift) {
      setShift(result.data.shift);
    }
  };

  const loadAttendances = async () => {
    setLoadingAttendances(true);
    setAttendanceError(null);
    try {
      const result = await fetchAttendances({
        dateFrom,
        dateTo,
        page: 1,
        limit: 100,
      });
      if (result.error) {
        setAttendanceError(result.error);
        setAttendances([]);
      } else {
        setAttendances(result.data?.attendances || []);
      }
    } catch {
      setAttendanceError("Failed to load attendance records.");
      setAttendances([]);
    } finally {
      setLoadingAttendances(false);
    }
  };

  const loadSummary = async () => {
    setLoadingSummary(true);
    try {
      const result = await fetchAttendanceSummary(dateFrom, dateTo);
      if (result.data) {
        setSummary(result.data);
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const start = new Date(dateFrom);
        const end = new Date(dateTo);
        const data: Array<{ name: string; hours: number }> = [];
        const current = new Date(start);
        while (current <= end) {
          const dayAttendance = attendances.find(a => {
            const attDate = new Date(a.date);
            return attDate.toDateString() === current.toDateString();
          });
          data.push({
            name: days[current.getDay()],
            hours: dayAttendance?.totalHours || 0,
          });
          current.setDate(current.getDate() + 1);
        }
        setChartData(data);
      }
    } catch {
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    loadTodayAttendance();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      if (isClockedIn && !isOnBreak) {
        loadTodayAttendance();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isClockedIn, isOnBreak]);

  useEffect(() => {
    loadAttendances();
  }, [dateFrom, dateTo]);

  useEffect(() => {
    if (attendances.length > 0) {
      loadSummary();
    }
  }, [attendances, dateFrom, dateTo]);

  const getShiftHours = () => {
    if (!shift) return 8;
    return shift.minWorkingHours || 8;
  };

  const canClockOutWithoutConfirmation = () => {
    if (!isClockedIn) return false;
    return totalHoursWorked >= getShiftHours();
  };

  const openModal = (type: ModalType) => {
    setModalType(type);
    setRemarks("");
    setShowRemarksModal(true);
  };

  const handleClockOutClick = () => {
    if (canClockOutWithoutConfirmation()) {
      openModal("clockOut");
    } else {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmClockOut = () => {
    setShowConfirmModal(false);
    openModal("clockOut");
  };

  const handleModalSubmit = async () => {
    setShowRemarksModal(false);
    setActionLoading(true);

    try {
      if (modalType === "clockIn") {
        const toastId = showLoading("Clocking in...");
        const result = await clockIn({ remarks: remarks || undefined });
        dismissToast(toastId);
        if (result.error) {
          showError(result.error);
        } else {
          showSuccess("Clocked in successfully!");
          setIsClockedIn(true);
          await loadTodayAttendance();
          await loadAttendances();
        }
      } else if (modalType === "clockOut") {
        const toastId = showLoading("Clocking out...");
        const result = await clockOut({ remarks: remarks || undefined });
        dismissToast(toastId);
        if (result.error) {
          showError(result.error);
        } else {
          showSuccess("Clocked out successfully!");
          setIsClockedIn(false);
          setIsOnBreak(false);
          await loadAttendances();
        }
      } else if (modalType === "breakStart") {
        const toastId = showLoading("Starting break...");
        const result = await breakStart({ remarks: remarks || undefined });
        dismissToast(toastId);
        if (result.error) {
          showError(result.error);
        } else {
          showSuccess("Break started!");
          setIsOnBreak(true);
          await loadTodayAttendance();
        }
      } else if (modalType === "breakEnd") {
        const toastId = showLoading("Ending break...");
        const result = await breakEnd({ remarks: remarks || undefined });
        dismissToast(toastId);
        if (result.error) {
          showError(result.error);
        } else {
          showSuccess("Break ended!");
          setIsOnBreak(false);
          await loadTodayAttendance();
        }
      }
    } finally {
      setActionLoading(false);
      setRemarks("");
    }
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return "—";
    const date = new Date(timeStr);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };

  const formatHours = (hours: number | null) => {
    if (!hours) return "0h 0m";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <MdCalendarMonth className="text-lg" />
            <span className="text-sm font-medium">Date Range</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 [&::-webkit-calendar-picker-indicator]:dark:invert"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 [&::-webkit-calendar-picker-indicator]:dark:invert"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {loadingSummary ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20 mb-2"></div>
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-12"></div>
            </div>
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
              <MdWork className="text-sm" />
              <span className="text-xs font-medium uppercase tracking-wider">Total Hours</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatHours(attendances.reduce((sum, a) => sum + (a.totalHours || 0), 0))}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
              <MdCheckCircle className="text-sm" />
              <span className="text-xs font-medium uppercase tracking-wider">Present</span>
            </div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {summary.totalPresent}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-1">
              <MdEventBusy className="text-sm" />
              <span className="text-xs font-medium uppercase tracking-wider">Absent</span>
            </div>
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-400">
              {summary.totalAbsent}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
              <MdBeachAccess className="text-sm" />
              <span className="text-xs font-medium uppercase tracking-wider">Leaves</span>
            </div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
              {summary.totalOnLeave}
            </div>
          </div>
        </div>
      ) : null}

      {/* Quick Actions & Current Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {!isClockedIn ? (
              <button onClick={() => openModal("clockIn")}
                className="w-full py-3 px-4 rounded-xl font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center justify-center gap-2">
                <MdCheckCircle className="text-lg" /> Clock In
              </button>
            ) : (
              <>
                <button onClick={() => openModal(isOnBreak ? "breakEnd" : "breakStart")} disabled={breakLoading || actionLoading}
                  className={`w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                    isOnBreak ? "bg-orange-500 hover:bg-orange-600 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}>
                  <MdFreeBreakfast className="text-lg" />
                  {breakLoading || actionLoading ? "..." : isOnBreak ? "End Break" : "Take Break"}
                </button>
                <button onClick={handleClockOutClick} disabled={isOnBreak || actionLoading}
                  className="w-full py-3 px-4 rounded-xl font-medium bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  <MdClockOut className="text-lg" /> Clock Out
                </button>
                {isOnBreak && (
                  <p className="text-center text-sm text-orange-600 dark:text-orange-400">
                    Please end break before clocking out
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Current Status */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Current Status</h2>
          <div className="text-center">
            <div className="text-4xl font-bold text-slate-900 dark:text-white">
              {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              {currentTime.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
            <div className="mt-4 flex justify-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${isClockedIn ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"}`}>
                {isClockedIn ? "Clocked In" : "Not Clocked In"}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${isOnBreak ? "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"}`}>
                {isOnBreak ? "On Break" : "Working"}
              </span>
            </div>
            {isClockedIn && !isOnBreak && (
              <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Worked: <span className="font-semibold">{totalHoursWorked.toFixed(1)}</span> / {getShiftHours()} hrs
              </div>
            )}
          </div>
        </div>

        {/* Late & Half Day Stats */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Period Stats</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
              <span className="text-sm text-slate-600 dark:text-slate-300">Late Days</span>
              <span className="font-semibold text-amber-700 dark:text-amber-400">{summary?.totalLate || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
              <span className="text-sm text-slate-600 dark:text-slate-300">Half Days</span>
              <span className="font-semibold text-blue-700 dark:text-blue-400">{summary?.totalHalfDay || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <span className="text-sm text-slate-600 dark:text-slate-300">Overtime</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{summary ? formatHours(summary.totalOvertimeHours) : "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Chart */}
      {chartData.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Daily Working Hours</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #E2E8F0", borderRadius: "12px" }} />
                <Bar dataKey="hours" fill="#6366F1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Attendance Records</h2>
        </div>

        {loadingAttendances ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : attendanceError ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-3">
              <MdEventBusy className="text-rose-600 dark:text-rose-400 text-xl" />
            </div>
            <p className="text-slate-600 dark:text-slate-400">{attendanceError}</p>
          </div>
        ) : attendances.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3">
              <MdAccessTime className="text-slate-400 dark:text-slate-500 text-xl" />
            </div>
            <p className="text-slate-600 dark:text-slate-400">No attendance records found for this date range.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50">
                  <th className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Clock In</th>
                  <th className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Clock Out</th>
                  <th className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Hours</th>
                  <th className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Overtime</th>
                  <th className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {attendances.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">{formatDate(att.date)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{formatTime(att.clockIn)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{formatTime(att.clockOut)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{formatHours(att.totalHours)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{att.overtimeHours ? formatHours(att.overtimeHours) : "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[att.status] || STATUS_COLORS.PENDING}`}>
                        {att.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Remarks Modal */}
      {showRemarksModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[9999]">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              {modalType === "clockIn" && "Clock In"}
              {modalType === "clockOut" && "Clock Out"}
              {modalType === "breakStart" && "Break Start"}
              {modalType === "breakEnd" && "Break End"}
            </h3>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter remarks (optional)..."
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowRemarksModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSubmit}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
              >
                {actionLoading ? "Processing..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Early Clock Out */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Clock Out Confirmation
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-2">
              You have worked for <span className="font-semibold">{totalHoursWorked.toFixed(1)} hours</span>.
            </p>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Required shift hours: <span className="font-semibold">{getShiftHours()} hours</span>.
            </p>
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-3 mb-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                You haven't completed the minimum shift hours. Are you sure you want to clock out?
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClockOut}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                Clock Out Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AttendancePage() {
  return (
    <EmployeeLayout title="My Attendance" subtitle="Track your daily attendance and working hours">
      <Suspense fallback={<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>}>
        <AttendanceContent />
      </Suspense>
    </EmployeeLayout>
  );
}
