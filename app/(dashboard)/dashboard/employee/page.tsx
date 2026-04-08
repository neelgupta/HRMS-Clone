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
import { ROUTES } from "@/lib/constants";
import { DashboardLoader } from "@/components/ui/loader";
import { breakStart, breakEnd, fetchTodayAttendance } from "@/lib/client/attendance";

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

const chartData = [
  { name: "Mon", beforeBreak: 3, break: 1, afterBreak: 4, missing: 0 },
  { name: "Tue", beforeBreak: 4, break: 0.5, afterBreak: 3.5, missing: 0 },
  { name: "Wed", beforeBreak: 3.5, break: 1, afterBreak: 3.5, missing: 0 },
  { name: "Thu", beforeBreak: 4, break: 0.5, afterBreak: 4, missing: 0 },
  { name: "Fri", beforeBreak: 3, break: 1, afterBreak: 4, missing: 0 },
];

const summaryStats = {
  present: 22,
  absent: 0,
  lateIn: 0,
  earlyOut: 0,
  penalty: 0,
};

type ModalType = "clockIn" | "clockOut" | "breakStart" | "breakEnd";

function DashboardContent() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [attendanceActivities, setAttendanceActivities] = useState<AttendanceActivity[]>([]);
  const [breakLoading, setBreakLoading] = useState(false);
  const [profile, setProfile] = useState<{
    employee: { firstName: string; lastName: string; designation: string | null; department: string | null; employeeCode: string } | null;
  } | null>(null);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalType, setModalType] = useState<ModalType>("clockOut");
  const [remarks, setRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

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
        }
      } catch {
        console.error("Failed to load data");
      }
    };
    void loadData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fullName = profile?.employee
    ? `${profile.employee.firstName} ${profile.employee.lastName}`
    : "Employee";

  const initials = profile?.employee
    ? `${profile.employee.firstName.charAt(0)}${profile.employee.lastName.charAt(0)}`
    : "E";

  const handleBreak = async () => {
    if (breakLoading) return;
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
        }
      } else if (modalType === "breakStart") {
        const result = await breakStart({ remarks: remarks || undefined });
        if (result.error) { alert(result.error); return; }
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
      } else if (modalType === "breakEnd") {
        const result = await breakEnd({ remarks: remarks || undefined });
        if (result.error) { alert(result.error); return; }
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
            <div className="text-center mb-4">
              <div className="text-4xl font-bold">
                {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
              </div>
              <div className="text-xs text-indigo-200 dark:text-indigo-300 mt-1">
                {currentTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </div>
            </div>
            <div className="flex gap-2">
              {!isClockedIn ? (
                <button onClick={handleClockIn}
                  className="flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold bg-white text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-100 transition-all flex items-center justify-center gap-1.5 shadow-lg">
                  <MdCheckCircle className="text-base" /> Clock In
                </button>
              ) : (
                <>
                  <button onClick={handleBreak} disabled={breakLoading}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-lg ${
                      isOnBreak ? "bg-orange-400 hover:bg-orange-500 text-white" : "bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                    }`}>
                    <MdAccessTime className="text-base" />
                    {breakLoading || actionLoading ? "..." : isOnBreak ? "End Break" : "Break"}
                  </button>
                  <button onClick={handleClockOut}
                    className="flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold bg-white text-red-500 hover:bg-red-50 dark:hover:bg-red-100 transition-all flex items-center justify-center gap-1.5 shadow-lg">
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
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
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Before</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-400"></span> Break</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-600"></span> After</span>
              </div>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={28}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #E2E8F0", borderRadius: "12px", fontSize: "12px" }} />
                  <Bar dataKey="beforeBreak" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="break" stackId="a" fill="#FBBF24" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="afterBreak" stackId="a" fill="#059669" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 h-full shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Attendance Calendar</h3>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  <span className="text-slate-500 dark:text-slate-400 text-sm">{"<"}</span>
                </button>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 min-w-[90px] text-center">
                  {monthNames[currentMonth.getMonth()].slice(0, 3)} {currentMonth.getFullYear()}
                </span>
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  <span className="text-slate-500 dark:text-slate-400 text-sm">{">"}</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-[10px] font-semibold text-indigo-400 dark:text-indigo-500 py-1">{day}</div>
              ))}
              {getDaysInMonth(currentMonth).map((date, index) => {
                if (!date) return <div key={`empty-${index}`} className="aspect-square"></div>;
                return (
                  <div key={date.toISOString()}
                    className={`aspect-square flex items-center justify-center rounded-xl text-xs font-medium transition-all ${
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
                  <p className="text-xs text-slate-500 dark:text-slate-400">No early out this month</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-900/20 dark:to-transparent rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm">
                  <MdCheckCircle className="text-lg text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Late Arrivals</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">No late arrivals this month</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 md:col-span-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Quick Links</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => router.push(ROUTES.DASHBOARD.EMPLOYEE.LEAVE.BASE)}
                className="flex items-center gap-2 p-3 bg-gradient-to-r from-indigo-50 to-transparent dark:from-indigo-900/20 dark:to-transparent rounded-xl hover:from-indigo-100 dark:hover:from-indigo-900/40 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  <MdEventNote className="text-lg text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Apply Leave</span>
              </button>
              <button onClick={() => router.push(ROUTES.DASHBOARD.EMPLOYEE.HOLIDAYS)}
                className="flex items-center gap-2 p-3 bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-900/20 dark:to-transparent rounded-xl hover:from-purple-100 dark:hover:from-purple-900/40 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  <MdBeachAccess className="text-lg text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Holidays</span>
              </button>
              <button onClick={() => router.push(ROUTES.DASHBOARD.EMPLOYEE.OVERTIME)}
                className="flex items-center gap-2 p-3 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-900/20 dark:to-transparent rounded-xl hover:from-amber-100 dark:hover:from-amber-900/40 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  <MdMoreTime className="text-lg text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Overtime</span>
              </button>
              <button onClick={() => router.push(ROUTES.DASHBOARD.EMPLOYEE.HELP)}
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
