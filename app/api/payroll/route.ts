import { NextResponse, type NextRequest } from "next/server";
import { requirePayrollAdmin } from "@/lib/auth-guard";
import { getErrorResponse } from "@/lib/api-response";
import { listPayrollSchema } from "@/lib/validations/payroll";
import { getPayrollForMonth } from "@/lib/server/payroll";

function currentMonthYyyyMm(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function GET(request: NextRequest) {
  const authResult = await requirePayrollAdmin(request);
  if ("response" in authResult) return authResult.response;

  const { companyId } = authResult;
  const { searchParams } = request.nextUrl;

  try {
    const parsed = listPayrollSchema.parse({
      month: searchParams.get("month") || undefined,
    });

    const month = parsed.month ?? currentMonthYyyyMm();
    const result = await getPayrollForMonth(companyId, month);

    if (!result) {
      return NextResponse.json({ month, run: null, rows: [] });
    }

    return NextResponse.json({ month, ...result });
  } catch (error) {
    return getErrorResponse(error, "Failed to fetch payroll.");
  }
}

