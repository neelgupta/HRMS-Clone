import { NextResponse, type NextRequest } from "next/server";
import { requireAuth, checkPermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const companyId = authResult.user.companyId;

  if (!checkPermission(authResult.user.role, "departments", "read")) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  try {
    const designations = await prisma.designation.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ designations });
  } catch (error) {
    console.error("Designations fetch error:", error);
    return NextResponse.json({ message: "Failed to fetch designations." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const companyId = authResult.user.companyId;

  if (!checkPermission(authResult.user.role, "departments", "write")) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, code, description, level } = body;

    if (!name || !code) {
      return NextResponse.json({ message: "Name and code are required." }, { status: 400 });
    }

    const existing = await prisma.designation.findFirst({
      where: { companyId, code },
    });

    if (existing) {
      return NextResponse.json({ message: "Designation code already exists." }, { status: 409 });
    }

    const designation = await prisma.designation.create({
      data: {
        companyId,
        name,
        code,
        description,
        level: level || 1,
      },
    });

    return NextResponse.json({ designation }, { status: 201 });
  } catch (error) {
    console.error("Designation create error:", error);
    return NextResponse.json({ message: "Failed to create designation." }, { status: 500 });
  }
}
