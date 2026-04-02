"use client";

import { useState, useEffect, Suspense } from "react";
import {
  MdFreeBreakfast,
  MdCheckCircle,
  MdLogout as MdClockOut,
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
import { breakStart, breakEnd, fetchTodayAttendance, clockOut, clockIn } from "@/lib/client/attendance";
import type { ShiftListItem } from "@/lib/client/attendance";
import { showError, showLoading, dismissToast, showSuccess } from "@/lib/toast";

const chartData = [
  { name: "Mon", hours: 8 }, { name: "Tue", hours: 7.5 }, { name: "Wed", hours: 8 },
  { name: "Thu", hours: 8.5 }, { name: "Fri", hours: 8 },
];

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

  useEffect(() => {
    loadAttendance();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      if (isClockedIn && !isOnBreak) {
        loadAttendance();
      }
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
        }
      }
    } finally {
      setActionLoading(false);
      setRemarks("");
    }
  };

  return (
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

      {/* Summary */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">This Week</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
            <span className="text-sm text-slate-600 dark:text-slate-300">Present Days</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">5</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
            <span className="text-sm text-slate-600 dark:text-slate-300">Total Hours</span>
            <span className="font-semibold text-amber-700 dark:text-amber-400">40 hrs</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
            <span className="text-sm text-slate-600 dark:text-slate-300">Avg per Day</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">8 hrs</span>
          </div>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Weekly Working Hours</h2>
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
