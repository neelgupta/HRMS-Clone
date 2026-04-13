import { NextResponse, type NextRequest } from "next/server";
import { requirePayrollAdmin } from "@/lib/auth-guard";
import { getErrorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authResult = await requirePayrollAdmin(request);
  if ("response" in authResult) return authResult.response;

  const { companyId } = authResult;
  const { searchParams } = request.nextUrl;

  const yearParam = searchParams.get("year");
  const year = yearParam ? Number(yearParam) : undefined;

  try {
    const runs = await prisma.payrollRun.findMany({
      where: { companyId, ...(year ? { year } : {}) },
      select: {
        id: true,
        year: true,
        month: true,
        workingDays: true,
        holidays: true,
        weekOffDays: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return NextResponse.json({
      runs: runs.map((r) => ({
        id: r.id,
        year: r.year,
        month: r.month,
        workingDays: r.workingDays,
        holidays: r.holidays,
        weekOffDays: r.weekOffDays,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    return getErrorResponse(error, "Failed to fetch payroll runs.");
  }
}

