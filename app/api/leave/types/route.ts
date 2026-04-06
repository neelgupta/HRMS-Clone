import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { getErrorResponse } from "@/lib/api-response";
import { createLeaveTypeConfigSchema, updateLeaveTypeConfigSchema } from "@/lib/validations/leave-full";
import { getLeaveTypeConfigs, createLeaveTypeConfig, updateLeaveTypeConfig, deleteLeaveTypeConfig } from "@/lib/server/leave-full";

// POST /api/leave/types - Create leave type configuration (HR_ADMIN)
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ("response" in authResult) return authResult.response;

  const { companyId, role } = authResult.user;
  if (!["HR_ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createLeaveTypeConfigSchema.parse(body);
    const leaveType = await createLeaveTypeConfig(companyId, parsed);
    return NextResponse.json({ leaveType }, { status: 201 });
  } catch (error: any) {
    return getErrorResponse(error, error.message || "Failed to create leave type");
  }
}

// GET /api/leave/types - List leave types
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ("response" in authResult) return authResult.response;

  const { companyId } = authResult.user;

  try {
    const leaveTypes = await getLeaveTypeConfigs(companyId);
    return NextResponse.json({ leaveTypes });
  } catch (error) {
    return getErrorResponse(error, "Failed to fetch leave types");
  }
}