import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { getErrorResponse } from "@/lib/api-response";
import { updateLeaveStatusSchema } from "@/lib/validations/leave";
import { updateLeaveStatus } from "@/lib/server/leave";

// DELETE /api/leave/[id] - Employee cancels their own leave application
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { userId, companyId } = authResult.user;

  try {
    const { id } = await params;
    const { prisma } = await import("@/lib/prisma");

    // Find the leave application
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

    const application = await prisma.leaveApplication.findFirst({
      where: {
        id,
        employeeId: user.employeeId,
        companyId,
      },
    });

    if (!application) {
      return NextResponse.json(
        { message: "Leave application not found." },
        { status: 404 }
      );
    }

    // Only pending leaves can be cancelled
    if (application.status !== "PENDING") {
      return NextResponse.json(
        { message: "Only pending leave applications can be cancelled." },
        { status: 400 }
      );
    }

    // Update the leave status to CANCELLED
    const updated = await prisma.leaveApplication.update({
      where: { id },
      data: {
        status: "CANCELLED",
        isCancelled: true,
      },
    });

    return NextResponse.json({ application: updated });
  } catch (error) {
    return getErrorResponse(error, "Failed to cancel leave application.");
  }
}

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