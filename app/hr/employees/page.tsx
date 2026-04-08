import { EmployeeTable } from "@/components/employees/employee-table";
import { requireUser } from "@/lib/auth-guard";
import { listEmployees } from "@/lib/server/employee";
import type { EmployeeListItem } from "@/lib/client/employee";

export default async function EmployeesPage() {
  const authResult = await requireUser();
  if ("response" in authResult) {
    return <div>Unauthorized</div>;
  }

  const { companyId } = authResult;

  const initialData = await listEmployees(companyId, {
    page: 1,
    limit: 20,
  });

  const typedData: {
    employees: EmployeeListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } = initialData as never;

  return <EmployeeTable initialData={typedData} />;
}
