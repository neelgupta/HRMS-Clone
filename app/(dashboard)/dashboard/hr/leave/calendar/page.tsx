"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineCalendar,
  HiOutlineUser,
  HiOutlineClock,
} from "react-icons/hi";
import { SelectInput } from "@/components/ui/select-input";
import { FormField } from "@/components/ui/form-field";
import { Skeleton } from "@/components/ui/loaders/skeleton";
import type { LeaveApplication, Holiday } from "@/lib/client/leave";

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  leaves: {
    employeeId: string;
    employeeName: string;
    leaveType: string;
    status: string;
  }[];
}

interface Department {
  id: string;
  name: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function LeaveCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    generateCalendar();
  }, [currentDate]);

  useEffect(() => {
    if (selectedDepartment) {
      fetchData();
    }
  }, [currentDate, selectedDepartment]);

  async function fetchDepartments() {
    try {
      const res = await fetch("/api/departments", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.departments || []);
        if (data.departments?.length > 0) {
          setSelectedDepartment(data.departments[0].id);
        }
      }
    } catch {
      toast.error("Failed to fetch departments");
    }
  }

  async function fetchData() {
    if (!selectedDepartment) return;

    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0).toISOString();

      const [leavesRes, holidaysRes] = await Promise.all([
        fetch(`/api/leave?startDate=${startDate}&endDate=${endDate}`, { credentials: "include" }),
        fetch(`/api/leave/holidays?year=${year}`, { credentials: "include" }),
      ]);

      const leavesData = await leavesRes.json();
      const holidaysData = await holidaysRes.json();

      if (leavesRes.ok) {
        let filteredLeaves = leavesData.applications || [];
        if (selectedDepartment) {
          filteredLeaves = filteredLeaves.filter(
            (leave: any) => leave.employee?.departmentId === selectedDepartment
          );
        }
        setLeaves(filteredLeaves);
      }

      if (holidaysRes.ok) {
        setHolidays(holidaysData.holidays || []);
      }
    } catch {
      toast.error("Failed to fetch calendar data");
    } finally {
      setLoading(false);
    }
  }

  function generateCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: CalendarDay[] = [];

    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push(createCalendarDay(date, false, today));
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push(createCalendarDay(date, true, today));
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push(createCalendarDay(date, false, today));
    }

    setCalendarDays(days);
  }

  function createCalendarDay(date: Date, isCurrentMonth: boolean, today: Date): CalendarDay {
    const dayLeaves = leaves.filter((leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      return date >= start && date <= end && leave.status === "APPROVED";
    });

    const holiday = holidays.find((h) => {
      const holidayDate = new Date(h.date);
      holidayDate.setHours(0, 0, 0, 0);
      return holidayDate.getTime() === date.getTime();
    });

    return {
      date,
      day: date.getDate(),
      isCurrentMonth,
      isToday: date.getTime() === today.getTime(),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      isHoliday: !!holiday,
      holidayName: holiday?.name,
      leaves: dayLeaves.map((l) => ({
        employeeId: l.employeeId,
        employeeName: `${l.employee?.firstName || ""} ${l.employee?.lastName || ""}`.trim(),
        leaveType: l.leaveTypeConfig?.name || "Leave",
        status: l.status,
      })),
    };
  }

  function previousMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  const approvedCount = calendarDays.reduce((acc, day) => acc + day.leaves.length, 0);
  const holidayCount = calendarDays.filter((d) => d.isHoliday && d.isCurrentMonth).length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Leave Calendar</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            View team availability and approved leaves
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-64">
            <FormField label="Department">
              <SelectInput
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </SelectInput>
            </FormField>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <HiOutlineCalendar className="text-lg text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {MONTHS[currentDate.getMonth()]}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentDate.getFullYear()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Approved Leaves</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{approvedCount}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Holidays</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{holidayCount}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Team Members</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {new Set(leaves.map((l) => l.employeeId)).size}
          </p>
        </div>
      </div>

      {/* Calendar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={previousMonth}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <HiOutlineChevronLeft className="text-lg" />
          </button>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={nextMonth}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <HiOutlineChevronRight className="text-lg" />
          </button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
          {DAYS.map((day) => (
            <div
              key={day}
              className={`px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide ${
                day === "Sun" || day === "Sat"
                  ? "text-red-500 dark:text-red-400"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="grid grid-cols-7">
            {Array.from({ length: 42 }).map((_, i) => (
              <div key={i} className="min-h-[100px] p-2 border-b border-r border-slate-100 dark:border-slate-700">
                <Skeleton className="h-6 w-6" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                onClick={() => day.leaves.length > 0 && setSelectedDay(day)}
                className={`min-h-[100px] p-2 border-b border-r border-slate-100 dark:border-slate-700 cursor-pointer transition-colors ${
                  !day.isCurrentMonth
                    ? "bg-slate-50 dark:bg-slate-800/50"
                    : day.isToday
                    ? "bg-indigo-50 dark:bg-indigo-900/20"
                    : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium ${
                      day.isToday
                        ? "bg-indigo-600 text-white"
                        : !day.isCurrentMonth
                        ? "text-slate-400 dark:text-slate-500"
                        : day.isWeekend
                        ? "text-red-500 dark:text-red-400"
                        : "text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {day.day}
                  </span>
                </div>

                {/* Holiday */}
                {day.isHoliday && day.isCurrentMonth && (
                  <div className="mb-1 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-xs text-blue-700 dark:text-blue-300 truncate">
                    {day.holidayName}
                  </div>
                )}

                {/* Leaves */}
                <div className="space-y-0.5">
                  {day.leaves.slice(0, 2).map((leave, i) => (
                    <div
                      key={i}
                      className="px-1.5 py-0.5 rounded text-xs truncate bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      title={`${leave.employeeName} - ${leave.leaveType}`}
                    >
                      {leave.employeeName.split(" ")[0]}
                    </div>
                  ))}
                  {day.leaves.length > 2 && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 px-1.5">
                      +{day.leaves.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Approved Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-600" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Today</span>
          </div>
        </div>
      </div>

      {/* Day Detail Modal */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setSelectedDay(null)}
          />
          <div className="relative w-full mx-4 max-w-md bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {MONTHS[selectedDay.date.getMonth()]} {selectedDay.date.getDate()}, {selectedDay.date.getFullYear()}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {selectedDay.isWeekend ? "Weekend" : selectedDay.isHoliday ? selectedDay.holidayName : "Weekday"}
                </p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="w-10 h-10 flex items-center justify-center rounded-2xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {selectedDay.leaves.length === 0 ? (
                <div className="text-center py-8">
                  <HiOutlineCalendar className="text-4xl text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">No leaves on this day</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDay.leaves.map((leave, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50"
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        {leave.employeeName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">{leave.employeeName}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{leave.leaveType}</p>
                      </div>
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        {leave.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
