import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import type { LeaveNotification } from "@prisma/client";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ("response" in authResult) return authResult.response;

  try {
    const user = authResult.user;

    // Get profile data
    const profile = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        name: true,
        email: true,
        role: true,
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            designation: { select: { name: true } },
            department: { select: { name: true } },
            photoUrl: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Get notifications count
    const unreadCount = profile.employee 
      ? await prisma.leaveNotification.count({
          where: { employeeId: profile.employee.id, isRead: false },
        })
      : 0;

    let notifications: any[] = [];
    if (profile.employee) {
      const employeeNotifications = await prisma.leaveNotification.findMany({
        where: { employeeId: profile.employee.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      notifications = employeeNotifications.map((n: LeaveNotification) => ({
        id: n.id,
        type: n.type,
        title: getNotificationTitle(n.type),
        message: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      }));
    }

    return NextResponse.json({
      profile: {
        name: profile.name,
        email: profile.email,
        role: profile.role,
        employee: profile.employee
          ? {
              ...profile.employee,
              designation: profile.employee.designation?.name || null,
              department: profile.employee.department?.name || null,
            }
          : null,
      },
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

function getNotificationTitle(type: string): string {
  const titles: Record<string, string> = {
    LEAVE_APPLIED: "Leave Application",
    LEAVE_APPROVED: "Leave Approved",
    LEAVE_REJECTED: "Leave Rejected",
    LEAVE_MODIFICATION_REQUESTED: "Modification Requested",
    LEAVE_CANCELLED: "Leave Cancelled",
    BALANCE_LOW: "Low Balance Alert",
    COMP_OFF_EARNED: "Comp-Off Earned",
    COMP_OFF_EXPIRING: "Comp-Off Expiring",
    COMP_OFF_APPLIED: "Comp-Off Request",
    COMP_OFF_APPROVED: "Comp-Off Approved",
    COMP_OFF_REJECTED: "Comp-Off Rejected",
  };
  return titles[type] || "Notification";
}
