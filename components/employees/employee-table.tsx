"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MdAdd, MdSearch, MdFileDownload, MdRefresh } from "react-icons/md";
import { Spinner } from "@/components/ui/loaders/spinner";
import { dismissToast, showError, showLoading, showSuccess } from "@/lib/toast";
import { fetchEmployees, exportEmployeesCSV, type EmployeeListItem, type EmployeeStats } from "@/lib/client/employee";
import { ROUTES } from "@/lib/constants";

type EmployeeTableProps = {
  initialData?: {
    employees: EmployeeListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats?: EmployeeStats | null;
};

export function EmployeeTable({ initialData }: EmployeeTableProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const [data, setData] = useState(initialData || {
    employees: [] as EmployeeListItem[],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const loadEmployees = useCallback(async (params?: { search?: string; page?: number }) => {
    setLoading(true);
    try {
      const result = await fetchEmployees({
        search: params?.search,
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
      loadEmployees({ search: value, page: 1 });
    }, 300);

    setDebounceTimer(timer);
  }, [debounceTimer, loadEmployees]);

  const handlePageChange = useCallback((newPage: number) => {
    loadEmployees({ search, page: newPage });
  }, [search, loadEmployees]);

  const handleExport = async () => {
    setExporting(true);
    const toastId = showLoading("Exporting employees...");

    try {
      const result = await exportEmployeesCSV();

      if (result.error) {
        dismissToast(toastId);
        showError(result.error);
        return;
      }

      if (result.data) {
        const blob = new Blob([result.data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `employees-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        dismissToast(toastId);
        showSuccess("Employees exported successfully.");
      }
    } catch {
      dismissToast(toastId);
      showError("Failed to export employees.");
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PROBATION: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      CONFIRMED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      TERMINATED: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
      RESIGNED: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
      RETIRED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    };
    return styles[status] || "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
            <MdSearch className="text-lg" />
          </span>
          <input
            type="text"
            placeholder="Search by name, email, code..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadEmployees({ search })}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <MdRefresh className="text-lg" />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {exporting ? <Spinner className="text-slate-600 dark:text-slate-400" label="Exporting" /> : <MdFileDownload className="text-lg" />}
            Export
          </button>

          <button
            type="button"
            onClick={() => router.push(ROUTES.HR.EMPLOYEES.NEW)}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-xl dark:shadow-indigo-900/50"
          >
            <MdAdd className="text-lg" />
            Add Employee
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Employee
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Code
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Department
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Designation
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Branch
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Spinner className="mx-auto text-indigo-600" label="Loading" />
                  </td>
                </tr>
              ) : data.employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">No employees found.</p>
                    <button
                      type="button"
onClick={() => router.push(ROUTES.HR.EMPLOYEES.NEW)}
                      className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                    >
                      Add your first employee
                    </button>
                  </td>
                </tr>
              ) : (
                data.employees.map((employee) => (
                  <tr key={employee.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {employee.firstName} {employee.lastName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{employee.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-slate-600 dark:text-slate-400">{employee.employeeCode}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700 dark:text-slate-300">{employee.department || "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700 dark:text-slate-300">{employee.designation || "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(employee.employmentStatus)}`}>
                        {employee.employmentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700 dark:text-slate-300">{employee.branch?.name || "—"}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => router.push(ROUTES.HR.EMPLOYEES.DETAIL(employee.id))}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing {(data.page - 1) * data.limit + 1} to {Math.min(data.page * data.limit, data.total)} of {data.total} employees
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(data.page - 1)}
                disabled={data.page <= 1}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Previous
              </button>
              <span className="px-3 text-sm text-slate-600 dark:text-slate-400">
                Page {data.page} of {data.totalPages}
              </span>
              <button
                type="button"
                onClick={() => handlePageChange(data.page + 1)}
                disabled={data.page >= data.totalPages}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
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
