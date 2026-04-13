import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-guard";
import { getErrorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest) {
  const authResult = await requireUser();
  if ("response" in authResult) return authResult.response;

  const { companyId } = authResult;

  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        primaryPhone: true,
        addresses: {
          orderBy: [{ type: "asc" }, { createdAt: "asc" }],
          select: {
            addressLine1: true,
            addressLine2: true,
            city: true,
            state: true,
            country: true,
            pincode: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ message: "Company not found." }, { status: 404 });
    }

    return NextResponse.json({ company });
  } catch (error) {
    return getErrorResponse(error, "Failed to fetch company details.");
  }
}

