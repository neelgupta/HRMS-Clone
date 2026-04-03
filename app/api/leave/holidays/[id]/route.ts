import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { getErrorResponse } from "@/lib/api-response";
import { holidaySchema } from "@/lib/validations/leave-full";
import { updateHoliday, deleteHoliday } from "@/lib/server/leave-full";

// PUT /api/leave/holidays/[id] - Update holiday
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if ("response" in authResult) return authResult.response;

  const { companyId, role } = authResult.user;
  if (!["HR_ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = holidaySchema.partial().parse(body);
    
    const updateData: any = { ...parsed };
    if (parsed.date) {
      updateData.date = new Date(parsed.date);
    }
    
    const holiday = await updateHoliday(id, updateData);
    return NextResponse.json({ holiday });
  } catch (error: any) {
    return getErrorResponse(error, error.message || "Failed to update holiday");
  }
}

// DELETE /api/leave/holidays/[id] - Delete holiday
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if ("response" in authResult) return authResult.response;

  const { companyId, role } = authResult.user;
  if (!["HR_ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    await deleteHoliday(id);
    return NextResponse.json({ message: "Holiday deleted successfully" });
  } catch (error: any) {
    return getErrorResponse(error, error.message || "Failed to delete holiday");
  }
}
