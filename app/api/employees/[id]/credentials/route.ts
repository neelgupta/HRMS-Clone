import { NextResponse, type NextRequest } from "next/server";
import { requireHRAdmin } from "@/lib/auth-guard";
import { getErrorResponse } from "@/lib/api-response";
import { updateCredentialsSchema } from "@/lib/validations/credentials";
import { updateEmployeeCredentials } from "@/lib/server/employee";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireHRAdmin(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { userId, companyId } = authResult;

  try {
    console.log("PUT credentials API called with id:", id);
    
    const body = await request.json();
    const parsed = updateCredentialsSchema.parse(body);

    if (!parsed.email && !parsed.password) {
      return NextResponse.json(
        { message: "Provide at least email or password to update." },
        { status: 400 }
      );
    }

    const result = await updateEmployeeCredentials(companyId, userId, id, parsed);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Update credentials error:", error);
    return getErrorResponse(error, "Failed to update credentials.");
  }
}
