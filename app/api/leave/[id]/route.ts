import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { getErrorResponse } from "@/lib/api-response";
import { updateLeaveStatusSchema } from "@/lib/validations/leave";
import { updateLeaveStatus } from "@/lib/server/leave";

// PUT /api/leave/[id]/status - HR/Manager approves/rejects leave
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { userId, companyId, role } = authResult.user;

  // Only HR_ADMIN, PAYROLL_MANAGER, DEPT_MANAGER can approve/reject
  if (role !== "HR_ADMIN" && role !== "PAYROLL_MANAGER" && role !== "DEPT_MANAGER") {
    return NextResponse.json(
      { message: "Forbidden. Insufficient permissions." },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateLeaveStatusSchema.parse(body);

    const result = await updateLeaveStatus(companyId, userId, id, {
      status: parsed.status,
      reviewRemarks: parsed.reviewRemarks,
    });

    return NextResponse.json(result);
  } catch (error) {
    return getErrorResponse(error, "Failed to update leave status.");
  }
}

// GET /api/leave/[id] - Get single leave application
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { companyId } = authResult.user;
  const { id } = await params;

  try {
    const { prisma } = await import("@/lib/prisma");
    const application = await prisma.leaveApplication.findFirst({
      where: { id, companyId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { message: "Leave application not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ application });
  } catch (error) {
    return getErrorResponse(error, "Failed to fetch leave application.");
  }
}