import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { getErrorResponse } from "@/lib/api-response";
import { getEmployeeNotifications, markNotificationAsRead } from "@/lib/server/leave-full";
import { prisma } from "@/lib/prisma";

// GET /api/leave/notifications - Get user's leave notifications
// GET /api/leave/notifications?unread=true - Get unread notifications
// GET /api/leave/notifications?count=true - Get only unread count
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ("response" in authResult) return authResult.response;

  const { userId } = authResult.user;
  const { searchParams } = request.nextUrl;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { employeeId: true },
    });

    if (!user?.employeeId) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 });
    }

    const unreadOnly = searchParams.get("unread") === "true";
    const countOnly = searchParams.get("count") === "true";

    // Fast count-only endpoint for polling
    if (countOnly) {
      const count = await prisma.leaveNotification.count({
        where: { employeeId: user.employeeId, isRead: false },
      });
      return NextResponse.json({ count, unreadCount: count });
    }

    const notifications = await getEmployeeNotifications(user.employeeId, unreadOnly);

    return NextResponse.json({ 
      notifications,
      unreadCount: notifications.filter((n: any) => !n.isRead).length 
    });
  } catch (error: any) {
    return getErrorResponse(error, error.message || "Failed to fetch notifications");
  }
}

// PUT /api/leave/notifications - Mark notification as read
export async function PUT(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ("response" in authResult) return authResult.response;

  try {
    const body = await request.json();
    const { id } = body;

    if (id) {
      const notification = await markNotificationAsRead(id);
      return NextResponse.json({ notification });
    }

    return NextResponse.json({ message: "Notification ID required" }, { status: 400 });
  } catch (error: any) {
    return getErrorResponse(error, error.message || "Failed to mark notification as read");
  }
}
