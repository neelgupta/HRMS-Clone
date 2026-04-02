import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-guard";
import { getErrorResponse } from "@/lib/api-response";
import { clockInSchema } from "@/lib/validations/attendance";
import { clockIn, getEmployeeShift } from "@/lib/server/attendance";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ message: "Employee not linked to user." }, { status: 400 });
    }

    const body = await request.json();
    const parsed = clockInSchema.parse(body);

    const shiftResult = await getEmployeeShift(user.employeeId);
    if (!shiftResult.shift) {
      return NextResponse.json({ message: "No shift assigned. Please contact HR." }, { status: 400 });
    }

    const result = await clockIn(companyId, user.employeeId, parsed);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return getErrorResponse(error, "Failed to clock in.");
  }
}
