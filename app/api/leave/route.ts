import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { getErrorResponse } from "@/lib/api-response";
import { createLeaveApplicationFullSchema } from "@/lib/validations/leave-full";
import { createLeaveApplication, listLeaveApplications } from "@/lib/server/leave-full";

// Employee: Submit leave application with half-day support
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { userId, companyId, role } = authResult.user;

  try {
    const body = await request.json();
    const parsed = createLeaveApplicationFullSchema.parse(body);

    const { prisma } = await import("@/lib/prisma");
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { employeeId: true },
    });

    if (!user?.employeeId) {
      return NextResponse.json(
        { message: "Employee profile not found." },
        { status: 400 }
      );
    }

    const application = await createLeaveApplication(companyId, user.employeeId, {
      leaveTypeId: parsed.leaveTypeId,
      startDate: new Date(parsed.startDate),
      endDate: new Date(parsed.endDate),
      startSession: parsed.startSession,
      endSession: parsed.endSession,
      reason: parsed.reason,
      attachmentUrl: parsed.attachmentUrl,
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (error: any) {
    return getErrorResponse(error, error.message || "Failed to submit leave application.");
  }
}

// List leave applications (filtered by role)
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { userId, companyId, role } = authResult.user;
  const { searchParams } = request.nextUrl;

  try {
    const { prisma } = await import("@/lib/prisma");

    let employeeId: string | undefined;
    let approverId: string | undefined;

    if (role === "EMPLOYEE") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { employeeId: true },
      });
      employeeId = user?.employeeId ?? undefined;
    } else if (role === "HR_ADMIN" || role === "SUPER_ADMIN") {
      // HR/Admin can see all - no filter
    } else if (role === "PAYROLL_MANAGER") {
      approverId = userId;
    }

    const filters = {
      employeeId,
      approverId,
      status: searchParams.get("status") as any || undefined,
      leaveTypeId: searchParams.get("leaveTypeId") || undefined,
      startDate: searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined,
      endDate: searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    };

    const result = await listLeaveApplications(companyId, filters);
    return NextResponse.json(result);
  } catch (error) {
    return getErrorResponse(error, "Failed to fetch leave applications.");
  }
}