import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { getErrorResponse } from "@/lib/api-response";
import { addTicket_commentSchema } from "@/lib/validations/ticket";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { id: ticketId } = await params;
  const { userId, role, companyId } = authResult.user;

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, employeeId: true, assignedToId: true },
    });

    if (!ticket) {
      return NextResponse.json({ message: "Ticket not found." }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { employeeId: true },
    });

    const isOwner = ticket.employeeId === user?.employeeId;
    const isAssigned = ticket.assignedToId === userId;
    const isHrOrAdmin = ["HR_ADMIN", "SUPER_ADMIN"].includes(role);

    if (!isOwner && !isAssigned && !isHrOrAdmin) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    const body = await request.json();
    const parsed = addTicket_commentSchema.parse(body);

    const isInternal = parsed.isInternal && isHrOrAdmin;

    const comment = await prisma.ticketComment.create({
      data: {
        ticketId,
        userId,
        comment: parsed.comment,
        isInternal,
      },
    });

    // Send notification to ticket owner if commenter is not the owner
    const ticketDetails = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { employeeId: true, title: true },
    });

    if (ticketDetails && ticketDetails.employeeId !== user?.employeeId) {
      const commenter = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      await prisma.leaveNotification.create({
        data: {
          companyId,
          employeeId: ticketDetails.employeeId,
          type: "TICKET_COMMENT_ADDED",
          title: "New Comment Added",
          message: `${commenter?.name || "Someone"} added a comment on your ticket: ${ticketDetails.title}`,
          relatedType: "Ticket",
          relatedId: ticketId,
        },
      });
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to add comment.";
    return getErrorResponse(error, message);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { id: ticketId } = await params;
  const { userId, role } = authResult.user;

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, employeeId: true, assignedToId: true },
    });

    if (!ticket) {
      return NextResponse.json({ message: "Ticket not found." }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { employeeId: true },
    });

    const isOwner = ticket.employeeId === user?.employeeId;
    const isAssigned = ticket.assignedToId === userId;
    const isHrOrAdmin = ["HR_ADMIN", "SUPER_ADMIN"].includes(role);

    if (!isOwner && !isAssigned && !isHrOrAdmin) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    const comments = await prisma.ticketComment.findMany({
      where: {
        ticketId,
        ...(isHrOrAdmin ? {} : { isInternal: false }),
      },
      orderBy: { createdAt: "asc" },
    });

    // Fetch user data separately
    const userIds = [...new Set(comments.map((c: { userId: string }) => c.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, role: true },
    });

    const userMap = new Map(users.map((u: { id: string }) => [u.id, u]));

    const commentsWithUser = comments.map((comment: any) => ({
      ...comment,
      user: userMap.get(comment.userId) || null,
    }));

    return NextResponse.json({ comments: commentsWithUser });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch comments.";
    return getErrorResponse(error, message);
  }
}