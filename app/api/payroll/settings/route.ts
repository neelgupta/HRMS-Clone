import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { getErrorResponse } from "@/lib/api-response";

const PrismaClient = require("@prisma/client").PrismaClient;
const prisma = new PrismaClient();

// GET /api/payroll/settings - Get payroll settings
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
    let settings = await prisma.payrollSetting.findUnique({
      where: { companyId },
    });

    if (!settings) {
      settings = await prisma.payrollSetting.create({
        data: { companyId },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    return getErrorResponse(error, "Failed to fetch payroll settings.");
  }
}

// PUT /api/payroll/settings - Update payroll settings
export async function PUT(request: NextRequest) {
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

    const settings = await prisma.payrollSetting.upsert({
      where: { companyId },
      update: body,
      create: { companyId, ...body },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    return getErrorResponse(error, "Failed to update payroll settings.");
  }
}