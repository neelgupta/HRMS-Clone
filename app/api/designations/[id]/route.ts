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
    const { name, code, level, description } = body;

    const existing = await prisma.designation.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return NextResponse.json({ message: "Designation not found." }, { status: 404 });
    }

    const duplicateCode = await prisma.designation.findFirst({
      where: { companyId, code, NOT: { id } },
    });

    if (duplicateCode) {
      return NextResponse.json({ message: "Designation code already exists." }, { status: 409 });
    }

    const designation = await prisma.designation.update({
      where: { id },
      data: { name, code, level, description },
    });

    return NextResponse.json({ designation });
  } catch (error) {
    console.error("Designation update error:", error);
    return NextResponse.json({ message: "Failed to update designation." }, { status: 500 });
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
    const existing = await prisma.designation.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return NextResponse.json({ message: "Designation not found." }, { status: 404 });
    }

    const employeeCount = await prisma.employee.count({
      where: { designationId: id },
    });

    if (employeeCount > 0) {
      return NextResponse.json(
        { message: "Cannot delete designation with existing employees." },
        { status: 400 }
      );
    }

    await prisma.designation.delete({ where: { id } });

    return NextResponse.json({ message: "Designation deleted." });
  } catch (error) {
    console.error("Designation delete error:", error);
    return NextResponse.json({ message: "Failed to delete designation." }, { status: 500 });
  }
}