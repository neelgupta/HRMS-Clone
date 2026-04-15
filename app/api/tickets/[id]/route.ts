import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { getErrorResponse } from "@/lib/api-response";
import { updateTicketSchema, addTicket_commentSchema } from "@/lib/validations/ticket";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { id } = await params;
  const { userId, companyId, role } = authResult.user;

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json({ message: "Ticket not found." }, { status: 404 });
    }

    // Fetch employee data separately
    const employee = await prisma.employee.findUnique({
      where: { id: ticket.employeeId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        employeeCode: true,
      },
    });

    const ticketWithEmployee = {
      ...ticket,
      employee,
    };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { employeeId: true },
    });

    const isOwner = ticket.employeeId === user?.employeeId;
    const isAssigned = ticket.assignedToId === userId;
    const isHrOrAdmin = ["HR_ADMIN", "SUPER_ADMIN", "PAYROLL_MANAGER", "DEPT_MANAGER"].includes(role);

    if (!isOwner && !isAssigned && !isHrOrAdmin) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    return NextResponse.json({ ticket: ticketWithEmployee });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch ticket.";
    return getErrorResponse(error, message);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { id } = await params;
  const { userId, companyId, role } = authResult.user;

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { id: true, employeeId: true, status: true, assignedToId: true },
    });

    if (!ticket) {
      return NextResponse.json({ message: "Ticket not found." }, { status: 404 });
    }

    const isAssigned = ticket.assignedToId === userId;
    const isHrOrAdmin = ["HR_ADMIN", "SUPER_ADMIN"].includes(role);

    if (!isAssigned && !isHrOrAdmin) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateTicketSchema.parse(body);

    const updateData: Record<string, unknown> = {};

    if (parsed.status) {
      updateData.status = parsed.status;
      if (parsed.status === "RESOLVED") {
        updateData.resolvedAt = new Date();
      } else if (parsed.status === "CLOSED") {
        updateData.closedAt = new Date();
      }
    }
    if (parsed.priority) {
      updateData.priority = parsed.priority;
    }
    if (parsed.assignedToId) {
      updateData.assignedToId = parsed.assignedToId;
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: updateData,
    });

    // Send notification to ticket owner when status changes
    if (parsed.status) {
      const ticket = await prisma.ticket.findUnique({
        where: { id },
        select: { employeeId: true, title: true },
      });

      if (ticket && ticket.employeeId !== (
        await prisma.user.findUnique({
          where: { id: userId },
          select: { employeeId: true },
        })
      )?.employeeId) {
        await prisma.leaveNotification.create({
          data: {
            companyId,
            employeeId: ticket.employeeId,
            type: "TICKET_UPDATED",
            title: "Ticket Status Updated",
            message: `Your ticket "${ticket.title}" status has been updated to ${parsed.status}`,
            relatedType: "Ticket",
            relatedId: id,
          },
        });
      }
    }

    return NextResponse.json({ ticket: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update ticket.";
    return getErrorResponse(error, message);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { id } = await params;
  const { userId, role } = authResult.user;

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
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

    await prisma.ticket.delete({ where: { id } });

    return NextResponse.json({ message: "Ticket deleted." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete ticket.";
    return getErrorResponse(error, message);
  }
}