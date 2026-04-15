import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { getErrorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

// POST /api/tickets/[id]/attachments - Upload attachment to ticket
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if ("response" in authResult) return authResult.response;

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

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ message: "No file provided." }, { status: 400 });
    }

    // Convert file to base64 for storage (in production, use cloud storage like S3)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    const attachment = await prisma.ticketAttachment.create({
      data: {
        ticketId,
        fileName: file.name,
        fileUrl: dataUrl,
        fileSize: file.size,
        mimeType: file.type,
      },
    });

    return NextResponse.json({ attachment }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to upload attachment.";
    return getErrorResponse(error, message);
  }
}

// GET /api/tickets/[id]/attachments - Get ticket attachments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if ("response" in authResult) return authResult.response;

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

    const attachments = await prisma.ticketAttachment.findMany({
      where: { ticketId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ attachments });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch attachments.";
    return getErrorResponse(error, message);
  }
}

// DELETE /api/tickets/[id]/attachments/[attachmentId] - Delete attachment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if ("response" in authResult) return authResult.response;

  const { id: ticketId } = await params;
  const { userId, role } = authResult.user;

  try {
    const { searchParams } = request.nextUrl;
    const attachmentId = searchParams.get("attachmentId");

    if (!attachmentId) {
      return NextResponse.json({ message: "Attachment ID required." }, { status: 400 });
    }

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

    await prisma.ticketAttachment.delete({
      where: { id: attachmentId },
    });

    return NextResponse.json({ message: "Attachment deleted." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete attachment.";
    return getErrorResponse(error, message);
  }
}
