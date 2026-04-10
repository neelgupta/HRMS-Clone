"use client";

import { useState, useEffect, Suspense, ReactNode, useCallback } from "react";
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
  const [workingHours, setWorkingHours] = useState(0);
  const [breakTime, setBreakTime] = useState(0);
  const [attendanceActivities, setAttendanceActivities] = useState<AttendanceActivity[]>([]);
  const [breakLoading, setBreakLoading] = useState(false);
  const [profile, setProfile] = useState<{
    employee: { firstName: string; lastName: string; designation: string | null; department: string | null; employeeCode: string; photoUrl: string | null } | null;
  } | null>(null);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [modalType, setModalType] = useState<ModalType>("clockOut");
  const [remarks, setRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [shiftAssigned, setShiftAssigned] = useState<boolean | null>(null);

  const calculateWorkingHours = useCallback(() => {
    let totalWorkingSeconds = 0;
    let clockInTime: Date | null = null;
    let breakStartTime: Date | null = null;

    const sortedActivities = [...attendanceActivities].sort((a, b) =>
      new Date(a.time as string).getTime() - new Date(b.time as string).getTime()
    );

    for (const activity of sortedActivities) {
      const activityTime = new Date(activity.time);

      switch (activity.type) {
        case "CLOCK_IN":
          clockInTime = activityTime;
          break;
        case "BREAK_START":
          if (clockInTime) {
            totalWorkingSeconds += (activityTime.getTime() - clockInTime.getTime()) / 1000;
            clockInTime = null;
          }
          breakStartTime = activityTime;
          break;
        case "BREAK_END":
          if (breakStartTime) {
            breakStartTime = null;
          }
          clockInTime = activityTime;
          break;
        case "CLOCK_OUT":
          if (clockInTime) {
            totalWorkingSeconds += (activityTime.getTime() - clockInTime.getTime()) / 1000;
            clockInTime = null;
          }
          break;
      }
    }

    if (isClockedIn && !isOnBreak) {
      if (clockInTime) {
        totalWorkingSeconds += (new Date().getTime() - clockInTime.getTime()) / 1000;
      } else {
        const lastClockIn = sortedActivities
          .filter(a => a.type === "CLOCK_IN")
          .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())[0];

        if (lastClockIn) {
          const lastClockInTime = new Date(lastClockIn.time);
          const hasBreakAfter = sortedActivities.some(a =>
            (a.type === "BREAK_START" || a.type === "BREAK_END") &&
            new Date(a.time).getTime() > lastClockInTime.getTime()
          );

          if (!hasBreakAfter) {
            totalWorkingSeconds += (new Date().getTime() - lastClockInTime.getTime()) / 1000;
          }
        }
      }
    }

    return totalWorkingSeconds;
  }, [attendanceActivities, isClockedIn, isOnBreak]);

  useEffect(() => {
    const hours = calculateWorkingHours();
    setWorkingHours(hours);

    let totalBreakSeconds = 0;
    let breakStartTime: Date | null = null;

    const sortedActivities = [...attendanceActivities].sort((a, b) =>
      new Date(a.time).getTime() - new Date(b.time).getTime()
    );

    sortedActivities.forEach((activity) => {
      const activityTime = new Date(activity.time);

      switch (activity.type) {
        case "BREAK_START":
          breakStartTime = activityTime;
          break;
        case "BREAK_END":
          if (breakStartTime) {
            totalBreakSeconds += (activityTime.getTime() - breakStartTime.getTime()) / 1000;
            breakStartTime = null;
          }
          break;
      }
    });

    if (isOnBreak && breakStartTime) {
      totalBreakSeconds += (new Date().getTime() - breakStartTime.getTime()) / 1000;
    }

    setBreakTime(totalBreakSeconds);
  }, [attendanceActivities, isOnBreak]);

  const formatWorkingHours = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

        if (attendanceResult.data?.shift) {
          setShiftAssigned(true);
        } else {
          setShiftAssigned(false);
        }
      } catch {
        console.error("Failed to load data");
      }
    };
    void loadData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      if (isClockedIn) {
        const hours = calculateWorkingHours();
        setWorkingHours(hours);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isClockedIn, calculateWorkingHours]);

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
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 max-w-[1600px]">
        {/* Row 1 - Profile, Timing, Activity */}
        <div className="grid grid-cols-12 gap-4 mb-4">
          {/* Profile Card */}
          <div className="col-span-12 lg:col-span-4 flex">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/70 dark:border-slate-700/70 p-4 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col w-full">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-2 ring-white/20 dark:ring-slate-700/50 overflow-hidden">
                    {profile?.employee?.photoUrl ? (
                      <img src={profile.employee.photoUrl} alt={fullName} className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse"></div>
                </div>
              </div>
              
              <div className="text-center mb-3">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{fullName}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">{profile?.employee?.designation || "Employee"}</p>
              </div>
              
              <div className="flex justify-center mb-4">
                <span className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                  Active
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-auto">
                <div className="bg-gradient-to-br from-slate-50/80 to-slate-100/80 dark:from-slate-700/50 dark:to-slate-600/50 rounded-lg p-3 border border-slate-200/50 dark:border-slate-600/50">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Department</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 truncate">{profile?.employee?.department || "N/A"}</p>
                </div>
                <div className="bg-gradient-to-br from-slate-50/80 to-slate-100/80 dark:from-slate-700/50 dark:to-slate-600/50 rounded-lg p-3 border border-slate-200/50 dark:border-slate-600/50">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Employee ID</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 font-mono">{profile?.employee?.employeeCode || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* My Timing Card */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/70 dark:border-slate-700/70 p-4 h-full shadow-md hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">My Timing</h3>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${isClockedIn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {isClockedIn ? (isOnBreak ? 'On Break' : 'Working') : 'Offline'}
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-blue-900/30 rounded-xl p-3 mb-3 border border-blue-200/50 dark:border-blue-800/30">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Current Time</div>
                  <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                    <MdToday className="text-blue-600 dark:text-blue-400 text-sm" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {currentTime.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 dark:from-orange-900/30 dark:via-amber-900/30 dark:to-orange-900/30 rounded-xl p-3 border border-orange-200/50 dark:border-orange-800/30">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider">Break</div>
                    <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center">
                      <MdAccessTime className="text-orange-600 dark:text-orange-400 text-sm" />
                    </div>
                  </div>
                  <div className="text-xl font-bold text-orange-600 dark:text-orange-400 tabular-nums text-center">
                    {formatWorkingHours(breakTime)}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 dark:from-green-900/30 dark:via-emerald-900/30 dark:to-green-900/30 rounded-xl p-3 border border-green-200/50 dark:border-green-800/30">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider">Work</div>
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                      <MdCheckCircle className="text-green-600 dark:text-green-400 text-sm" />
                    </div>
                  </div>
                  <div className="text-xl font-bold text-green-600 dark:text-green-400 tabular-nums text-center">
                    {formatWorkingHours(workingHours)}
                  </div>
                </div>
              </div>

              <div className="text-center p-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200/50 dark:border-slate-600/50 mb-3">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {!isClockedIn ? (
                    <span className="flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                      Click "Clock In" to start
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${isOnBreak ? 'bg-orange-500' : 'bg-emerald-500'} animate-pulse`}></span>
                      {isOnBreak ? 'On break' : 'Working'}
                    </span>
                  )}
                </p>
              </div>
              
              <div className="flex gap-2">
                {!isClockedIn ? (
                  <button
                    onClick={() => {
                      if (shiftAssigned === false) {
                        alert("Your shift has not been assigned by HR. Please contact HR to get your shift assigned before clocking in.");
                        return;
                      }
                      handleClockIn();
                    }}
                    disabled={shiftAssigned === null}
                    className="flex-1 py-2 px-3 rounded-lg text-sm font-bold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
                    <MdCheckCircle className="text-base" />
                    <span>{shiftAssigned === null ? "Loading..." : shiftAssigned === false ? "Shift Not Assigned" : "Clock In"}</span>
                  </button>
                ) : (
                  <>
                    <button onClick={handleBreak} disabled={breakLoading}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${isOnBreak
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                        : "bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white"
                        }`}>
                      <MdAccessTime className="text-base" />
                      <span>{breakLoading || actionLoading ? "..." : isOnBreak ? "End Break" : "Start Break"}</span>
                    </button>
                    <button onClick={handleClockOut}
                      className="flex-1 py-2 px-3 rounded-lg text-sm font-bold bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105">
                      <MdLogout className="text-base" />
                      <span>Clock Out</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Today's Activity Card */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/70 dark:border-slate-700/70 p-4 h-full shadow-md hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Today's Activity</h3>
                <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                  <MdToday className="text-slate-600 dark:text-slate-400 text-base" />
                </div>
              </div>
              {attendanceActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                    <MdToday className="text-2xl text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-3">No activity yet</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Start your day</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {attendanceActivities.slice(-4).reverse().map((activity, index) => (
                    <div key={activity.id} className="flex items-center gap-3 p-2 bg-gradient-to-r from-slate-50/80 to-transparent dark:from-slate-700/50 dark:to-transparent rounded-lg border border-slate-200/30 dark:border-slate-600/30 hover:shadow-md transition-all duration-200">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-md ${activity.type === "CLOCK_IN" ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white" :
                        activity.type === "CLOCK_OUT" ? "bg-gradient-to-br from-red-500 to-red-600 text-white" :
                          activity.type === "BREAK_START" ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white" :
                            "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
                        }`}>
                        {activity.type === "CLOCK_IN" && <MdCheckCircle className="text-base" />}
                        {activity.type === "CLOCK_OUT" && <MdLogout className="text-base" />}
                        {activity.type === "BREAK_START" && <MdAccessTime className="text-base" />}
                        {activity.type === "BREAK_END" && <MdAccessTime className="text-base" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {activity.type === "CLOCK_IN" && "Clock In"}
                          {activity.type === "CLOCK_OUT" && "Clock Out"}
                          {activity.type === "BREAK_START" && "Break Start"}
                          {activity.type === "BREAK_END" && "Break End"}
                        </p>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{activity.formattedTime}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/70 dark:border-slate-700/70 p-4 mb-4 shadow-md hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">My Attendance Summary</h3>
            <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">This Month</div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-gradient-to-br from-emerald-50/80 to-green-50/80 dark:from-emerald-900/30 dark:to-green-900/30 rounded-xl p-2 text-center border border-emerald-200/50 dark:border-emerald-800/30">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto">
                <MdCheckCircle className="text-sm text-white" />
              </div>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">{summaryStats.present}</p>
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider">Present</p>
            </div>
            <div className="bg-gradient-to-br from-red-50/80 to-pink-50/80 dark:from-red-900/30 dark:to-pink-900/30 rounded-xl p-2 text-center border border-red-200/50 dark:border-red-800/30">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto">
                <MdCancel className="text-sm text-white" />
              </div>
              <p className="text-xl font-bold text-red-700 dark:text-red-400 mt-1 tabular-nums">{summaryStats.absent}</p>
              <p className="text-[10px] font-bold text-red-600 dark:text-red-500 uppercase tracking-wider">Absent</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50/80 to-yellow-50/80 dark:from-amber-900/30 dark:to-yellow-900/30 rounded-xl p-2 text-center border border-amber-200/50 dark:border-amber-800/30">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mx-auto">
                <MdAccessTime className="text-sm text-white" />
              </div>
              <p className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-1 tabular-nums">{summaryStats.lateIn}</p>
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">Late In</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50/80 to-amber-50/80 dark:from-orange-900/30 dark:to-amber-900/30 rounded-xl p-2 text-center border border-orange-200/50 dark:border-orange-800/30">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto">
                <MdLogout className="text-sm text-white" />
              </div>
              <p className="text-xl font-bold text-orange-700 dark:text-orange-400 mt-1 tabular-nums">{summaryStats.earlyOut}</p>
              <p className="text-[10px] font-bold text-orange-600 dark:text-orange-500 uppercase tracking-wider">Early Out</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50/80 to-indigo-50/80 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-xl p-2 text-center border border-purple-200/50 dark:border-purple-800/30">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mx-auto">
                <MdGavel className="text-sm text-white" />
              </div>
              <p className="text-xl font-bold text-purple-700 dark:text-purple-400 mt-1 tabular-nums">{summaryStats.penalty}</p>
              <p className="text-[10px] font-bold text-purple-600 dark:text-purple-500 uppercase tracking-wider">Penalty</p>
            </div>
          </div>
        </div>

        {/* Timelogs Chart and Calendar */}
        <div className="grid grid-cols-12 gap-4 mb-4">
          <div className="col-span-12 lg:col-span-7">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/70 dark:border-slate-700/70 p-4 h-full shadow-md hover:shadow-lg transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  My Timelogs - {monthNames[currentMonth.getMonth()].slice(0, 3)} {currentMonth.getFullYear()}
                </h3>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Before
                  </span>
                  <span className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 dark:bg-amber-900/30 rounded-md">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span> Break
                  </span>
                  <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span> After
                  </span>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={28} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid #E2E8F0",
                        borderRadius: "8px",
                        fontSize: "11px",
                        fontWeight: 500,
                      }}
                    />
                    <Bar dataKey="beforeBreak" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="break" stackId="a" fill="#FBBF24" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="afterBreak" stackId="a" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/70 dark:border-slate-700/70 p-4 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Calendar</h3>
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-700/50 rounded-md p-1 border border-slate-200/50 dark:border-slate-600/50">
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded transition-all">
                    <span className="text-slate-600 dark:text-slate-400 text-sm font-bold">{"<"}</span>
                  </button>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 min-w-[100px] text-center">
                    {monthNames[currentMonth.getMonth()].slice(0, 3)} {currentMonth.getFullYear()}
                  </span>
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded transition-all">
                    <span className="text-slate-600 dark:text-slate-400 text-sm font-bold">{">"}</span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {weekDays.map((day) => (
                  <div key={day} className="text-center text-xs font-bold text-indigo-400 dark:text-indigo-500 py-1">{day.slice(0, 3)}</div>
                ))}
                {getDaysInMonth(currentMonth).map((date, index) => {
                  if (!date) return <div key={`empty-${index}`} className="aspect-square"></div>;
                  return (
                    <div key={date.toISOString()}
                      className={`aspect-square flex items-center justify-center rounded-lg text-sm font-bold transition-all ${isToday(date) ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`}>
                      {date.getDate()}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Alerts and Quick Links */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">Alerts</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-900/20 dark:to-transparent rounded-lg">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                    <MdCheckCircle className="text-sm text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">Early Out</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">No early out this month</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-900/20 dark:to-transparent rounded-lg">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                    <MdCheckCircle className="text-sm text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">Late Arrivals</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">No late arrivals this month</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 md:col-span-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">Quick Links</h3>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => router.push(ROUTES.EMPLOYEE.LEAVE.BASE)}
                  className="flex items-center gap-1.5 p-2 bg-gradient-to-r from-indigo-50 to-transparent dark:from-indigo-900/20 dark:to-transparent rounded-lg hover:from-indigo-100 transition-all">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                    <MdEventNote className="text-sm text-white" />
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200">Leave</span>
                </button>
                <button onClick={() => router.push(ROUTES.EMPLOYEE.HOLIDAYS)}
                  className="flex items-center gap-1.5 p-2 bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-900/20 dark:to-transparent rounded-lg hover:from-purple-100 transition-all">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <MdBeachAccess className="text-sm text-white" />
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200">Holidays</span>
                </button>
                <button onClick={() => router.push(ROUTES.EMPLOYEE.OVERTIME)}
                  className="flex items-center gap-1.5 p-2 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-900/20 dark:to-transparent rounded-lg hover:from-amber-100 transition-all">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                    <MdMoreTime className="text-sm text-white" />
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200">Overtime</span>
                </button>
                <button onClick={() => router.push(ROUTES.EMPLOYEE.HELP)}
                  className="flex items-center gap-1.5 p-2 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent rounded-lg hover:from-blue-100 transition-all">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <MdHelp className="text-sm text-white" />
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200">Help</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notice Board */}
        <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">Notice Board</h3>
          <div className="flex flex-col items-center justify-center py-4">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-xl flex items-center justify-center">
              <MdToday className="text-xl text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-2">No Notice Found</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">New notices will appear here</p>
          </div>
        </div>

        {/* Remarks Modal */}
        {showRemarksModal && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[9999]">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 w-full max-w-sm mx-3 shadow-2xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-3">
                {modalType === "clockIn" && "Clock In"}
                {modalType === "clockOut" && "Clock Out"}
                {modalType === "breakStart" && "Break Start"}
                {modalType === "breakEnd" && "Break End"}
              </h3>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter remarks (optional)..."
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setShowRemarksModal(false)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleModalSubmit}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {actionLoading ? "..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
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