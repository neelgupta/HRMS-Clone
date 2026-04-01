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
    const departments = await prisma.department.findMany({
      where: { companyId },
      include: {
        _count: { select: { employees: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ departments });
  } catch (error) {
    console.error("Departments fetch error:", error);
    return NextResponse.json({ message: "Failed to fetch departments." }, { status: 500 });
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
    const { name, code, description, headId } = body;

    if (!name || !code) {
      return NextResponse.json({ message: "Name and code are required." }, { status: 400 });
    }

    const existing = await prisma.department.findFirst({
      where: { companyId, code },
    });

    if (existing) {
      return NextResponse.json({ message: "Department code already exists." }, { status: 409 });
    }

    const department = await prisma.department.create({
      data: {
        companyId,
        name,
        code,
        description,
        headId,
      },
    });

    return NextResponse.json({ department }, { status: 201 });
  } catch (error) {
    console.error("Department create error:", error);
    return NextResponse.json({ message: "Failed to create department." }, { status: 500 });
  }
}
