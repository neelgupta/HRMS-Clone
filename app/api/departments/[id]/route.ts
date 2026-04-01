import { NextResponse, type NextRequest } from "next/server";
import { requireAuth, checkPermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

    const existing = await prisma.department.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return NextResponse.json({ message: "Department not found." }, { status: 404 });
    }

    const duplicateCode = await prisma.department.findFirst({
      where: { companyId, code, NOT: { id } },
    });

    if (duplicateCode) {
      return NextResponse.json({ message: "Department code already exists." }, { status: 409 });
    }

    const department = await prisma.department.update({
      where: { id },
      data: { name, code, description, headId },
    });

    return NextResponse.json({ department });
  } catch (error) {
    console.error("Department update error:", error);
    return NextResponse.json({ message: "Failed to update department." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authResult = await requireAuth(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const companyId = authResult.user.companyId;

  if (!checkPermission(authResult.user.role, "departments", "write")) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  try {
    const existing = await prisma.department.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return NextResponse.json({ message: "Department not found." }, { status: 404 });
    }

    const employeeCount = await prisma.employee.count({
      where: { departmentId: id },
    });

    if (employeeCount > 0) {
      return NextResponse.json(
        { message: "Cannot delete department with existing employees." },
        { status: 400 }
      );
    }

    await prisma.department.delete({ where: { id } });

    return NextResponse.json({ message: "Department deleted." });
  } catch (error) {
    console.error("Department delete error:", error);
    return NextResponse.json({ message: "Failed to delete department." }, { status: 500 });
  }
}