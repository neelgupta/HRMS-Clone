"use client";

import { useState, useEffect, Suspense } from "react";
import { MdPeople, MdSearch, MdEmail, MdPhone, MdBusiness, MdBadge } from "react-icons/md";
import { EmployeeLayout } from "@/components/employee";
import { fetchCompanyEmployees, type EmployeeListItem } from "@/lib/client/employee";

type EmployeeData = {
  employees: EmployeeListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function EmployeeCard({ employee }: { employee: EmployeeListItem }) {
  const fullName = `${employee.firstName} ${employee.lastName}`;
  const initials = `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start gap-4">
        {employee.photoUrl ? (
          <img
            src={employee.photoUrl}
            alt={fullName}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 dark:border-slate-700"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-semibold shadow-lg shadow-indigo-200/50 dark:shadow-indigo-900/30">
            {initials}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
            {fullName}
          </h3>
          <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium truncate">
            {employee.designation || "No Designation"}
          </p>
          
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <MdBusiness className="text-lg" />
              <span className="truncate">{employee.department || "No Department"}</span>
            </div>
            
            {employee.email && (
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <MdEmail className="text-lg" />
                <span className="truncate">{employee.email}</span>
              </div>
            )}
            
            {employee.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <MdPhone className="text-lg" />
                <span className="truncate">{employee.phone}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <MdBadge className="text-lg" />
              <span className="truncate">{employee.employeeCode}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${employee.employmentStatus === "ACTIVE" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"}`}>
          {employee.employmentStatus || "N/A"}
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {employee.employmentType || "Full Time"}
        </span>
      </div>
    </div>
  );
}

function EmployeesContent() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EmployeeData | null>(null);
  const [search, setSearch] = useState("");
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const loadEmployees = async (searchQuery?: string, pageNum = 1) => {
    setLoading(true);
    try {
      const result = await fetchCompanyEmployees({
        search: searchQuery,
        page: pageNum,
        limit: 20,
      });
      
      if (result.data) {
        setData(result.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    const timer = setTimeout(() => {
      loadEmployees(value, 1);
    }, 300);
    
    setDebounceTimer(timer);
  };

  const handlePageChange = (newPage: number) => {
    loadEmployees(search, newPage);
  };

  return (
    <div>
      <div className="mb-6">
        <div className="relative max-w-md">
          <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
          <input
            type="text"
            placeholder="Search employees by name, email or code..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : data && data.employees.length > 0 ? (
        <>
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Showing {data.employees.length} of {data.total} employees
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.employees.map((employee) => (
              <EmployeeCard key={employee.id} employee={employee} />
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(data.page - 1)}
                disabled={data.page === 1}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              <span className="px-4 py-2 text-slate-600 dark:text-slate-400">
                Page {data.page} of {data.totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(data.page + 1)}
                disabled={data.page === data.totalPages}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
            <MdPeople className="text-3xl text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-slate-600 dark:text-slate-300 font-medium">No employees found</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            {search ? "Try a different search term" : "No employees in your company yet"}
          </p>
        </div>
      )}
    </div>
  );
}

export default function EmployeesPage() {
  return (
    <EmployeeLayout title="Employee Directory" subtitle="View your colleagues and team members">
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      }>
        <EmployeesContent />
      </Suspense>
    </EmployeeLayout>
  );
}
