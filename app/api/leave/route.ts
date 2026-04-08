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
      endDate: parsed.endDate ? new Date(parsed.endDate) : new Date(parsed.startDate),
      reason: parsed.reason,
      isHalfDay: parsed.isHalfDay,
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
    } else if (role === "HR_ADMIN" || role === "SUPER_ADMIN" || role === "PAYROLL_MANAGER") {
      // HR/Admin can see all - no filter
    } else if (role === "DEPT_MANAGER") {
      approverId = userId;
    }

    const statusParam = searchParams.get("status");
    const leaveTypeId = searchParams.get("leaveTypeId") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const filters = {
      employeeId,
      approverId,
      leaveTypeId,
      page,
      limit,
    };

    const result = await listLeaveApplications(companyId, filters, statusParam || undefined);

    // If status is not specified or is "all", also get counts
    if (!statusParam || statusParam === "all") {
      const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
        prisma.leaveApplication.count({ where: { companyId, status: "PENDING" } }),
        prisma.leaveApplication.count({ where: { companyId, status: "APPROVED" } }),
        prisma.leaveApplication.count({ where: { companyId, status: "REJECTED" } }),
      ]);

      return NextResponse.json({
        ...result,
        stats: {
          total: pendingCount + approvedCount + rejectedCount,
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    return getErrorResponse(error, "Failed to fetch leave applications.");
  }
}