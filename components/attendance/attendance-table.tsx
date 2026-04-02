"use client";

import { useState, useCallback, useEffect } from "react";
import { MdSearch, MdRefresh, MdAdd, MdVisibility, MdEdit } from "react-icons/md";
import { Spinner } from "@/components/ui/loaders/spinner";
import { dismissToast, showError, showLoading, showSuccess } from "@/lib/toast";
import { fetchAttendances, type AttendanceListItem } from "@/lib/client/attendance";

type AttendanceTableProps = {
  initialData?: {
    attendances: AttendanceListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  showFilters?: boolean;
  onManualEntry?: () => void;
};

export function AttendanceTable({ initialData, showFilters = true, onManualEntry }: AttendanceTableProps) {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [data, setData] = useState(initialData || {
    attendances: [] as AttendanceListItem[],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  useEffect(() => {
    if (initialData) {
      setData(initialData);
    }
  }, [initialData]);

  const loadAttendances = useCallback(async (params?: { search?: string; page?: number; dateFrom?: string; dateTo?: string; status?: string }) => {
    setLoading(true);
    try {
      const result = await fetchAttendances({
        search: params?.search,
        dateFrom: params?.dateFrom,
        dateTo: params?.dateTo,
        status: params?.status as "PENDING" | "PRESENT" | "ABSENT" | "HALF_DAY" | "LATE" | "ON_LEAVE" | "HOLIDAY" | "WEEK_OFF" | undefined,
        page: params?.page || 1,
        limit: 20,
      });

      if (result.error) {
        showError(result.error);
        return;
      }

      if (result.data) {
        setData(result.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      loadAttendances({ search: value, page: 1, dateFrom, dateTo, status: statusFilter });
    }, 300);

    setDebounceTimer(timer);
  }, [debounceTimer, loadAttendances, dateFrom, dateTo, statusFilter]);

  const handlePageChange = useCallback((newPage: number) => {
    loadAttendances({ search, page: newPage, dateFrom, dateTo, status: statusFilter });
  }, [search, dateFrom, dateTo, statusFilter, loadAttendances]);

  const handleFilterApply = () => {
    loadAttendances({ search, page: 1, dateFrom, dateTo, status: statusFilter });
  };

  const getStatusBadge = (status: string) => {
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

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.PENDING}`}>
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

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
      <div className="p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by employee name or code..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>

          {showFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm text-gray-900 dark:text-white"
              />
              <span className="text-gray-500 dark:text-gray-400">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm text-gray-900 dark:text-white"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm text-gray-900 dark:text-white"
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
              <button
                onClick={handleFilterApply}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadAttendances({ search, page: data.page, dateFrom, dateTo, status: statusFilter })}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
              title="Refresh"
            >
              <MdRefresh className="w-5 h-5" />
            </button>
            {onManualEntry && (
              <button
                onClick={onManualEntry}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                <MdAdd className="w-4 h-4" />
                Manual Entry
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-slate-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Employee</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Shift</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Clock In</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Clock Out</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Hours</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <Spinner />
                </td>
              </tr>
            ) : data.attendances.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                  No attendance records found.
                </td>
              </tr>
            ) : (
              data.attendances.map((attendance) => (
                <tr key={attendance.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 dark:text-white">{attendance.employeeName}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{attendance.employeeCode}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {new Date(attendance.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {attendance.shift ? (
                      <div>
                        <div className="font-medium">{attendance.shift.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {attendance.shift.startTime} - {attendance.shift.endTime}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">Not assigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{formatTime(attendance.clockIn)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{formatTime(attendance.clockOut)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {attendance.totalHours ? `${attendance.totalHours.toFixed(2)} hrs` : "--"}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(attendance.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data.totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {(data.page - 1) * data.limit + 1} to {Math.min(data.page * data.limit, data.total)} of {data.total} entries
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handlePageChange(data.page - 1)}
              disabled={data.page === 1}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 text-gray-700 dark:text-gray-300"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 text-sm border rounded ${
                    page === data.page
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(data.page + 1)}
              disabled={data.page === data.totalPages}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 text-gray-700 dark:text-gray-300"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
