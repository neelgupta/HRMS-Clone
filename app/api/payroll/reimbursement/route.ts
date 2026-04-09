import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { getErrorResponse } from "@/lib/api-response";

// GET /api/payroll/reimbursement - Get reimbursements
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { companyId, userId, role } = authResult.user;
  const { searchParams } = request.nextUrl;
  const employeeId = searchParams.get("employeeId");

  if (role === "EMPLOYEE") {
    const { prisma } = await import("@/lib/prisma");
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { employeeId: true },
    });
    const reimbursements = await prisma.reimbursement.findMany({
      where: { employeeId: user?.employeeId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ reimbursements });
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const where: any = { companyId };
    if (employeeId) where.employeeId = employeeId;

    const reimbursements = await prisma.reimbursement.findMany({
      where,
      include: {
        employee: { select: { firstName: true, lastName: true, employeeCode: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reimbursements });
  } catch (error) {
    return getErrorResponse(error, "Failed to fetch reimbursements.");
  }
}

// POST /api/payroll/reimbursement - Submit reimbursement
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { companyId, userId, role } = authResult.user;

  if (role !== "EMPLOYEE" && role !== "HR_ADMIN" && role !== "PAYROLL_MANAGER" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { prisma } = await import("@/lib/prisma");

    let employeeId = body.employeeId;

    if (role === "EMPLOYEE") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { employeeId: true },
      });
      employeeId = user?.employeeId!;
    }

    const reimbursement = await prisma.reimbursement.create({
      data: {
        companyId,
        employeeId,
        type: body.type,
        amount: body.amount,
        description: body.description,
        receiptUrl: body.receiptUrl,
        status: role === "EMPLOYEE" ? "PENDING" : "APPROVED",
        approvedBy: role !== "EMPLOYEE" ? userId : null,
        approvedAt: role !== "EMPLOYEE" ? new Date() : null,
      },
    });

    return NextResponse.json({ reimbursement }, { status: 201 });
  } catch (error) {
    return getErrorResponse(error, "Failed to submit reimbursement.");
  }
}

// PUT /api/payroll/reimbursement - Approve/reject reimbursement
export async function PUT(request: NextRequest) {
  const authResult = await requireAuth(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { userId, role } = authResult.user;

  if (role !== "HR_ADMIN" && role !== "PAYROLL_MANAGER" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { reimbursementId, status, remarks } = body;
    const { prisma } = await import("@/lib/prisma");

    const reimbursement = await prisma.reimbursement.update({
      where: { id: reimbursementId },
      data: {
        status,
        approvedBy: userId,
        approvedAt: new Date(),
        remarks,
      },
    });

    return NextResponse.json({ reimbursement });
  } catch (error) {
    return getErrorResponse(error, "Failed to update reimbursement.");
  }
}