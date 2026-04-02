import { NextResponse, type NextRequest } from "next/server";
import { requireHRAdmin } from "@/lib/auth-guard";
import { getErrorResponse } from "@/lib/api-response";
import { shiftSearchSchema, createShiftSchema } from "@/lib/validations/attendance";
import { listShifts, createShift } from "@/lib/server/attendance";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authResult = await requireHRAdmin(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { companyId } = authResult;
  const { searchParams } = request.nextUrl;

  try {
    const params = shiftSearchSchema.parse({
      search: searchParams.get("search") || undefined,
      isActive: searchParams.get("isActive") ? searchParams.get("isActive") === "true" : undefined,
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 20,
    });

    const result = await listShifts(companyId, params);
    return NextResponse.json(result);
  } catch (error) {
    return getErrorResponse(error, "Failed to fetch shifts.");
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
    const parsed = createShiftSchema.parse(body);

    const existingCode = await prisma.shift.findUnique({
      where: { companyId_code: { companyId, code: parsed.code } },
    });

    if (existingCode) {
      return NextResponse.json({ message: "Shift with this code already exists." }, { status: 409 });
    }

    const result = await createShift(companyId, userId, parsed);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return getErrorResponse(error, "Failed to create shift.");
  }
}
