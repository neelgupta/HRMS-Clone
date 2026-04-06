import { NextResponse, type NextRequest } from "next/server";
import { requireHRAdmin } from "@/lib/auth-guard";
import { getErrorResponse } from "@/lib/api-response";
import { updateShiftSchema } from "@/lib/validations/attendance";
import { getShift, updateShift, deleteShift } from "@/lib/server/attendance";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireHRAdmin(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { companyId } = authResult;
  const { id } = await params;

  try {
    const shift = await getShift(companyId, id);

    if (!shift) {
      return NextResponse.json({ message: "Shift not found." }, { status: 404 });
    }

    return NextResponse.json({ shift });
  } catch (error) {
    return getErrorResponse(error, "Failed to fetch shift.");
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireHRAdmin(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { userId, companyId } = authResult;
  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateShiftSchema.parse({ ...body, id });
    const result = await updateShift(companyId, userId, parsed);
    return NextResponse.json(result);
  } catch (error) {
    return getErrorResponse(error, "Failed to update shift.");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireHRAdmin(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { userId, companyId } = authResult;
  const { id } = await params;

  try {
    await deleteShift(companyId, userId, id);
    return NextResponse.json({ message: "Shift deleted successfully." });
  } catch (error) {
    return getErrorResponse(error, "Failed to delete shift.");
  }
}
