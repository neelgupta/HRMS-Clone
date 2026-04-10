import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { getErrorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { userId, companyId } = authResult.user;

  try {
    const { searchParams } = request.nextUrl;
    const month = parseInt(searchParams.get("month") || "");
    const year = parseInt(searchParams.get("year") || "");

    const user = await prisma.user.findFirst({
      where: { id: userId },
      include: { employee: true },
    });

    if (!user || !user.employeeId) {
      return NextResponse.json(
        { message: "Employee profile not found." },
        { status: 404 }
      );
    }

    const employeeId = user.employeeId;

    const where: any = { employeeId };
    if (month && year) {
      where.payrollRun = { month, year, companyId };
    } else {
      where.payrollRun = { companyId };
    }

    const payrollItems = await prisma.payrollItem.findMany({
      where,
      include: {
        payrollRun: {
          select: {
            month: true,
            year: true,
            runDate: true,
            status: true,
          },
        },
      },
      orderBy: [{ payrollRun: { year: "desc" } }, { payrollRun: { month: "desc" } }],
    });

    const payslips = payrollItems.map((item) => ({
      id: item.id,
      month: item.payrollRun.month,
      year: item.payrollRun.year,
      runDate: item.payrollRun.runDate,
      status: item.payrollRun.status,
      workingDays: item.workingDays,
      daysWorked: item.daysWorked,
      lopDays: item.lopDays,
      halfDays: item.halfDays,
      earnings: {
        basic: Number(item.basicEarnings),
        hra: Number(item.hraEarnings),
        conveyance: Number(item.conveyanceEarnings),
        specialAllowance: Number(item.specialAllowance),
        bonus: Number(item.bonusEarnings),
        other: Number(item.otherEarnings),
        overtime: Number(item.overtimeAmount),
        total: Number(item.totalEarnings),
      },
      deductions: {
        pf: Number(item.pfDeduction),
        esi: Number(item.esiDeduction),
        tds: Number(item.tdsDeduction),
        professionalTax: Number(item.professionalTax),
        loan: Number(item.loanDeduction),
        other: Number(item.otherDeductions),
        total: Number(item.totalDeductions),
      },
      grossSalary: Number(item.grossSalary),
      netPay: Number(item.netPay),
      reimbursements: Number(item.reimbursements),
      arrears: Number(item.arrears),
    }));

    return NextResponse.json({ payslips });
  } catch (error) {
    return getErrorResponse(error, "Failed to fetch payslips.");
  }
}