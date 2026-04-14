export interface Ticket {
  id: string;
  ticketNumber: string;
  companyId: string;
  employeeId: string;
  assignedToId: string | null;
  category: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  dueDate: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeCode: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  userId: string;
  comment: string;
  isInternal: boolean;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface TicketStats {
  total: number;
  OPEN: number;
  IN_PROGRESS: number;
  RESOLVED: number;
  CLOSED: number;
}

export async function createTicket(data: {
  category: string;
  title: string;
  description: string;
  priority?: string;
  dueDate?: string;
}): Promise<{ ticket: Ticket }> {
  const response = await fetch("/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json() as { message?: string; details?: string };
    throw new Error(error.message || error.details || "Failed to create ticket");
  }

  return response.json();
}

export async function getTickets(filters?: {
  status?: string;
  category?: string;
  search?: string;
}): Promise<{ tickets: Ticket[]; stats: TicketStats }> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.category) params.set("category", filters.category);
  if (filters?.search) params.set("search", filters.search);

  const response = await fetch(`/api/tickets?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json() as { message?: string; details?: string };
    throw new Error(error.message || error.details || "Failed to fetch tickets");
  }

  return response.json();
}

export async function getTicket(id: string): Promise<{ ticket: Ticket }> {
  const response = await fetch(`/api/tickets/${id}`);

  if (!response.ok) {
    const error = await response.json() as { message?: string; details?: string };
    throw new Error(error.message || error.details || "Failed to fetch ticket");
  }

  return response.json();
}

export async function updateTicket(
  id: string,
  data: {
    status?: string;
    priority?: string;
    assignedToId?: string;
  }
): Promise<{ ticket: Ticket }> {
  const response = await fetch(`/api/tickets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json() as { message?: string; details?: string };
    throw new Error(error.message || error.details || "Failed to update ticket");
  }

  return response.json();
}

export async function deleteTicket(id: string): Promise<{ message: string }> {
  const response = await fetch(`/api/tickets/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json() as { message?: string; details?: string };
    throw new Error(error.message || error.details || "Failed to delete ticket");
  }

  return response.json();
}

export async function addTicketComment(
  ticketId: string,
  data: { comment: string; isInternal?: boolean }
): Promise<{ comment: TicketComment }> {
  const response = await fetch(`/api/tickets/${ticketId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json() as { message?: string; details?: string };
    throw new Error(error.message || error.details || "Failed to add comment");
  }

  return response.json();
}

export async function getTicketComments(
  ticketId: string
): Promise<{ comments: TicketComment[] }> {
  const response = await fetch(`/api/tickets/${ticketId}/comments`);

  if (!response.ok) {
    const error = await response.json() as { message?: string; details?: string };
    throw new Error(error.message || error.details || "Failed to fetch comments");
  }

  return response.json();
}