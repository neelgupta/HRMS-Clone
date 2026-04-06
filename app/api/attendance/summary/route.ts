import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-guard";
import { getErrorResponse } from "@/lib/api-response";
import { getAttendanceSummary } from "@/lib/server/attendance";

export async function GET(request: NextRequest) {
  const authResult = await requireUser();

  if ("response" in authResult) {
    return authResult.response;
  }

  const { companyId } = authResult;
  const { searchParams } = request.nextUrl;

  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  if (!dateFrom || !dateTo) {
    return Response.json(
      { message: "dateFrom and dateTo are required." },
      { status: 400 }
    );
  }

  try {
    const summary = await getAttendanceSummary(companyId, dateFrom, dateTo);
    return Response.json(summary);
  } catch (error) {
    return getErrorResponse(error, "Failed to fetch attendance summary.");
  }
}
