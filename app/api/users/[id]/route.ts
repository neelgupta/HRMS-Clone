import { NextResponse, type NextRequest } from "next/server";
import { requireHRAdmin } from "@/lib/auth-guard";
import { getUserDataById, linkUserToEmployee } from "@/lib/server/user";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireHRAdmin(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { id } = await params;

  try {
    const user = await getUserDataById(id);

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("User fetch error:", error);
    return NextResponse.json({ message: "Failed to fetch user." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireHRAdmin(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { employeeId } = body as { employeeId?: string };

    if (!employeeId) {
      return NextResponse.json({ message: "Employee ID is required." }, { status: 400 });
    }

    const { companyId } = authResult;

    const { prisma } = await import("@/lib/prisma");
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
    });

    if (!employee) {
      return NextResponse.json({ message: "Employee not found." }, { status: 404 });
    }

    const existingLink = await prisma.user.findFirst({
      where: { employeeId, id: { not: id } },
    });

    if (existingLink) {
      return NextResponse.json(
        { message: "This employee is already linked to another user." },
        { status: 409 },
      );
    }

    const user = await linkUserToEmployee(id, employeeId);
    return NextResponse.json(user);
  } catch (error) {
    console.error("Link user error:", error);
    return NextResponse.json({ message: "Failed to link user to employee." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireHRAdmin(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { id } = await params;

  try {
    const { prisma } = await import("@/lib/prisma");
    
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    if (user.isDeleted) {
      return NextResponse.json({ message: "User is already deleted." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    return NextResponse.json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ message: "Failed to delete user." }, { status: 500 });
  }
}
