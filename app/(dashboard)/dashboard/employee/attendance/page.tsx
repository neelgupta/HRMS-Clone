"use client";

import { useState, useEffect, Suspense } from "react";
import {
  MdFreeBreakfast,
  MdCheckCircle,
  MdLogout as MdClockOut,
  MdSearch,
  MdRefresh,
  MdVisibility,
  MdEdit,
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
} from "react-icons/md";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { EmployeeLayout } from "@/components/employee";
import { breakStart, breakEnd, fetchTodayAttendance, clockOut, clockIn, fetchEmployeeAttendanceDashboard, type EmployeeAttendanceDashboard, type AttendanceListItem, fetchAttendances } from "@/lib/client/attendance";
import type { ShiftListItem } from "@/lib/client/attendance";
import { showError, showLoading, dismissToast, showSuccess } from "@/lib/toast";

type ModalType = "clockIn" | "clockOut" | "breakStart" | "breakEnd";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri"];

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
  const [dashboard, setDashboard] = useState<EmployeeAttendanceDashboard | null>(null);
  const [attendances, setAttendances] = useState<AttendanceListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const getDefaultDateFrom = () => {
    const today = new Date();
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 6);
    return last7Days.toISOString().split("T")[0];
  };

  const [dateFrom, setDateFrom] = useState(getDefaultDateFrom);
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [presentDays, setPresentDays] = useState(0);
  const [weekTotalHours, setWeekTotalHours] = useState(0);
  const [weekAvgHours, setWeekAvgHours] = useState(0);

  const parseYmdToUtc = (ymd: string) => new Date(`${ymd}T00:00:00.000Z`);
  const formatYmdUtc = (date: Date) => date.toISOString().slice(0, 10);

  const getDaysBetweenInclusive = (fromYmd: string, toYmd: string) => {
    const start = parseYmdToUtc(fromYmd);
    const end = parseYmdToUtc(toYmd);
    const days: Date[] = [];
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return days;
    if (end.getTime() < start.getTime()) return days;
    // Cap to avoid generating huge placeholder tables.
    const maxDays = 31;
    const diffDays = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60_000));
    const count = Math.min(maxDays - 1, diffDays);
    for (let i = 0; i <= count; i++) {
      days.push(new Date(start.getTime() + i * 24 * 60 * 60_000));
    }
    return days;
  };

  const loadAttendance = async () => {
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

  const loadDashboard = async () => {
    const month = `${currentTime.getFullYear()}-${String(currentTime.getMonth() + 1).padStart(2, "0")}`;
    const result = await fetchEmployeeAttendanceDashboard(month);
    if (result.data) {
      setDashboard(result.data);
      setPresentDays(result.data.summary.present);
      
      const todayUtc = new Date();
      const day = todayUtc.getUTCDay(); // 0=Sun
      const mondayOffset = (day + 6) % 7;
      const monday = new Date(Date.UTC(todayUtc.getUTCFullYear(), todayUtc.getUTCMonth(), todayUtc.getUTCDate()));
      monday.setUTCDate(monday.getUTCDate() - mondayOffset);
      const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60_000);
      const fromYmd = formatYmdUtc(monday);
      const toYmd = formatYmdUtc(sunday);

      const weekData = (result.data.timelogs || []).filter((t) => t.date >= fromYmd && t.date <= toYmd);
      const totalHrs = weekData.reduce((sum, t) => sum + t.beforeBreak + t.afterBreak + t.break, 0);
      setWeekTotalHours(totalHrs);
      const daysWithData = weekData.filter(t => t.beforeBreak > 0 || t.afterBreak > 0).length;
      setWeekAvgHours(daysWithData > 0 ? totalHrs / daysWithData : 0);
    }
  };

  const loadAttendances = async () => {
    setLoading(true);
    try {
      const rangeDays =
        dateFrom && dateTo ? getDaysBetweenInclusive(dateFrom, dateTo).length : 0;
      const limit = page === 1 && rangeDays > 0 ? Math.max(20, Math.min(31, rangeDays)) : 20;

      const result = await fetchAttendances({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        limit,
      });
      if (result.data) {
        setAttendances(result.data.attendances);
        setTotalPages(result.data.totalPages);
        setTotal(result.data.total);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
    loadDashboard();
    loadAttendances();
  }, []);

  useEffect(() => {
    loadAttendances();
  }, [page, dateFrom, dateTo]);

  useEffect(() => {
    if (!isClockedIn) {
      setCurrentTime(new Date());
      return;
    }
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [isClockedIn, isOnBreak]);

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
          await loadAttendance();
          await loadDashboard();
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
          setCurrentTime(new Date());
          await loadAttendance();
          await loadDashboard();
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
          await loadAttendance();
          await loadDashboard();
          await loadAttendances();
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
          await loadAttendance();
          await loadDashboard();
          await loadAttendances();
        }
      }
    } finally {
      setActionLoading(false);
      setRemarks("");
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatHours = (hours: number | null) => {
    if (hours === null || hours === undefined) return "-";
    if (hours <= 0) return "-";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const isWeekend = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const getStatusBadge = (status: string, dateStr: string) => {
    const isWk = isWeekend(dateStr);
    if (isWk) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          WK
        </span>
      );
    }
    const styles: Record<string, string> = {
      PRESENT: "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400",
      LATE: "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400",
      HALF_DAY: "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400",
      ABSENT: "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400",
      ON_LEAVE: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400",
      HOLIDAY: "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400",
      WEEK_OFF: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
      PENDING: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
    };
    let displayStatus = status;
    if (status === "PRESENT") displayStatus = "FD";
    else if (status === "HALF_DAY") displayStatus = "HD";
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.PENDING}`}>
        {displayStatus.replace("_", " ")}
      </span>
    );
  };

  const handleFilterApply = () => {
    setPage(1);
    loadAttendances();
  };

  const attendanceRows = (() => {
    if (!dateFrom || !dateTo || page !== 1) return attendances;
    const days = getDaysBetweenInclusive(dateFrom, dateTo);
    if (days.length === 0) return attendances;

    const byYmd = new Map<string, AttendanceListItem>();
    for (const att of attendances) {
      const ymd = formatYmdUtc(new Date(att.date));
      byYmd.set(ymd, att);
    }

    const rows: AttendanceListItem[] = [];
    // Show latest first (same as API orderBy date: desc).
    for (const d of days.reverse()) {
      const ymd = formatYmdUtc(d);
      const found = byYmd.get(ymd);
      if (found) {
        rows.push(found);
      } else {
        rows.push({
          id: `missing-${ymd}`,
          employeeId: "",
          employeeName: "",
          employeeCode: "",
          date: d.toISOString(),
          clockIn: null,
          clockOut: null,
          totalBreakMins: null,
          totalHours: null,
          overtimeHours: null,
          status: "PENDING",
          shift: null,
        });
      }
    }
    return rows;
  })();

  const chartData = (() => {
    const timelogs = dashboard?.timelogs || [];
    if (timelogs.length === 0) return weekDays.map((day) => ({ name: day, hours: 0 }));

    const todayUtc = new Date();
    const day = todayUtc.getUTCDay(); // 0=Sun
    const mondayOffset = (day + 6) % 7;
    const monday = new Date(Date.UTC(todayUtc.getUTCFullYear(), todayUtc.getUTCMonth(), todayUtc.getUTCDate()));
    monday.setUTCDate(monday.getUTCDate() - mondayOffset);
    const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60_000);
    const fromYmd = formatYmdUtc(monday);
    const toYmd = formatYmdUtc(sunday);

    const weekData = timelogs.filter((t) => t.date >= fromYmd && t.date <= toYmd);
    if (weekData.length === 0) return weekDays.map((d) => ({ name: d, hours: 0 }));

    return weekData.map((t) => ({
      name: t.day,
      hours: t.beforeBreak + t.afterBreak + t.break,
    }));
  })();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Attendance History Table */}
      <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Attendance History</h2>
        </div>
        <div className="p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
            />
          </div>
          <button
            onClick={handleFilterApply}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Apply
          </button>
          <button
            onClick={() => {
              setDateFrom(getDefaultDateFrom());
              setDateTo(new Date().toISOString().split("T")[0]);
              setPage(1);
            }}
            className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm"
          >
            Reset
          </button>
          <button
            onClick={() => loadAttendances()}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            title="Refresh"
          >
            <MdRefresh className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Day</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Clock In</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Clock Out</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Total Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Break</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Shift</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  </td>
                </tr>
              ) : attendances.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                attendanceRows.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {new Date(att.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {new Date(att.date).toLocaleDateString("en-US", { weekday: "short" })}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(att.status, att.date)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{formatTime(att.clockIn)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{formatTime(att.clockOut)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{formatHours(att.totalHours)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {att.totalBreakMins ? `${att.totalBreakMins}m` : "--"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {att.shift ? `${att.shift.startTime} - ${att.shift.endTime}` : "--"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400" title="View">
                          <MdVisibility className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} entries
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-300"
              >
                <MdKeyboardArrowLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = i + 1;
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`px-3 py-1 text-sm border rounded ${
                      pg === page
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {pg}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-300"
              >
                <MdKeyboardArrowRight className="w-4 h-4" />
              </button>
            </div>
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
