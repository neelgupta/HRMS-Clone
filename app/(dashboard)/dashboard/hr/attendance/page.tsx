"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { MdSearch, MdRefresh, MdCalendarToday, MdList, MdDownload } from "react-icons/md";
import { Spinner } from "@/components/ui/loaders/spinner";
import { dismissToast, showError, showSuccess } from "@/lib/toast";
import { ROUTES } from "@/lib/constants";

type AttendanceListItem = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string | null;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  totalHours: number | null;
  overtimeHours: number | null;
  status: string;
  shift: { id: string; name: string; startTime: string; endTime: string } | null;
};

type AttendanceData = {
  attendances: AttendanceListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type DayGroupedData = {
  date: string;
  attendances: AttendanceListItem[];
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
};

const statusStyles: Record<string, { bg: string; text: string }> = {
  PRESENT: { bg: "bg-green-100 dark:bg-green-900/50", text: "text-green-700 dark:text-green-400" },
  LATE: { bg: "bg-yellow-100 dark:bg-yellow-900/50", text: "text-yellow-700 dark:text-yellow-400" },
  HALF_DAY: { bg: "bg-orange-100 dark:bg-orange-900/50", text: "text-orange-700 dark:text-orange-400" },
  ABSENT: { bg: "bg-red-100 dark:bg-red-900/50", text: "text-red-700 dark:text-red-400" },
  ON_LEAVE: { bg: "bg-blue-100 dark:bg-blue-900/50", text: "text-blue-700 dark:text-blue-400" },
  HOLIDAY: { bg: "bg-purple-100 dark:bg-purple-900/50", text: "text-purple-700 dark:text-purple-400" },
  WEEK_OFF: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300" },
  PENDING: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300" },
};

const getStatusBadge = (status: string) => {
  const style = statusStyles[status] || statusStyles.PENDING;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      {status.replace("_", " ")}
    </span>
  );
};

const formatTime = (dateStr: string | null) => {
  if (!dateStr) return "--:--";
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatShortDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export default function AttendanceListPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"day" | "list">("day");
  
  // Filters
  const [search, setSearch] = useState("");
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    return "2026-04-07";
  });
  const [dateFrom, setDateFrom] = useState(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstDay.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  
  // Data
  const [loading, setLoading] = useState(true);
  const [dayData, setDayData] = useState<AttendanceListItem[]>([]);
  const [dayStats, setDayStats] = useState({ present: 0, absent: 0, late: 0, halfDay: 0, onLeave: 0, weekOff: 0, holiday: 0 });
  const [listData, setListData] = useState<AttendanceData>({
    attendances: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const fetchDayData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("date", selectedDate);
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (departmentFilter) params.set("department", departmentFilter);
      params.set("view", "day");

      const response = await fetch(`/api/attendance?${params.toString()}`);
      const result = await response.json();

      if (result.message && !result.attendances) {
        showError(result.message || "Failed to fetch attendance data");
        return;
      }

      const data = result.attendances ? result : (result.data || result);
      setDayData(data.attendances || []);
      setDayStats(data.stats || { present: 0, absent: 0, late: 0, halfDay: 0, onLeave: 0, weekOff: 0, holiday: 0 });
    } catch {
      showError("Failed to fetch attendance data");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, search, statusFilter, departmentFilter]);

  const fetchListData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (departmentFilter) params.set("department", departmentFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("view", "list");

      const response = await fetch(`/api/attendance?${params.toString()}`);
      const result = await response.json();

      if (result.message && !result.attendances) {
        showError(result.message || "Failed to fetch attendance data");
        return;
      }

      const data = result.attendances ? result : (result.data || result);
      setListData(data);
    } catch {
      showError("Failed to fetch attendance data");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, departmentFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (activeTab === "day") {
      fetchDayData();
    }
  }, [activeTab, selectedDate]);

  useEffect(() => {
    if (activeTab === "list" && dateFrom && dateTo) {
      fetchListData(1);
    }
  }, [activeTab, dateFrom, dateTo]);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      if (activeTab === "day") fetchDayData();
      else fetchListData(1);
    }, 300);
    setDebounceTimer(timer);
  };

  const handleFilterApply = () => {
    if (activeTab === "day") fetchDayData();
    else fetchListData(1);
  };

  const handlePageChange = (page: number) => {
    fetchListData(page);
  };

  const statCards = [
    { label: "Present", value: dayStats.present, color: "text-green-600" },
    { label: "Late", value: dayStats.late, color: "text-yellow-600" },
    { label: "Half Day", value: dayStats.halfDay, color: "text-orange-600" },
    { label: "Absent", value: dayStats.absent, color: "text-red-600" },
    { label: "On Leave", value: dayStats.onLeave, color: "text-blue-600" },
    { label: "Week Off", value: dayStats.weekOff, color: "text-gray-600" },
    { label: "Holiday", value: dayStats.holiday, color: "text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Attendance Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track and manage employee attendance records</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="border-b border-slate-200 dark:border-slate-700">
          <div className="flex gap-1 p-1">
            <button
              onClick={() => setActiveTab("day")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === "day"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              <MdCalendarToday className="w-4 h-4" />
              Day View
            </button>
            <button
              onClick={() => setActiveTab("list")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === "list"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              <MdList className="w-4 h-4" />
              Full List
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by employee name or code..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            {activeTab === "day" && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            )}

            {activeTab === "list" && (
              <>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white"
                  placeholder="From Date"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white"
                  placeholder="To Date"
                />
              </>
            )}

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="ABSENT">Absent</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="HOLIDAY">Holiday</option>
              <option value="WEEK_OFF">Week Off</option>
            </select>

            {activeTab === "list" && (
              <button
                onClick={() => {
                  const today = new Date();
                  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                  setDateFrom(firstDay.toISOString().split("T")[0]);
                  setDateTo(today.toISOString().split("T")[0]);
                }}
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                This Month
              </button>
            )}

            <button
              onClick={handleFilterApply}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Apply
            </button>

            <button
              onClick={() => activeTab === "day" ? fetchDayData() : fetchListData(1)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              title="Refresh"
            >
              <MdRefresh className="w-5 h-5" />
            </button>
          </div>
        </div>

        {activeTab === "day" && (
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
              {statCards.map((stat) => (
                <div key={stat.label} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-center">
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Department</th>
                {activeTab === "day" && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Date</th>
                )}
                {activeTab === "list" && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Date</th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Shift</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Clock In</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Clock Out</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Total Hours</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <Spinner />
                  </td>
                </tr>
              ) : activeTab === "day" && dayData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                    No attendance records found for {formatDate(selectedDate)}
                  </td>
                </tr>
              ) : activeTab === "list" && listData.attendances.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                (activeTab === "day" ? dayData : listData.attendances).map((attendance) => (
                  <tr key={attendance.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-white">{attendance.employeeName}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{attendance.employeeCode}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {attendance.department || "--"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {formatDate(attendance.date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {attendance.shift ? (
                        <div>
                          <div className="font-medium">{attendance.shift.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {attendance.shift.startTime} - {attendance.shift.endTime}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">Not assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{formatTime(attendance.clockIn)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{formatTime(attendance.clockOut)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {attendance.totalHours ? `${attendance.totalHours.toFixed(2)} hrs` : "--"}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(attendance.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {activeTab === "list" && listData.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Showing {Math.min((listData.page - 1) * listData.limit + 1, listData.total)} to {Math.min(listData.page * listData.limit, listData.total)} of {listData.total} entries
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => handlePageChange(listData.page - 1)}
                disabled={listData.page === 1}
                className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-300"
              >
                Previous
              </button>
              {Array.from({ length: listData.totalPages }, (_, i) => i + 1).filter(p => 
                p === 1 || p === listData.totalPages || (p >= listData.page - 2 && p <= listData.page + 2)
              ).map((page, idx, arr) => (
                <span key={page}>
                  {idx > 0 && arr[idx - 1] !== page - 1 && (
                    <span className="px-2 text-slate-400">...</span>
                  )}
                  <button
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 text-sm border rounded ${
                      page === listData.page
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {page}
                  </button>
                </span>
              ))}
              <button
                onClick={() => handlePageChange(listData.page + 1)}
                disabled={listData.page === listData.totalPages}
                className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}