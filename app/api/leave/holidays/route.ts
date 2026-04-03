import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { getErrorResponse } from "@/lib/api-response";
import { holidaySchema } from "@/lib/validations/leave-full";
import { createHoliday, getHolidays, updateHoliday, deleteHoliday } from "@/lib/server/leave-full";

// POST /api/leave/holidays - Create holiday (HR_ADMIN)
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ("response" in authResult) return authResult.response;

  const { companyId, role } = authResult.user;
  if (!["HR_ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = holidaySchema.parse(body);
    const holiday = await createHoliday(companyId, {
      ...parsed,
      date: new Date(parsed.date),
    });
    return NextResponse.json({ holiday }, { status: 201 });
  } catch (error: any) {
    return getErrorResponse(error, error.message || "Failed to create holiday");
  }
}

// GET /api/leave/holidays - List holidays
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ("response" in authResult) return authResult.response;

  const { companyId } = authResult.user;
  const { searchParams } = request.nextUrl;
  const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
  const branchId = searchParams.get("branchId") || undefined;

  try {
    const holidays = await getHolidays(companyId, year, branchId);
    return NextResponse.json({ holidays, year });
  } catch (error: any) {
    return getErrorResponse(error, error.message || "Failed to fetch holidays");
  }
}