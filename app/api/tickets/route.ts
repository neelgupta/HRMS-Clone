import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { getErrorResponse } from "@/lib/api-response";
import { createTicketSchema, updateTicketSchema } from "@/lib/validations/ticket";

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { userId, companyId } = authResult.user;

  try {
    const body = await request.json();
    const parsed = createTicketSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { employeeId: true, companyId: true },
    });

    if (!user?.employeeId) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 });
    }

    const companyId = user.companyId;
    const employeeId = user.employeeId;

    // Calculate due date based on category (in days)
    const categoryDueDays: Record<string, number> = {
      GENERAL: 5,
      IT_SUPPORT: 3,
      HR_RELATED: 7,
      PAYROLL: 10,
      LEAVE_MANAGEMENT: 5,
      ATTENDANCE: 3,
      OTHER: 5,
    };

    const dueDays = categoryDueDays[parsed.category] || 5;
    const calculatedDueDate = new Date();
    calculatedDueDate.setDate(calculatedDueDate.getDate() + dueDays);

    let ticketNumber: string;
    const lastTicket = await prisma.ticket.findFirst({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      select: { ticketNumber: true },
    });

    if (lastTicket) {
      const numPart = lastTicket.ticketNumber.replace(/[^0-9]/g, "");
      const lastNum = parseInt(numPart || "0", 10);
      ticketNumber = `TKT-${companyId.slice(0, 4).toUpperCase()}-${(lastNum + 1).toString().padStart(4, "0")}`;
    } else {
      ticketNumber = `TKT-${companyId.slice(0, 4).toUpperCase()}-0001`;
    }

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        companyId,
        employeeId: user.employeeId,
        category: parsed.category,
        title: parsed.title,
        description: parsed.description,
        priority: parsed.priority,
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : calculatedDueDate,
        assignedToId: parsed.assignedToId,
      },
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create ticket.";
    return getErrorResponse(error, message);
  }
}

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { userId, companyId, role } = authResult.user;

  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    let employeeIdFilter: string | undefined;
    if (role === "EMPLOYEE") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { employeeId: true },
      });
      employeeIdFilter = user?.employeeId ?? undefined;
    }

    const isHrOrAdmin = ["HR_ADMIN", "SUPER_ADMIN", "PAYROLL_MANAGER", "DEPT_MANAGER"].includes(role);

    const where: Record<string, unknown> = {};

    if (employeeIdFilter) {
      where.employeeId = employeeIdFilter;
    } else if (isHrOrAdmin) {
      where.companyId = companyId;
    }

    if (status) {
      where.status = status;
    }
    if (category) {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { ticketNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Fetch assignedTo data separately
    const assignedToIds = [...new Set(tickets.map((t: { assignedToId?: string }) => t.assignedToId).filter(Boolean))];
    const assignedToUsers = assignedToIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: assignedToIds } },
      select: { id: true, name: true, email: true },
    }) : [];

    // Fetch employee data separately
    const employeeIds = [...new Set(tickets.map((t: { employeeId: string }) => t.employeeId))];
    const employees = await prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        employeeCode: true,
      },
    });

    const employeeMap = new Map(employees.map((e: { id: string }) => [e.id, e]));
    const assignedToMap = new Map(assignedToUsers.map((u: { id: string }) => [u.id, u]));

    const ticketsWithEmployee = tickets.map((ticket: any) => ({
      ...ticket,
      employee: employeeMap.get(ticket.employeeId) || null,
      assignedTo: assignedToMap.get(ticket.assignedToId) || null,
    }));

    const statusWhere = employeeIdFilter ? { employeeId: employeeIdFilter } : { companyId };
    const statusGroup = await prisma.ticket.groupBy({
      by: ["status"],
      where: statusWhere,
      _count: true,
    });

    const statsMap: Record<string, number> = {
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CLOSED: 0,
    };

    statusGroup.forEach((s: { status: string; _count: number }) => {
      statsMap[s.status] = s._count;
    });

    return NextResponse.json({
      tickets: ticketsWithEmployee,
      stats: {
        total: tickets.length,
        ...statsMap,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch tickets.";
    return getErrorResponse(error, message);
  }
}