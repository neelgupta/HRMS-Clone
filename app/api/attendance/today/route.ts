import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-guard";
import { getErrorResponse } from "@/lib/api-response";
import { getTodayAttendance, getEmployeeShift } from "@/lib/server/attendance";
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [attendance, shiftResult] = await Promise.all([
      getTodayAttendance(user.employeeId),
      getEmployeeShift(user.employeeId, today),
    ]);

    return Response.json({
      attendance,
      shift: shiftResult.shift,
      currentTime: new Date().toISOString(),
    });
  } catch (error) {
    return getErrorResponse(error, "Failed to fetch today's attendance.");
  }
}
