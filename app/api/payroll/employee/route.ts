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
  try {
    const authResult = await requireUser();
    if ("response" in authResult) return authResult.response;

    const { userId, companyId } = authResult;
    const yearParam = request.nextUrl.searchParams.get("year");
    const fiscalStartYear = yearParam ? Number(yearParam) : currentYear();

    // Validate year parameter
    if (yearParam && isNaN(Number(yearParam))) {
      return NextResponse.json(
        { message: "Invalid year parameter" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { id: userId, companyId },
      select: { employeeId: true },
    });

    if (!user?.employeeId) {
      return NextResponse.json(
        { message: "Employee not linked to user." },
        { status: 400 }
      );
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
      return NextResponse.json(
        { message: "Employee not found." },
        { status: 404 }
      );
    }

    // Replace raw query with Prisma findMany for better type safety
    const sharedRuns = await prisma.payrollRun.findMany({
      where: {
        companyId: companyId,
        sharedWithEmployees: true,
        OR: [
          {
            year: fiscalStartYear,
            month: { gte: 4 }
          },
          {
            year: fiscalStartYear + 1,
            month: { lte: 3 }
          }
        ]
      },
      select: {
        id: true,
        year: true,
        month: true,
        status: true,
        updatedAt: true,
        holidays: true,
        weekOffDays: true,
        workingDays: true,
      },
      orderBy: [
        { year: 'asc' },
        { month: 'asc' }
      ]
    });

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
      where: { 
        companyId: companyId, 
        employeeId: employee.id, 
        payrollRunId: { in: runIds } 
      },
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

    const itemByRunId = new Map();
    for (const item of items) {
      itemByRunId.set(item.payrollRunId, item);
    }

    const payroll = sharedRuns
      .map((run) => {
        const item = itemByRunId.get(run.id);
        if (!item) return null;
        
        return {
          runId: run.id,
          year: run.year,
          month: run.month,
          status: run.status,
          updatedAt: run.updatedAt?.toISOString() || new Date().toISOString(),
          calendar: {
            workingDays: run.workingDays,
            holidays: run.holidays,
            weekOffDays: run.weekOffDays,
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
      .filter((run): run is NonNullable<typeof run> => run !== null);

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
    console.error("Payroll fetch error:", error);
    return getErrorResponse(error, "Failed to fetch employee payroll.");
  }
}