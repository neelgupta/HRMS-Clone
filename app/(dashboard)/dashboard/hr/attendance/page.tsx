import { AttendanceTable } from "@/components/attendance/attendance-table";
import { requireUser } from "@/lib/auth-guard";
import { listAttendances } from "@/lib/server/attendance";
import type { AttendanceListItem } from "@/lib/client/attendance";

export default async function AttendanceListPage() {
  const authResult = await requireUser();
  if ("response" in authResult) {
    return <div>Unauthorized</div>;
  }

  const { companyId, role } = authResult;

  if (role !== "HR_ADMIN" && role !== "SUPER_ADMIN" && role !== "PAYROLL_MANAGER") {
    return <div>Unauthorized</div>;
  }

  const initialData = await listAttendances(companyId, {
    page: 1,
    limit: 20,
  });

  const typedData: {
    attendances: AttendanceListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } = initialData as never;

  return <AttendanceTable initialData={typedData} showFilters />;
}
