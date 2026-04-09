import { NextResponse, type NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth-guard";
import { getErrorResponse } from "@/lib/api-response";
import { employeeSearchSchema } from "@/lib/validations/employee";
import { listEmployees } from "@/lib/server/employee";

export async function GET(request: NextRequest) {
  const authResult = await requireAuthenticatedUser(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { companyId } = authResult;
  const { searchParams } = request.nextUrl;

  try {
    // Log the raw search params for debugging
    console.log("Raw search params:", Object.fromEntries(searchParams.entries()));
    
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

    console.log("Parsed params:", params);

    const result = await listEmployees(companyId, params);
    return NextResponse.json(result);
  } catch (error) {
    console.error("List employees error:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return getErrorResponse(error, "Failed to fetch employees.");
  }
}
