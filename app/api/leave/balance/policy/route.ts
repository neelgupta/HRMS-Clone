import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { getErrorResponse } from "@/lib/api-response";
import { getLeavePolicy, updateLeavePolicy } from "@/lib/server/leave-full";
import { leavePolicySchema } from "@/lib/validations/leave-full";

// GET /api/leave/balance/policy - Get company leave policy
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ("response" in authResult) return authResult.response;

  const { companyId, role } = authResult.user;

  if (!["HR_ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const policy = await getLeavePolicy(companyId);
    return NextResponse.json({ policy });
  } catch (error: any) {
    return getErrorResponse(error, error.message || "Failed to fetch leave policy");
  }
}

// PUT /api/leave/balance/policy - Update company leave policy
export async function PUT(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ("response" in authResult) return authResult.response;

  const { companyId, role } = authResult.user;

  if (!["HR_ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = leavePolicySchema.parse(body);
    
    const policy = await updateLeavePolicy(companyId, {
      ...parsed,
      carryForwardDeadline: parsed.carryForwardDeadline ? new Date(parsed.carryForwardDeadline) : null,
    });
    
    return NextResponse.json({ policy });
  } catch (error: any) {
    return getErrorResponse(error, error.message || "Failed to update leave policy");
  }
}
