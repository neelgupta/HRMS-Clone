import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-guard";
import { getErrorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

function currentYear() {
  const now = new Date();
  // Fiscal year start: Apr (4)
  return now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1;
}

export async function GET(request: NextRequest) {
  const authResult = await requireUser();
  if ("response" in authResult) return authResult.response;

  const { userId, companyId } = authResult;
  const yearParam = request.nextUrl.searchParams.get("year");
  const fiscalStartYear = yearParam ? Number(yearParam) : currentYear();

  try {
    const user = await prisma.user.findFirst({
      where: { id: userId, companyId },
      select: { employeeId: true },
    });

    if (!user?.employeeId) {
      return NextResponse.json({ message: "Employee not linked to user." }, { status: 400 });
    }

    const employee = await prisma.employee.findFirst({
      where: { id: user.employeeId, companyId, isDeleted: false },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeCode: true,
        basicSalary: true,
        department: { select: { name: true } },
        designation: { select: { name: true } },
      },
    });

    if (!employee) {
      return NextResponse.json({ message: "Employee not found." }, { status: 404 });
    }

    const sharedRuns = await prisma.$queryRaw<
      Array<{ id: string; year: number; month: number; status: string; updatedAt: Date; holidays: number; weekOffDays: number; workingDays: number }>
    >`
      SELECT "id", "year", "month", "status", "updatedAt", "holidays", "weekOffDays", "workingDays"
      FROM "payroll_runs"
      WHERE
        "companyId" = ${companyId}
        AND "sharedWithEmployees" = true
        AND (
          ("year" = ${fiscalStartYear} AND "month" >= 4)
          OR ("year" = ${fiscalStartYear + 1} AND "month" <= 3)
        )
      ORDER BY "year" ASC, "month" ASC
    `;

    const runIds = sharedRuns.map((r) => r.id);
    if (runIds.length === 0) {
      return NextResponse.json({
        year: fiscalStartYear,
        employee: {
          id: employee.id,
          employeeCode: employee.employeeCode,
          firstName: employee.firstName,
          lastName: employee.lastName,
          department: employee.department?.name ?? null,
          designation: employee.designation?.name ?? null,
          basicSalary: employee.basicSalary ?? null,
        },
        payroll: [],
      });
    }

    const items = await prisma.payrollItem.findMany({
      where: { companyId, employeeId: employee.id, payrollRunId: { in: runIds } },
      select: {
        payrollRunId: true,
        basicSalary: true,
        grossPay: true,
        deductions: true,
        netPay: true,
        workingDays: true,
        presentDays: true,
        payableDays: true,
      },
    });

    const itemByRunId = new Map<string, (typeof items)[number]>();
    for (const i of items) itemByRunId.set(i.payrollRunId, i);

    const payroll = sharedRuns
      .map((r) => {
        const item = itemByRunId.get(r.id);
        if (!item) return null;
        return {
          runId: r.id,
          year: r.year,
          month: r.month,
          status: r.status,
          updatedAt: r.updatedAt.toISOString(),
          calendar: {
            workingDays: r.workingDays,
            holidays: r.holidays,
            weekOffDays: r.weekOffDays,
          },
          item: {
            basicSalary: item.basicSalary ?? null,
            grossPay: item.grossPay ?? null,
            deductions: item.deductions ?? null,
            netPay: item.netPay ?? null,
            workingDays: item.workingDays,
            presentDays: item.presentDays,
            payableDays: item.payableDays,
          },
        };
      })
      .filter((r): r is NonNullable<typeof r> => !!r);

    return NextResponse.json({
      year: fiscalStartYear,
      employee: {
        id: employee.id,
        employeeCode: employee.employeeCode,
        firstName: employee.firstName,
        lastName: employee.lastName,
        department: employee.department?.name ?? null,
        designation: employee.designation?.name ?? null,
        basicSalary: employee.basicSalary ?? null,
      },
      payroll,
    });
  } catch (error) {
    return getErrorResponse(error, "Failed to fetch employee payroll.");
  }
}
