import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-guard";
import { getErrorResponse } from "@/lib/api-response";
import { getEmployeeById, updateEmployee, deleteEmployee } from "@/lib/server/employee";
import { updateEmployeeSchema } from "@/lib/validations/employee";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireUser();

  if ("response" in authResult) {
    return authResult.response;
  }

  const { userId, companyId, role } = authResult;
  const { id } = await params;

  try {
    console.log("GET /api/employees/[id] called with:", { id, role, companyId, userId });
    
    if (role === "EMPLOYEE") {
      const user = await prisma.user.findFirst({
        where: { id: userId },
        select: { employeeId: true },
      });

      if (user?.employeeId !== id) {
        return NextResponse.json({ message: "Not authorized to view this employee." }, { status: 403 });
      }
    }

    const employee = await getEmployeeById(companyId, id);

    if (!employee) {
      return NextResponse.json({ message: "Employee not found." }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Error fetching employee:", error);
    return getErrorResponse(error, "Failed to fetch employee.");
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireUser();

  if ("response" in authResult) {
    return authResult.response;
  }

  const { userId, companyId, role } = authResult;
  const { id } = await params;

  if (role !== "HR_ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Not authorized to update employee." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = updateEmployeeSchema.parse(body);

    const existing = await getEmployeeById(companyId, id);
    if (!existing) {
      return NextResponse.json({ message: "Employee not found." }, { status: 404 });
    }

    if (parsed.email && parsed.email !== existing.email) {
      const emailExists = await prisma.employee.findFirst({
        where: { companyId, email: parsed.email.toLowerCase(), id: { not: id } },
      });
      if (emailExists) {
        return NextResponse.json({ message: "An employee with this email already exists." }, { status: 409 });
      }
    }

    const result = await updateEmployee(companyId, userId, { ...parsed, id });
    return NextResponse.json(result);
  } catch (error) {
    return getErrorResponse(error, "Failed to update employee.");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireUser();

  if ("response" in authResult) {
    return authResult.response;
  }

  const { userId, companyId, role } = authResult;
  const { id } = await params;

  if (role !== "HR_ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Not authorized to delete employee." }, { status: 403 });
  }

  try {
    await deleteEmployee(companyId, userId, id);
    return NextResponse.json({ message: "Employee deleted successfully." });
  } catch (error) {
    if (error instanceof Error && error.message === "Employee not found.") {
      return NextResponse.json({ message: "Employee not found." }, { status: 404 });
    }
    return getErrorResponse(error, "Failed to delete employee.");
  }
}
