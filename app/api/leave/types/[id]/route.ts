import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { getErrorResponse } from "@/lib/api-response";
import { updateLeaveTypeConfigSchema } from "@/lib/validations/leave-full";
import { updateLeaveTypeConfig, deleteLeaveTypeConfig, getLeaveTypeConfigs } from "@/lib/server/leave-full";

// PUT /api/leave/types/[id] - Update leave type
// DELETE /api/leave/types/[id] - Delete (deactivate) leave type
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if ("response" in authResult) return authResult.response;

  const { companyId, role } = authResult.user;
  if (!["HR_ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateLeaveTypeConfigSchema.parse(body);
    const leaveType = await updateLeaveTypeConfig(id, parsed);
    return NextResponse.json({ leaveType });
  } catch (error: any) {
    return getErrorResponse(error, error.message || "Failed to update leave type");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if ("response" in authResult) return authResult.response;

  const { companyId, role } = authResult.user;
  if (!["HR_ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    await deleteLeaveTypeConfig(id);
    return NextResponse.json({ message: "Leave type deleted successfully" });
  } catch (error: any) {
    return getErrorResponse(error, error.message || "Failed to delete leave type");
  }
}