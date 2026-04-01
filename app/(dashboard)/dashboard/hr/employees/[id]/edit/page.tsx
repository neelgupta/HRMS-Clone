"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmployeeForm } from "@/components/employees/employee-form";
import { Spinner } from "@/components/ui/loaders/spinner";
import type { EmployeeDetail } from "@/lib/client/employee";

type Branch = {
  id: string;
  name: string;
};

export default function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const employeeId = params.id as string;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [empResponse, companyResponse] = await Promise.all([
        fetch(`/api/employees/${employeeId}`),
        fetch("/api/company/me"),
      ]);

      if (empResponse.ok) {
        const empData = await empResponse.json();
        setEmployee(empData);
      }

      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        if (companyData.company?.values?.branches) {
          setBranches(companyData.company.values.branches);
        }
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <DashboardLayout title="Edit Employee" subtitle="Update employee information">
        <div className="flex items-center justify-center py-20">
          <Spinner className="text-indigo-600" label="Loading" />
        </div>
      </DashboardLayout>
    );
  }

  if (!employee) {
    return (
      <DashboardLayout title="Edit Employee" subtitle="Update employee information">
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-slate-600">Employee not found.</p>
          <button
            type="button"
            onClick={() => router.push("/dashboard/hr/employees")}
            className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Back to Employees
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Edit Employee" subtitle={`${employee.firstName} ${employee.lastName}`}>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push(`/dashboard/hr/employees/${employeeId}`)}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Back to Profile
        </button>
      </div>

      <EmployeeForm employee={employee} companyBranches={branches} />
    </DashboardLayout>
  );
}
