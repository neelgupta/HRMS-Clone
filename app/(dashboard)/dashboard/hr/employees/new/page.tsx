"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EmployeeForm } from "@/components/employees/employee-form";
import { Spinner } from "@/components/ui/loaders/spinner";
import { fetchDepartments } from "@/lib/client/department";
import { fetchDesignations } from "@/lib/client/designation";
import { fetchEmployees } from "@/lib/client/employee";

type Branch = {
  id: string;
  name: string;
};

type Department = {
  id: string;
  name: string;
};

type Designation = {
  id: string;
  name: string;
};

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  department: string | null;
};

export default function NewEmployeePage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [branchesRes, departmentsRes, designationsRes, employeesRes] = await Promise.all([
          fetch("/api/company/me").then((r) => r.json()),
          fetchDepartments(),
          fetchDesignations(),
          fetchEmployees({ page: 1, limit: 100 }).then((r) => r.data?.employees || []),
        ]);

        if (branchesRes.company?.values?.branches) {
          setBranches(branchesRes.company.values.branches);
        }
        setDepartments(departmentsRes);
        setDesignations(designationsRes);
        setEmployees(employeesRes);
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="text-indigo-600" label="Loading" />
      </div>
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

      <EmployeeForm companyBranches={branches} departments={departments} designations={designations} employees={employees} />
    </>
  );
}
