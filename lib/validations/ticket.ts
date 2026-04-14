import { z } from "zod";

export const createTicketSchema = z.object({
  category: z.enum(["GENERAL", "IT_SUPPORT", "HR_RELATED", "PAYROLL", "LEAVE_MANAGEMENT", "ATTENDANCE", "OTHER"]),
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().min(1, "Description is required").max(5000, "Description must be less than 5000 characters"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.string().optional(),
  assignedToId: z.string().optional(),
});

export const updateTicketSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assignedToId: z.string().optional(),
}).partial();

export const addTicket_commentSchema = z.object({
  comment: z.string().min(1, "Comment is required").max(2000),
  isInternal: z.boolean().default(false),
});