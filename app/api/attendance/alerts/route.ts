import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-guard";
import { getErrorResponse } from "@/lib/api-response";
import { getEmployeeShift } from "@/lib/server/attendance";
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

    const employeeId = user.employeeId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const attendances = await prisma.attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      select: {
        date: true,
        clockIn: true,
        clockOut: true,
        totalHours: true,
        status: true,
      },
      orderBy: { date: "asc" },
    });

    const shiftResult = await getEmployeeShift(employeeId, today);
    const shiftHours = shiftResult.shift?.minWorkingHours || 8;

    let earlyOutCount = 0;
    let lateArrivalCount = 0;
    let halfDayCount = 0;

    const graceMinutes = shiftResult.shift?.gracePeriodMins || 15;
    const shiftStartHour = shiftResult.shift?.startTime 
      ? parseInt(shiftResult.shift.startTime.split(":")[0])
      : 9;
    const shiftStartMinute = shiftResult.shift?.startTime 
      ? parseInt(shiftResult.shift.startTime.split(":")[1])
      : 0;
    const shiftStartTime = shiftStartHour * 60 + shiftStartMinute;

    for (const attendance of attendances) {
      if (attendance.clockIn) {
        const clockInDate = new Date(attendance.clockIn);
        const clockInMinutes = clockInDate.getHours() * 60 + clockInDate.getMinutes();
        
        if (clockInMinutes > shiftStartTime + graceMinutes) {
          lateArrivalCount++;
        }
      }

      if (attendance.totalHours !== null && attendance.totalHours < shiftHours / 2) {
        halfDayCount++;
      }

      if (attendance.clockOut) {
        const clockOutDate = new Date(attendance.clockOut);
        const clockOutMinutes = clockOutDate.getHours() * 60 + clockOutDate.getMinutes();
        const expectedClockOutMinutes = shiftStartTime + (shiftHours * 60);
        
        if (clockOutMinutes < expectedClockOutMinutes - 30) {
          earlyOutCount++;
        }
      }
    }

    const maxLateArrivalsAllowed = 3;
    const remainingLateAllowed = Math.max(0, maxLateArrivalsAllowed - lateArrivalCount);

    return Response.json({
      earlyOut: earlyOutCount,
      lateArrivals: lateArrivalCount,
      halfDays: halfDayCount,
      shiftHours,
      maxLateArrivalsAllowed,
      remainingLateAllowed,
    });
  } catch (error) {
    return getErrorResponse(error, "Failed to fetch alerts.");
  }
}
