import { NextResponse, type NextRequest } from "next/server";
import { requirePayrollAdmin } from "@/lib/auth-guard";
import { getErrorResponse } from "@/lib/api-response";
import { generatePayrollSchema } from "@/lib/validations/payroll";
import { generatePayrollForMonth } from "@/lib/server/payroll";

export async function POST(request: NextRequest) {
  const authResult = await requirePayrollAdmin(request);
  if ("response" in authResult) return authResult.response;

  const { userId, companyId } = authResult;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
    }

    const parsed = generatePayrollSchema.parse(body);
    const result = await generatePayrollForMonth({
      companyId,
      userId,
      month: parsed.month,
      overwrite: parsed.overwrite,
    });

    return NextResponse.json(result);
  } catch (error) {
    return getErrorResponse(error, "Failed to generate payroll.");
  }
}

