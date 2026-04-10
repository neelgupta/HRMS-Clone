import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { getErrorResponse } from "@/lib/api-response";

const PrismaClient = require("@prisma/client").PrismaClient;
const prisma = new PrismaClient();

// GET /api/payroll/components - Get salary components
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { companyId } = authResult.user;

  try {
    const components = await prisma.salaryComponent.findMany({
      where: { companyId, isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ components });
  } catch (error) {
    return getErrorResponse(error, "Failed to fetch salary components.");
  }
}

// POST /api/payroll/components - Create salary component
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { companyId, role } = authResult.user;

  if (role !== "HR_ADMIN" && role !== "PAYROLL_MANAGER" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  try {
    const body = await request.json();

    const component = await prisma.salaryComponent.create({
      data: { ...body, companyId },
    });

    return NextResponse.json({ component }, { status: 201 });
  } catch (error) {
    return getErrorResponse(error, "Failed to create salary component.");
  }
}