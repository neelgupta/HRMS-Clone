import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { getErrorResponse } from "@/lib/api-response";
import { ensureEmployeePaidLeaveBalance, getEmployeeLeaveBalances, getLeavePolicy, updateLeavePolicy, initializeEmployeeLeaveBalances } from "@/lib/server/leave-full";
import { leavePolicySchema } from "@/lib/validations/leave-full";

// GET /api/leave/balance - Get employee's leave balances
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ("response" in authResult) return authResult.response;

  const { userId, companyId, role } = authResult.user;
  const { searchParams } = request.nextUrl;

  try {
    const { prisma } = await import("@/lib/prisma");

    // If path is /leave/policy - get company leave policy
    if (request.nextUrl.pathname.endsWith("/policy")) {
      if (!["HR_ADMIN", "SUPER_ADMIN"].includes(role)) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
      const policy = await getLeavePolicy(companyId);
      return NextResponse.json({ policy });
    }

    // Otherwise, get employee balance
    let employeeId: string | undefined;

    if (role === "EMPLOYEE") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { employeeId: true },
      });
      employeeId = user?.employeeId ?? undefined;
    } else {
      employeeId = searchParams.get("employeeId") || undefined;
    }

    if (!employeeId) {
      return NextResponse.json({ message: "Employee ID is required." }, { status: 400 });
    }

    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    await ensureEmployeePaidLeaveBalance(companyId, employeeId, year);
    const balances = await getEmployeeLeaveBalances(employeeId, year);

    return NextResponse.json({ balances, year });
  } catch (error: any) {
    return getErrorResponse(error, error.message || "Failed to fetch leave data.");
  }
}

// PUT /api/leave/policy - Update company leave policy (HR_ADMIN only)
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
    return getErrorResponse(error, error.message || "Failed to update leave policy.");
  }
}

// POST /api/leave/balance/initialize - Initialize leave balances for employee
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ("response" in authResult) return authResult.response;

  const { companyId, role, userId } = authResult.user;

  if (!["HR_ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { employeeId, year } = body;
    
    if (!employeeId || !year) {
      return NextResponse.json({ message: "Employee ID and year are required." }, { status: 400 });
    }

    await initializeEmployeeLeaveBalances(employeeId, companyId, year);
    return NextResponse.json({ message: "Leave balances initialized successfully" });
  } catch (error: any) {
    return getErrorResponse(error, error.message || "Failed to initialize leave balances.");
  }
}
