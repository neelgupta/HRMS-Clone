"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  MdToday,
  MdCheckCircle,
  MdCancel,
  MdGavel,
  MdAccessTime,
  MdLogout,
  MdBeachAccess,
  MdMoreTime,
  MdHelp,
  MdEventNote,
} from "react-icons/md";
import { EmployeeLayout } from "@/components/employee";
import { DashboardLoader } from "@/components/ui/loader";
import {
  breakStart,
  breakEnd,
  fetchTodayAttendance,
  fetchEmployeeAttendanceDashboard,
  type EmployeeAttendanceDashboard,
  type AttendanceDetail,
} from "@/lib/client/attendance";

type AttendanceActivity = {
  id: string;
  type: "CLOCK_IN" | "CLOCK_OUT" | "BREAK_START" | "BREAK_END";
  time: string;
  formattedTime: string;
};

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const emptyTimelogs: EmployeeAttendanceDashboard["timelogs"] = [
  { name: "—", date: "", day: "Mon", beforeBreak: 0, break: 0, afterBreak: 0, times: { clockIn: null, breakStart: null, breakEnd: null, clockOut: null }, durationsMins: { beforeBreak: 0, break: 0, afterBreak: 0, total: 0 } },
  { name: "—", date: "", day: "Tue", beforeBreak: 0, break: 0, afterBreak: 0, times: { clockIn: null, breakStart: null, breakEnd: null, clockOut: null }, durationsMins: { beforeBreak: 0, break: 0, afterBreak: 0, total: 0 } },
  { name: "—", date: "", day: "Wed", beforeBreak: 0, break: 0, afterBreak: 0, times: { clockIn: null, breakStart: null, breakEnd: null, clockOut: null }, durationsMins: { beforeBreak: 0, break: 0, afterBreak: 0, total: 0 } },
  { name: "—", date: "", day: "Thu", beforeBreak: 0, break: 0, afterBreak: 0, times: { clockIn: null, breakStart: null, breakEnd: null, clockOut: null }, durationsMins: { beforeBreak: 0, break: 0, afterBreak: 0, total: 0 } },
  { name: "—", date: "", day: "Fri", beforeBreak: 0, break: 0, afterBreak: 0, times: { clockIn: null, breakStart: null, breakEnd: null, clockOut: null }, durationsMins: { beforeBreak: 0, break: 0, afterBreak: 0, total: 0 } },
];

type ModalType = "clockIn" | "clockOut" | "breakStart" | "breakEnd";

type TimelogEntry = EmployeeAttendanceDashboard["timelogs"][number];

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatMinutes(mins: number): string {
  if (!mins) return "0m";
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  if (hours <= 0) return `${minutes}m`;
  if (minutes <= 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function formatHms(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function TimelogTooltip(props: {
  active?: boolean;
  payload?: Array<{ payload: TimelogEntry }>;
}) {
  if (!props.active || !props.payload?.length) return null;
  const entry = props.payload[0]?.payload;
  if (!entry) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-lg text-xs min-w-[220px]">
      <p className="font-semibold text-slate-900 dark:text-white mb-2">
        {entry.day}, {entry.name}
      </p>
      <div className="space-y-1 text-slate-600 dark:text-slate-300">
        <p>Clock In: <span className="font-medium text-slate-900 dark:text-white">{formatTime(entry.times.clockIn)}</span></p>
        <p>Break Start: <span className="font-medium text-slate-900 dark:text-white">{formatTime(entry.times.breakStart)}</span></p>
        <p>Break End: <span className="font-medium text-slate-900 dark:text-white">{formatTime(entry.times.breakEnd)}</span></p>
        <p>Clock Out: <span className="font-medium text-slate-900 dark:text-white">{formatTime(entry.times.clockOut)}</span></p>
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
          <p>Before Lunch: <span className="font-medium text-slate-900 dark:text-white">{formatMinutes(entry.durationsMins.beforeBreak)}</span></p>
          <p>Break: <span className="font-medium text-slate-900 dark:text-white">{formatMinutes(entry.durationsMins.break)}</span></p>
          <p>After Break: <span className="font-medium text-slate-900 dark:text-white">{formatMinutes(entry.durationsMins.afterBreak)}</span></p>
          <p>Total Worked: <span className="font-medium text-slate-900 dark:text-white">{formatMinutes(entry.durationsMins.total)}</span></p>
        </div>
      </div>
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [attendanceActivities, setAttendanceActivities] = useState<AttendanceActivity[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceDetail | null>(null);
  const [profile, setProfile] = useState<{
    employee: { firstName: string; lastName: string; designation: string | null; department: string | null; employeeCode: string } | null;
  } | null>(null);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [modalType, setModalType] = useState<ModalType>("clockOut");
  const [remarks, setRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [dashboard, setDashboard] = useState<EmployeeAttendanceDashboard | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const profileResponse = await fetch("/api/employees/me");
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setProfile(profileData);
        }

        const attendanceResult = await fetchTodayAttendance();
        if (attendanceResult.data?.attendance) {
          const attendance = attendanceResult.data.attendance;
          setTodayAttendance(attendance);
          setIsClockedIn(!!attendance.clockIn);
          setIsOnBreak(!!attendance.breakStart && !attendance.breakEnd);
          
          const activities: AttendanceActivity[] = [];
          if (attendance.clockIn) {
            activities.push({
              id: "1",
              type: "CLOCK_IN",
              time: attendance.clockIn,
              formattedTime: new Date(attendance.clockIn).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }),
            });
          }
          if (attendance.breakStart) {
            activities.push({
              id: "2",
              type: "BREAK_START",
              time: attendance.breakStart,
              formattedTime: new Date(attendance.breakStart).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }),
            });
          }
          if (attendance.breakEnd) {
            activities.push({
              id: "3",
              type: "BREAK_END",
              time: attendance.breakEnd,
              formattedTime: new Date(attendance.breakEnd).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }),
            });
          }
          if (attendance.clockOut) {
            activities.push({
              id: "4",
              type: "CLOCK_OUT",
              time: attendance.clockOut,
              formattedTime: new Date(attendance.clockOut).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }),
            });
          }
          setAttendanceActivities(activities);
        } else {
          setTodayAttendance(null);
        }
      } catch {
        console.error("Failed to load data");
      }
    };
    void loadData();
  }, []);

  const loadDashboard = async (monthDate: Date = currentMonth) => {
    const month = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
    const result = await fetchEmployeeAttendanceDashboard(month);
    if (result.data) setDashboard(result.data);
  };

  useEffect(() => {
    void loadDashboard();
  }, [currentMonth]);

  useEffect(() => {
    if (!isClockedIn) return;
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [isClockedIn]);

  const fullName = profile?.employee
    ? `${profile.employee.firstName} ${profile.employee.lastName}`
    : "Employee";

  const initials = profile?.employee
    ? `${profile.employee.firstName.charAt(0)}${profile.employee.lastName.charAt(0)}`
    : "E";

  const clockInActivity = attendanceActivities.find(a => a.type === "CLOCK_IN");
  const breakStartActivity = attendanceActivities.find(a => a.type === "BREAK_START");
  const clockOutActivity = attendanceActivities.find(a => a.type === "CLOCK_OUT");

  const calculateWorkingTime = () => {
    if (!isClockedIn || !clockInActivity) return "—";
    const clockInTime = new Date(clockInActivity.time).getTime();
    let endTime = clockOutActivity ? new Date(clockOutActivity.time).getTime() : Date.now();
    if (isOnBreak && breakStartActivity) {
      endTime = new Date(breakStartActivity.time).getTime();
    }
    const diff = endTime - clockInTime;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours === 0) return `${remainingMins}m`;
    return `${hours}h ${remainingMins}m`;
  };

  const calculateBreakTime = () => {
    if (!isClockedIn || !todayAttendance) return "—";
    const baseSeconds = (todayAttendance.totalBreakMins ?? 0) * 60;
    const liveSeconds =
      todayAttendance.breakStart && !todayAttendance.breakEnd
        ? Math.max(0, Math.floor((currentTime.getTime() - new Date(todayAttendance.breakStart).getTime()) / 1000))
        : 0;
    const totalSeconds = baseSeconds + liveSeconds;
    if (totalSeconds <= 0) return "—";
    return formatHms(totalSeconds);
  };

  const handleBreak = async () => {
    if (actionLoading) return;
    setShowRemarksModal(true);
    setModalType(isOnBreak ? "breakEnd" : "breakStart");
    setRemarks("");
  };

  const handleClockOut = () => {
    setShowRemarksModal(true);
    setModalType("clockOut");
    setRemarks("");
  };

  const handleClockIn = async () => {
    try {
      const response = await fetch("/api/attendance/clock-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (response.ok) {
        const payload = (await response.json().catch(() => null)) as { attendance?: AttendanceDetail } | null;
        if (payload?.attendance) setTodayAttendance(payload.attendance);
        setIsClockedIn(true);
        setAttendanceActivities((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: "CLOCK_IN",
            time: new Date().toISOString(),
            formattedTime: currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
          },
        ]);
        void loadDashboard();
      }
    } catch {
      alert("Failed to clock in");
    }
  };

  const handleModalSubmit = async () => {
    setShowRemarksModal(false);
    setActionLoading(true);

    try {
      if (modalType === "clockOut") {
        const response = await fetch("/api/attendance/clock-out", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ remarks: remarks || undefined }),
        });
        if (response.ok) {
          const payload = (await response.json().catch(() => null)) as { attendance?: AttendanceDetail } | null;
          if (payload?.attendance) setTodayAttendance(payload.attendance);
          setIsClockedIn(false);
          setIsOnBreak(false);
          setAttendanceActivities((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              type: "CLOCK_OUT",
              time: new Date().toISOString(),
              formattedTime: currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
            },
          ]);
          void loadDashboard();
        }
      } else if (modalType === "breakStart") {
        const result = await breakStart({ remarks: remarks || undefined });
        if (result.error) { alert(result.error); return; }
        if (result.data?.attendance) setTodayAttendance(result.data.attendance);
        setIsOnBreak(true);
        setAttendanceActivities((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: "BREAK_START",
            time: new Date().toISOString(),
            formattedTime: currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
          },
        ]);
        void loadDashboard();
      } else if (modalType === "breakEnd") {
        const result = await breakEnd({ remarks: remarks || undefined });
        if (result.error) { alert(result.error); return; }
        if (result.data?.attendance) setTodayAttendance(result.data.attendance);
        setIsOnBreak(false);
        setAttendanceActivities((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: "BREAK_END",
            time: new Date().toISOString(),
            formattedTime: currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
          },
        ]);
          void loadDashboard();
      }
    } catch {
      alert("Failed to process request");
    } finally {
      setActionLoading(false);
      setRemarks("");
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
    return days;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const summaryStats = dashboard?.summary ?? {
    present: 0,
    absent: 0,
    lateIn: 0,
    earlyOut: 0,
    halfDay: 0,
    penalty: 0,
  };

  const chartData = dashboard?.timelogs ?? emptyTimelogs;
  const chartMinWidth = Math.max(560, chartData.length * 44);
  const xInterval = chartData.length > 14 ? Math.ceil(chartData.length / 10) : 0;
  const barSize = chartData.length > 24 ? 10 : chartData.length > 14 ? 14 : 22;
  
  const alerts = dashboard?.alerts ?? null;

  return (
    <>
      <div className="grid grid-cols-12 gap-6 mb-6">
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-indigo-900">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 dark:text-white truncate">{fullName}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{profile?.employee?.designation || "Employee"}</p>
                <span className="inline-flex mt-1.5 items-center rounded-full bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800">
                  Active
                </span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-xl p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Department</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5 truncate">{profile?.employee?.department || "N/A"}</p>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-xl p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Employee ID</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{profile?.employee?.employeeCode || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700 rounded-2xl p-6 h-full shadow-lg shadow-indigo-200 dark:shadow-indigo-900 text-white">
            <h3 className="text-sm font-medium text-indigo-100 dark:text-indigo-200 mb-3">My Timing</h3>
            {/* <div className="text-center mb-4">
              <div className="text-4xl font-bold">
                {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
              </div>
              <div className="text-xs text-indigo-200 dark:text-indigo-300 mt-1">
                {currentTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </div>
            </div> */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <p className="text-xs text-indigo-200 dark:text-indigo-300">Current Time</p>
                <p className="text-sm font-bold text-white">{isClockedIn ? calculateWorkingTime() : "—"}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <p className="text-xs text-indigo-200 dark:text-indigo-300">Break Time</p>
                <p className="text-sm font-bold text-white">{calculateBreakTime()}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {!isClockedIn ? (
                <button onClick={handleClockIn}
                  className="flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold bg-white text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-100 transition-all flex items-center justify-center gap-1.5 shadow-lg cursor-pointer">
                  <MdCheckCircle className="text-base" /> Clock In
                </button>
              ) : (
                <>
                  <button onClick={handleBreak} disabled={actionLoading}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-lg ${
                      isOnBreak ? "bg-orange-400 hover:bg-orange-500 text-white" : "bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm cursor-pointer"
                    }`}>
                    <MdAccessTime className="text-base" />
                    {actionLoading ? "..." : isOnBreak ? "End Break" : "Break"}
                  </button>
                  <button onClick={handleClockOut}
                    className="flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold bg-white text-red-500 hover:bg-red-50 dark:hover:bg-red-100 transition-all flex items-center justify-center gap-1.5 shadow-lg cursor-pointer">
                    <MdLogout className="text-base" /> Clock Out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 h-full shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Today&apos;s Activity</h3>
            {attendanceActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                  <MdToday className="text-2xl text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {attendanceActivities.slice(-4).map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-2 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-700/50 dark:to-transparent rounded-xl">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${
                      activity.type === "CLOCK_IN" ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white" :
                      activity.type === "CLOCK_OUT" ? "bg-gradient-to-br from-red-400 to-red-600 text-white" :
                      activity.type === "BREAK_START" ? "bg-gradient-to-br from-indigo-400 to-indigo-600 text-white" :
                      "bg-gradient-to-br from-orange-400 to-orange-600 text-white"
                    }`}>
                      {activity.type === "CLOCK_IN" && <MdCheckCircle className="text-sm" />}
                      {activity.type === "CLOCK_OUT" && <MdLogout className="text-sm" />}
                      {activity.type === "BREAK_START" && <MdAccessTime className="text-sm" />}
                      {activity.type === "BREAK_END" && <MdAccessTime className="text-sm" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {activity.type === "CLOCK_IN" && "Clock In"}
                        {activity.type === "CLOCK_OUT" && "Clock Out"}
                        {activity.type === "BREAK_START" && "Break Start"}
                        {activity.type === "BREAK_END" && "Break End"}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{activity.formattedTime}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 mb-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">My Attendance Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 rounded-xl p-3 text-center ring-1 ring-emerald-100 dark:ring-emerald-800/50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <MdCheckCircle className="text-lg text-white" />
            </div>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-2">{summaryStats.present}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500 font-medium">Present</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 rounded-xl p-3 text-center ring-1 ring-red-100 dark:ring-red-800/50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center mx-auto shadow-sm">
              <MdCancel className="text-lg text-white" />
            </div>
            <p className="text-xl font-bold text-red-700 dark:text-red-400 mt-2">{summaryStats.absent}</p>
            <p className="text-xs text-red-600 dark:text-red-500 font-medium">Absent</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 rounded-xl p-3 text-center ring-1 ring-amber-100 dark:ring-amber-800/50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto shadow-sm">
              <MdAccessTime className="text-lg text-white" />
            </div>
            <p className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-2">{summaryStats.lateIn}</p>
            <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">Late In</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 rounded-xl p-3 text-center ring-1 ring-orange-100 dark:ring-orange-800/50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mx-auto shadow-sm">
              <MdLogout className="text-lg text-white" />
            </div>
            <p className="text-xl font-bold text-orange-700 dark:text-orange-400 mt-2">{summaryStats.earlyOut}</p>
            <p className="text-xs text-orange-600 dark:text-orange-500 font-medium">Early Out</p>
          </div>
          <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/30 dark:to-blue-900/30 rounded-xl p-3 text-center ring-1 ring-sky-100 dark:ring-sky-800/50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center mx-auto shadow-sm">
              <MdAccessTime className="text-lg text-white" />
            </div>
            <p className="text-xl font-bold text-sky-700 dark:text-sky-400 mt-2">{summaryStats.halfDay}</p>
            <p className="text-xs text-sky-600 dark:text-sky-500 font-medium">Half Day</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-xl p-3 text-center ring-1 ring-purple-100 dark:ring-purple-800/50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mx-auto shadow-sm">
              <MdGavel className="text-lg text-white" />
            </div>
            <p className="text-xl font-bold text-purple-700 dark:text-purple-400 mt-2">{summaryStats.penalty}</p>
            <p className="text-xs text-purple-600 dark:text-purple-500 font-medium">Penalty</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5 mb-5">
        <div className="col-span-12 lg:col-span-7">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                My Timelogs - {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Before Break</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-400"></span> Break</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-600"></span> After Break</span>
              </div>
            </div>
            <div className="h-52">
              <div className="h-52 overflow-x-auto">
                <div className="h-52" style={{ minWidth: chartMinWidth }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barSize={barSize}>
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        interval={xInterval}
                        tick={{ fill: "#64748B", fontSize: 11 }}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
                      <Tooltip content={<TimelogTooltip />} />
                      <Bar dataKey="beforeBreak" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="break" stackId="a" fill="#FBBF24" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="afterBreak" stackId="a" fill="#059669" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 h-full shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Attendance Calendar</h3>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  <span className="text-slate-500 dark:text-slate-400 text-sm">{"<"}</span>
                </button>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 min-w-[90px] text-center">
                  {monthNames[currentMonth.getMonth()].slice(0, 3)} {currentMonth.getFullYear()}
                </span>
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  <span className="text-slate-500 dark:text-slate-400 text-sm">{">"}</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-[10px] font-semibold text-indigo-400 dark:text-indigo-500 py-1 w-[40px]">{day}</div>
              ))}
              {getDaysInMonth(currentMonth).map((date, index) => {
                if (!date) return <div key={`empty-${index}`} className="aspect-square h-[40px]"></div>;
                return (
                  <div key={date.toISOString()}
                    className={`aspect-square flex items-center justify-center rounded-xl text-xs font-medium transition-all w-[40px] h-[40px] ${
                      isToday(date) ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}>
                    {date.getDate()}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 md:col-span-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Alerts</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-900/20 dark:to-transparent rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm">
                  <MdCheckCircle className="text-lg text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Early Out</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {!alerts ? "—" : alerts.earlyOut > 0 ? `${alerts.earlyOut} early out${alerts.earlyOut === 1 ? "" : "s"} this month` : "No early out this month"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-900/20 dark:to-transparent rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm">
                  <MdCheckCircle className="text-lg text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Late Arrivals</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {!alerts ? "—" : alerts.lateArrivals > 0 ? `${alerts.lateArrivals} late arrival${alerts.lateArrivals === 1 ? "" : "s"} this month` : "No late arrivals this month"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 md:col-span-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Quick Links</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => router.push("/dashboard/employee/leave")}
                className="flex items-center gap-2 p-3 bg-gradient-to-r from-indigo-50 to-transparent dark:from-indigo-900/20 dark:to-transparent rounded-xl hover:from-indigo-100 dark:hover:from-indigo-900/40 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  <MdEventNote className="text-lg text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Apply Leave</span>
              </button>
              <button onClick={() => router.push("/dashboard/employee/holidays")}
                className="flex items-center gap-2 p-3 bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-900/20 dark:to-transparent rounded-xl hover:from-purple-100 dark:hover:from-purple-900/40 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  <MdBeachAccess className="text-lg text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Holidays</span>
              </button>
              <button onClick={() => router.push("/dashboard/employee/overtime")}
                className="flex items-center gap-2 p-3 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-900/20 dark:to-transparent rounded-xl hover:from-amber-100 dark:hover:from-amber-900/40 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  <MdMoreTime className="text-lg text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Overtime</span>
              </button>
              <button onClick={() => router.push("/dashboard/employee/help")}
                className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent rounded-xl hover:from-blue-100 dark:hover:from-blue-900/40 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  <MdHelp className="text-lg text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Help Desk</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Notice Board</h3>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-2xl flex items-center justify-center">
            <MdToday className="text-2xl text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-4">No Notice Found</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">New notices will appear here</p>
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
    </>
  );
}

export default function EmployeeDashboard() {
  return (
    <Suspense fallback={<DashboardLoader />}>
      <EmployeeLayout>
        <DashboardContent />
      </EmployeeLayout>
    </Suspense>
  );
}
