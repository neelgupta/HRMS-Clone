import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { getErrorResponse } from "@/lib/api-response";
import { approveCompOffRequest, getCompOffBalance } from "@/lib/server/leave-full";

// PUT /api/leave/comp-off/[id] - Approve/reject comp-off
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if ("response" in authResult) return authResult.response;

  const { userId, role } = authResult.user;
  if (!["HR_ADMIN", "SUPER_ADMIN", "DEPT_MANAGER"].includes(role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { approved, comments } = body;

    const result = await approveCompOffRequest(id, userId, approved, comments);
    return NextResponse.json(result);
  } catch (error: any) {
    return getErrorResponse(error, error.message || "Failed to process comp-off request");
  }
}

// GET /api/leave/comp-off/balance - Get employee's comp-off balance
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if ("response" in authResult) return authResult.response;

  const { userId, companyId, role } = authResult.user;
  const { id } = await params;

  try {
    const { prisma } = await import("@/lib/prisma");

    let employeeId: string | undefined;

    if (role === "EMPLOYEE") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { employeeId: true },
      });
      employeeId = user?.employeeId ?? undefined;
    } else {
      employeeId = id;
    }

    if (!employeeId) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 });
    }

    const balance = await getCompOffBalance(employeeId);
    return NextResponse.json({ balance });
  } catch (error: any) {
    return getErrorResponse(error, error.message || "Failed to fetch comp-off balance");
  }
}