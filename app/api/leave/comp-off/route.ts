import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { getErrorResponse } from "@/lib/api-response";
import { compOffRequestSchema } from "@/lib/validations/leave-full";
import { createCompOffRequest, listCompOffRequests, approveCompOffRequest, getCompOffBalance } from "@/lib/server/leave-full";

// POST /api/leave/comp-off - Create comp-off request
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ("response" in authResult) return authResult.response;

  const { userId, companyId, role } = authResult.user;

  try {
    const { prisma } = await import("@/lib/prisma");
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { employeeId: true },
    });

    if (!user?.employeeId) {
      return NextResponse.json({ message: "Employee profile not found." }, { status: 400 });
    }

    const body = await request.json();
    const parsed = compOffRequestSchema.parse(body);

    const result = await createCompOffRequest(companyId, user.employeeId, {
      workDate: new Date(parsed.workDate),
      workSession: parsed.workSession,
      reason: parsed.reason,
      attachmentUrl: parsed.attachmentUrl,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return getErrorResponse(error, error.message || "Failed to create comp-off request");
  }
}

// GET /api/leave/comp-off - List comp-off requests
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ("response" in authResult) return authResult.response;

  const { userId, companyId, role } = authResult.user;
  const { searchParams } = request.nextUrl;

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
      employeeId = searchParams.get("employeeId") || undefined;
    }

    const filters = {
      employeeId,
      status: searchParams.get("status") as any || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    };

    const result = await listCompOffRequests(companyId, filters);
    return NextResponse.json(result);
  } catch (error: any) {
    return getErrorResponse(error, error.message || "Failed to fetch comp-off requests");
  }
}