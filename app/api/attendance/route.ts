import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-guard";
import { getErrorResponse } from "@/lib/api-response";
import { attendanceSearchSchema, manualAttendanceSchema } from "@/lib/validations/attendance";
import { listAttendances, manualAttendance } from "@/lib/server/attendance";

export async function GET(request: NextRequest) {
  const authResult = await requireUser();

  if ("response" in authResult) {
    return authResult.response;
  }

  const { companyId, role, userId } = authResult;
  const { searchParams } = request.nextUrl;

  try {
    const params = attendanceSearchSchema.parse({
      search: searchParams.get("search") || undefined,
      employeeId: searchParams.get("employeeId") || undefined,
      department: searchParams.get("department") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      date: searchParams.get("date") || undefined,
      status: searchParams.get("status") || undefined,
      view: searchParams.get("view") || undefined,
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 20,
    });

    if (role === "EMPLOYEE") {
      const result = await listAttendances(companyId, {
        ...params,
        employeeId: userId,
      });
      return NextResponse.json(result);
    }

    const result = await listAttendances(companyId, params);
    return NextResponse.json(result);
  } catch (error) {
    return getErrorResponse(error, "Failed to fetch attendances.");
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireUser();

  if ("response" in authResult) {
    return authResult.response;
  }

  const { userId, companyId, role } = authResult;

  if (role !== "HR_ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Not authorized." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = manualAttendanceSchema.parse(body);
    const result = await manualAttendance(companyId, userId, parsed);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return getErrorResponse(error, "Failed to create manual attendance entry.");
  }
}
