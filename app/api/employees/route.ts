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
    console.log("Parsed body:", JSON.stringify(body, null, 2));
    const parsed = createEmployeeSchema.parse(body);
    console.log("Schema parsed successfully");

    const existingEmail = await prisma.employee.findFirst({
      where: { companyId, email: parsed.email.toLowerCase() },
    });
    console.log("Existing email check done");

    if (existingEmail) {
      return NextResponse.json({ message: "An employee with this email already exists." }, { status: 409 });
    }

    console.log("Calling createEmployee with:", companyId, userId);
    const result = await createEmployee(companyId, userId, parsed);
    console.log("Employee created successfully");
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Create employee error:", error);
    return getErrorResponse(error, "Failed to create employee.");
  }
}
