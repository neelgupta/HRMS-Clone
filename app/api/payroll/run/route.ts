import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { getErrorResponse } from "@/lib/api-response";
import { runPayroll, getPayrollSettings, lockPayroll } from "@/lib/server/payroll";

// POST /api/payroll/run - Run payroll for a month
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { userId, companyId, role } = authResult.user;

  if (role !== "HR_ADMIN" && role !== "PAYROLL_MANAGER" && role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { message: "Forbidden. Only HR Admin, Payroll Manager, or Super Admin can run payroll." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { month, year } = body;

    if (!month || !year) {
      return NextResponse.json(
        { message: "Month and year are required." },
        { status: 400 }
      );
    }

    const result = await runPayroll(companyId, month, year, userId);

    return NextResponse.json(
      { message: "Payroll processed successfully", payrollRun: result },
      { status: 201 }
    );
  } catch (error: any) {
    return getErrorResponse(error, error.message || "Failed to run payroll.");
  }
}

// GET /api/payroll/run - Get payroll runs
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { companyId, role } = authResult.user;

  if (role !== "HR_ADMIN" && role !== "PAYROLL_MANAGER" && role !== "SUPER_ADMIN" && role !== "DEPT_MANAGER") {
    return NextResponse.json(
      { message: "Forbidden." },
      { status: 403 }
    );
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const { searchParams } = request.nextUrl;
    const month = parseInt(searchParams.get("month") || "");
    const year = parseInt(searchParams.get("year") || "");

    const where: any = { companyId };
    if (month && year) {
      where.month = month;
      where.year = year;
    }

    const runs = await prisma.payrollRun.findMany({
      where,
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: {
        _count: { select: { items: true } },
      },
    });

    return NextResponse.json({ payrollRuns: runs });
  } catch (error) {
    return getErrorResponse(error, "Failed to fetch payroll runs.");
  }
}

// PUT /api/payroll/run - Lock/unlock payroll
export async function PUT(request: NextRequest) {
  const authResult = await requireAuth(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { userId, companyId, role } = authResult.user;

  if (role !== "HR_ADMIN" && role !== "PAYROLL_MANAGER" && role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { message: "Forbidden." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { payrollRunId, action } = body;

    if (action === "lock") {
      const result = await lockPayroll(payrollRunId, userId);
      return NextResponse.json({ message: "Payroll locked successfully", payrollRun: result });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return getErrorResponse(error, error.message || "Failed to update payroll.");
  }
}