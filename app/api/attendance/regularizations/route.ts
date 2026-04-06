import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-guard";
import { getErrorResponse } from "@/lib/api-response";
import { regularizationRequestSchema, regularizationReviewSchema } from "@/lib/validations/attendance";
import { requestRegularization, reviewRegularization, listRegularizations } from "@/lib/server/attendance";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authResult = await requireUser();

  if ("response" in authResult) {
    return authResult.response;
  }

  const { companyId, role } = authResult;
  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") || undefined;

  if (role !== "HR_ADMIN" && role !== "SUPER_ADMIN" && role !== "DEPT_MANAGER") {
    return Response.json({ message: "Not authorized." }, { status: 403 });
  }

  try {
    const regularizations = await listRegularizations(companyId, status);
    return Response.json({ regularizations });
  } catch (error) {
    return getErrorResponse(error, "Failed to fetch regularizations.");
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireUser();

  if ("response" in authResult) {
    return authResult.response;
  }

  const { userId } = authResult;

  try {
    const user = await prisma.user.findFirst({
      where: { id: userId },
      select: { employeeId: true },
    });

    if (!user?.employeeId) {
      return Response.json({ message: "Employee not linked to user." }, { status: 400 });
    }

    const body = await request.json();
    const parsed = regularizationRequestSchema.parse(body);
    await requestRegularization(user.employeeId, parsed);
    return Response.json({ message: "Regularization request submitted." }, { status: 201 });
  } catch (error) {
    return getErrorResponse(error, "Failed to submit regularization request.");
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await requireUser();

  if ("response" in authResult) {
    return authResult.response;
  }

  const { userId, companyId, role } = authResult;

  if (role !== "HR_ADMIN" && role !== "SUPER_ADMIN" && role !== "DEPT_MANAGER") {
    return Response.json({ message: "Not authorized." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { regularizationId, ...reviewData } = body;
    const parsed = regularizationReviewSchema.parse(reviewData);
    await reviewRegularization(companyId, userId, regularizationId, parsed);
    return Response.json({ message: "Regularization reviewed successfully." });
  } catch (error) {
    return getErrorResponse(error, "Failed to review regularization.");
  }
}
