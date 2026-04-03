import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { getErrorResponse } from "@/lib/api-response";
import { getEmployeeNotifications, markNotificationAsRead } from "@/lib/server/leave-full";

// GET /api/leave/notifications - Get user's leave notifications
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ("response" in authResult) return authResult.response;

  const { userId, companyId } = authResult.user;
  const { searchParams } = request.nextUrl;

  try {
    const { prisma } = await import("@/lib/prisma");
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { employeeId: true },
    });

    if (!user?.employeeId) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 });
    }

    const unreadOnly = searchParams.get("unread") === "true";
    const notifications = await getEmployeeNotifications(user.employeeId, unreadOnly);

    return NextResponse.json({ notifications });
  } catch (error: any) {
    return getErrorResponse(error, error.message || "Failed to fetch notifications");
  }
}

// PUT /api/leave/notifications/[id] - Mark notification as read
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if ("response" in authResult) return authResult.response;

  try {
    const { id } = await params;
    const notification = await markNotificationAsRead(id);
    return NextResponse.json({ notification });
  } catch (error: any) {
    return getErrorResponse(error, error.message || "Failed to mark notification as read");
  }
}