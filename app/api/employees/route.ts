import { NextResponse, type NextRequest } from "next/server";
import { requireHRAdmin } from "@/lib/auth-guard";
import { getErrorResponse } from "@/lib/api-response";
import { employeeSearchSchema, createEmployeeSchema } from "@/lib/validations/employee";
import { listEmployees, createEmployee } from "@/lib/server/employee";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authResult = await requireHRAdmin(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { companyId } = authResult;
  const { searchParams } = request.nextUrl;

  try {
    const params = employeeSearchSchema.parse({
      search: searchParams.get("search") || undefined,
      department: searchParams.get("department") || undefined,
      designation: searchParams.get("designation") || undefined,
      employmentType: searchParams.get("employmentType") || undefined,
      employmentStatus: searchParams.get("employmentStatus") || undefined,
      branchId: searchParams.get("branchId") || undefined,
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 20,
    });

    const result = await listEmployees(companyId, params);
    return NextResponse.json(result);
  } catch (error) {
    console.error("List employees error:", error);
    return getErrorResponse(error, "Failed to fetch employees.");
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireHRAdmin(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { userId, companyId } = authResult;

  try {
    const body = await request.json();
    const parsed = createEmployeeSchema.parse(body);

    const existingEmailEmployee = await prisma.employee.findFirst({
      where: { companyId, email: parsed.email.toLowerCase(), isDeleted: false },
    });

    if (existingEmailEmployee) {
      return NextResponse.json(
        { message: "An employee with this email already exists." },
        { status: 409 }
      );
    }

    const existingEmailUser = await prisma.user.findFirst({
      where: { email: parsed.email.toLowerCase(), status: "ACTIVE" },
    });

    if (existingEmailUser) {
      return NextResponse.json(
        { message: "This email is already registered as an active user. Please use a different email." },
        { status: 409 }
      );
    }

    const softDeletedEmployee = await prisma.employee.findFirst({
      where: { companyId, email: parsed.email.toLowerCase(), isDeleted: true },
      include: { user: true },
    });

    if (softDeletedEmployee && softDeletedEmployee.user) {
      await prisma.user.update({
        where: { id: softDeletedEmployee.user.id },
        data: { status: "ACTIVE" },
      });
    }

    const result = await createEmployee(companyId, userId, parsed);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { message: "This email is already in use. Please use a different email." },
        { status: 409 }
      );
    }
    console.error("Create employee error:", error);
    return getErrorResponse(error, "Failed to create employee.");
  }
}
