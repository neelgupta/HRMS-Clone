import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { getErrorResponse } from "@/lib/api-response";
import { getHRNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/server/leave-full";

// GET /api/leave/notifications/hr - Get HR notifications
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ("response" in authResult) return authResult.response;

  const { userId, companyId, role } = authResult.user;

  if (!["HR_ADMIN", "SUPER_ADMIN", "PAYROLL_MANAGER", "DEPT_MANAGER"].includes(role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const unreadOnly = searchParams.get("unread") === "true";

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { employeeId: true },
    });

    if (!user?.employeeId) {
      return NextResponse.json({ notifications: [] });
    }

    const notifications = await getHRNotifications(user.employeeId, unreadOnly);
    return NextResponse.json({ notifications });
  } catch (error: any) {
    return getErrorResponse(error, error.message || "Failed to fetch notifications");
  }
}

// PUT /api/leave/notifications/hr - Mark notification as read
export async function PUT(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ("response" in authResult) return authResult.response;

  const { companyId, role } = authResult.user;

  if (!["HR_ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    
    // Mark all as read
    if (body.markAll) {
      const result = await markAllNotificationsAsRead(companyId);
      return NextResponse.json({ message: "All notifications marked as read", count: result.count });
    }
    
    // Mark single notification as read
    if (body.id) {
      const notification = await markNotificationAsRead(body.id);
      return NextResponse.json({ notification });
    }
    
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  } catch (error: any) {
    return getErrorResponse(error, error.message || "Failed to update notification");
  }
}
