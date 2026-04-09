import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { getErrorResponse } from "@/lib/api-response";

// GET /api/payroll/salary-structure - Get salary structures
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { companyId, role } = authResult.user;

  if (role !== "HR_ADMIN" && role !== "PAYROLL_MANAGER" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const { searchParams } = request.nextUrl;
    const employeeId = searchParams.get("employeeId");

    const where: any = { companyId };
    if (employeeId) {
      where.employeeId = employeeId;
    }

    const structures = await prisma.salaryStructure.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        items: { include: { component: true } },
      },
      orderBy: { effectiveFrom: "desc" },
    });

    return NextResponse.json({ structures });
  } catch (error) {
    return getErrorResponse(error, "Failed to fetch salary structures.");
  }
}

// POST /api/payroll/salary-structure - Create salary structure
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { userId, companyId, role } = authResult.user;

  if (role !== "HR_ADMIN" && role !== "PAYROLL_MANAGER" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { employeeId, name, effectiveFrom, items } = body;

    const { prisma } = await import("@/lib/prisma");

    await prisma.salaryStructure.updateMany({
      where: { employeeId, isActive: true },
      data: { isActive: false },
    });

    const structure = await prisma.salaryStructure.create({
      data: {
        companyId,
        employeeId,
        name,
        effectiveFrom: new Date(effectiveFrom),
        isActive: true,
        createdBy: userId,
        items: {
          create: items.map((item: any) => ({
            componentId: item.componentId,
            amount: item.amount,
            percentage: item.percentage,
          })),
        },
      },
      include: { items: { include: { component: true } } },
    });

    return NextResponse.json({ structure }, { status: 201 });
  } catch (error) {
    return getErrorResponse(error, "Failed to create salary structure.");
  }
}