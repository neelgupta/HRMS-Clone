import { ShiftManager } from "@/components/attendance/shift-manager";
import { requireUser } from "@/lib/auth-guard";
import { listShifts } from "@/lib/server/attendance";
import type { ShiftListItem } from "@/lib/client/attendance";

export default async function ShiftsPage() {
  const authResult = await requireUser();
  if ("response" in authResult) {
    return <div>Unauthorized</div>;
  }

  const { companyId, role } = authResult;

  if (role !== "HR_ADMIN" && role !== "SUPER_ADMIN") {
    return <div>Unauthorized</div>;
  }

  const initialData = await listShifts(companyId, {
    page: 1,
    limit: 20,
  });

  const typedData: {
    shifts: ShiftListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } = initialData as never;

  return <ShiftManager initialData={typedData} />;
}
