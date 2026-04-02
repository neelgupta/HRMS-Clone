import { NextResponse, type NextRequest } from "next/server";
import { requireHRAdmin } from "@/lib/auth-guard";
import { getErrorResponse } from "@/lib/api-response";
import { assignShiftSchema } from "@/lib/validations/attendance";
import { assignShift } from "@/lib/server/attendance";

export async function POST(request: NextRequest) {
  const authResult = await requireHRAdmin(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { userId, companyId } = authResult;

  try {
    const body = await request.json();
    const parsed = assignShiftSchema.parse(body);
    await assignShift(companyId, userId, parsed);
    return NextResponse.json({ message: "Shift assigned successfully." }, { status: 201 });
  } catch (error) {
    return getErrorResponse(error, "Failed to assign shift.");
  }
}
