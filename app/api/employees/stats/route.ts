import { NextResponse, type NextRequest } from "next/server";
import { requireHRAdmin } from "@/lib/auth-guard";
import { getEmployeeStats } from "@/lib/server/employee";

export async function GET(request: NextRequest) {
  const authResult = await requireHRAdmin(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { companyId } = authResult;

  try {
    const stats = await getEmployeeStats(companyId);
    return NextResponse.json(stats);
  } catch {
    return NextResponse.json({ message: "Failed to fetch stats." }, { status: 500 });
  }
}
