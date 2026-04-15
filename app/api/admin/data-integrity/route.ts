import { NextRequest, NextResponse } from "next/server";
import { requireHRAdmin } from "@/lib/auth-guard";
import { getErrorResponse } from "@/lib/api-response";
import { validateCompanyDataIntegrity, cleanupOrphanedShiftAssignments } from "@/lib/server/attendance";

export async function GET(request: NextRequest) {
  const authResult = await requireHRAdmin(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { companyId } = authResult;

  try {
    const result = await validateCompanyDataIntegrity(companyId);
    return NextResponse.json(result);
  } catch (error) {
    return getErrorResponse(error, "Failed to validate data integrity.");
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireHRAdmin(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { companyId } = authResult;

  try {
    const result = await cleanupOrphanedShiftAssignments(companyId);
    return NextResponse.json({
      message: "Cleanup completed",
      ...result,
    });
  } catch (error) {
    return getErrorResponse(error, "Failed to cleanup data.");
  }
}
