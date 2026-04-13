import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-guard";
import { getErrorResponse } from "@/lib/api-response";
import { getEmployeeAttendanceDashboard } from "@/lib/server/attendance";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authResult = await requireUser();

  if ("response" in authResult) {
    return authResult.response;
  }

  const { userId, companyId } = authResult;

  try {
    const user = await prisma.user.findFirst({
      where: { id: userId },
      select: { employeeId: true },
    });

    if (!user?.employeeId) {
      return Response.json({ message: "Employee not linked to user." }, { status: 400 });
    }

    const month = request.nextUrl.searchParams.get("month") ?? undefined;

    const dashboard = await getEmployeeAttendanceDashboard({
      companyId,
      employeeId: user.employeeId,
      month: month || undefined,
    });

    return Response.json(dashboard);
  } catch (error) {
    return getErrorResponse(error, "Failed to fetch dashboard attendance.");
  }
}

