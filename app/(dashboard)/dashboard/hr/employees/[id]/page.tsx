"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmployeeProfile } from "@/components/employees/employee-profile";
import { Spinner } from "@/components/ui/loaders/spinner";

import type { EmployeeDetail } from "@/lib/client/employee";

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const employeeId = params.id as string;

  const fetchEmployee = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/employees/${employeeId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError("Employee not found.");
        } else {
          setError("Failed to load employee.");
        }
        return;
      }

      const data = await response.json();
      setEmployee(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  if (loading) {
    return (
      <>
      
        <div className="flex items-center justify-center py-20">
          <Spinner className="text-indigo-600" label="Loading" />
        </div>
      </>
    );
  }

  if (error || !employee) {
    return (
      <DashboardLayout title="Employee Profile" subtitle="View employee details">
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-slate-600 dark:text-slate-400">{error || "Employee not found."}</p>
          <button
            type="button"
            onClick={() => router.push("/dashboard/hr/employees")}
            className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Back to Employees
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push("/dashboard/hr/employees")}
          className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          ← Back to Employees
        </button>
      </div>

      <EmployeeProfile employee={employee} onUpdate={fetchEmployee} />
    </>
  );
}
