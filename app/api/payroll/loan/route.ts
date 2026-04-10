import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { getErrorResponse } from "@/lib/api-response";

const PrismaClient = require("@prisma/client").PrismaClient;
const prisma = new PrismaClient();

// GET /api/payroll/loan - Get loans
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { companyId, role, userId } = authResult.user;
  const { searchParams } = request.nextUrl;
  const employeeId = searchParams.get("employeeId");

  if (role === "EMPLOYEE") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { employeeId: true },
    });
    const loans = await prisma.loan.findMany({
      where: { employeeId: user?.employeeId, status: { not: "CANCELLED" } },
      include: { repayments: true },
    });
    return NextResponse.json({ loans });
  }

  try {
    const where: any = { companyId };
    if (employeeId) where.employeeId = employeeId;

    const loans = await prisma.loan.findMany({
      where,
      include: {
        employee: { select: { firstName: true, lastName: true, employeeCode: true } },
        repayments: { orderBy: { month: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ loans });
  } catch (error) {
    return getErrorResponse(error, "Failed to fetch loans.");
  }
}

// POST /api/payroll/loan - Apply for loan (employee)
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { companyId, userId, role } = authResult.user;

  if (role === "EMPLOYEE") {
    try {
      const body = await request.json();

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { employeeId: true },
      });

      if (!user?.employeeId) {
        return NextResponse.json({ message: "Employee not found." }, { status: 400 });
      }

      const principalAmount = Number(body.principalAmount);
      const interestRate = Number(body.interestRate);
      const tenureMonths = body.tenureMonths;
      
      const monthlyRate = interestRate / 12 / 100;
      const emiAmount = Math.round(
        principalAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) /
        (Math.pow(1 + monthlyRate, tenureMonths) - 1)
      );
      const totalInterest = emiAmount * tenureMonths - principalAmount;
      const totalAmount = principalAmount + totalInterest;

      const loan = await prisma.loan.create({
        data: {
          companyId,
          employeeId: user.employeeId,
          loanType: body.loanType,
          principalAmount,
          interestRate,
          tenureMonths,
          emiAmount,
          totalInterest,
          totalAmount,
          outstandingAmount: principalAmount,
          status: "PENDING",
          startDate: new Date(body.startDate),
        },
      });

      return NextResponse.json({ loan }, { status: 201 });
    } catch (error) {
      return getErrorResponse(error, "Failed to apply for loan.");
    }
  }

  // HR/Payroll Manager can approve/reject
  if (role !== "HR_ADMIN" && role !== "PAYROLL_MANAGER" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { loanId, status, remarks } = body;

    const loan = await prisma.loan.update({
      where: { id: loanId },
      data: {
        status,
        approvedBy: status === "APPROVED" ? userId : null,
        approvedAt: status === "APPROVED" ? new Date() : null,
        remarks,
      },
    });

    return NextResponse.json({ loan });
  } catch (error) {
    return getErrorResponse(error, "Failed to update loan.");
  }
}