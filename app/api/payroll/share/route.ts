import { NextResponse, type NextRequest } from "next/server";
import { requirePayrollAdmin } from "@/lib/auth-guard";
import { getErrorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { generatePayrollSchema } from "@/lib/validations/payroll";

export async function POST(request: NextRequest) {
  const authResult = await requirePayrollAdmin(request);
  if ("response" in authResult) return authResult.response;

  const { companyId } = authResult;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
    }

    // Reuse month parsing validation from payroll generate schema (expects { month, overwrite }).
    const parsed = generatePayrollSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid month. Month must be in YYYY-MM format." }, { status: 400 });
    }

    const share = (body as { share?: unknown }).share;
    if (typeof share !== "boolean") {
      return NextResponse.json({ message: "`share` must be a boolean." }, { status: 400 });
    }

    const [yearStr, monthStr] = parsed.data.month.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);

    const rows = await prisma.$queryRaw<Array<{ id: string; sharedWithEmployees: boolean }>>`
      UPDATE "payroll_runs"
      SET "sharedWithEmployees" = ${share}
      WHERE "companyId" = ${companyId} AND "year" = ${year} AND "month" = ${month}
      RETURNING "id", "sharedWithEmployees"
    `;

    const run = rows[0];
    if (!run) {
      return NextResponse.json({ message: "Payroll run not found for this month." }, { status: 404 });
    }

    return NextResponse.json({ run });
  } catch (error) {
    return getErrorResponse(error, "Failed to update payroll share settings.");
  }
}
