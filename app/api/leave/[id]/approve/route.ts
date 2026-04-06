import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { getErrorResponse } from "@/lib/api-response";
import { approveLeaveSchema, leaveCommentSchema } from "@/lib/validations/leave-full";
import { approveLeaveApplication, getLeaveApplication, addLeaveComment } from "@/lib/server/leave-full";
import {
  sendLeaveApprovedEmail,
  sendLeaveRejectedEmail,
} from "@/lib/email";

// PUT /api/leave/[id]/approve - Approve/reject leave
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if ("response" in authResult) return authResult.response;

  const { userId, companyId, role, name: approverName } = authResult.user;
  const { id } = await params;

  if (!["HR_ADMIN", "SUPER_ADMIN", "DEPT_MANAGER"].includes(role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = approveLeaveSchema.parse(body);

    const application = await approveLeaveApplication(id, userId, parsed.action, parsed.comments);

    if (application && application.employee) {
      const startDate = application.startDate instanceof Date 
        ? application.startDate.toLocaleDateString() 
        : new Date(application.startDate).toLocaleDateString();
      const endDate = application.endDate instanceof Date 
        ? application.endDate.toLocaleDateString() 
        : new Date(application.endDate).toLocaleDateString();
      const leaveType = "Leave";

      if (parsed.action === "APPROVED") {
        await sendLeaveApprovedEmail(
          application.employee.email,
          `${application.employee.firstName} ${application.employee.lastName}`,
          leaveType,
          startDate,
          endDate,
          application.totalDays,
          approverName,
          parsed.comments
        );
      } else if (parsed.action === "REJECTED") {
        await sendLeaveRejectedEmail(
          application.employee.email,
          `${application.employee.firstName} ${application.employee.lastName}`,
          leaveType,
          startDate,
          endDate,
          application.totalDays,
          approverName,
          parsed.comments
        );
      }
    }

    return NextResponse.json({ application });
  } catch (error: any) {
    return getErrorResponse(error, error.message || "Failed to process leave approval");
  }
}

// GET /api/leave/[id] - Get leave application details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if ("response" in authResult) return authResult.response;

  const { companyId } = authResult.user;
  const { id } = await params;

  try {
    const application = await getLeaveApplication(id);
    
    if (!application || application.companyId !== companyId) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ application });
  } catch (error: any) {
    return getErrorResponse(error, error.message || "Failed to fetch leave application");
  }
}

// POST /api/leave/[id]/comments - Add comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if ("response" in authResult) return authResult.response;

  const { userId, companyId } = authResult.user;
  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = leaveCommentSchema.parse(body);

    const application = await getLeaveApplication(id);
    if (!application || application.companyId !== companyId) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const comment = await addLeaveComment(id, userId, parsed.comment, parsed.isInternal);

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error: any) {
    return getErrorResponse(error, error.message || "Failed to add comment");
  }
}