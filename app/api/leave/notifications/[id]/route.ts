import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { getErrorResponse } from "@/lib/api-response";
import { markNotificationAsRead } from "@/lib/server/leave-full";

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

// GET /api/leave/notifications/[id] - Get single notification
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if ("response" in authResult) return authResult.response;

  try {
    const { prisma } = await import("@/lib/prisma");
    const { id } = await params;
    const notification = await prisma.leaveNotification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json({ message: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ notification });
  } catch (error: any) {
    return getErrorResponse(error, error.message || "Failed to fetch notification");
  }
}
