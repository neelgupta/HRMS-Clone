import { z } from "zod";

export const leaveTypeEnum = z.enum([
  "CASUAL",
  "SICK",
  "PRIVILEGE",
  "MATERNITY",
  "PATERNITY",
  "BEREAVEMENT",
  "UNPAID",
  "WORK_FROM_HOME",
]);

export const leaveStatusEnum = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
]);

export const createLeaveApplicationSchema = z.object({
  leaveType: leaveTypeEnum,
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().optional(),
  attachmentUrl: z.string().optional(),
});

export const updateLeaveStatusSchema = z.object({
  status: leaveStatusEnum,
  reviewRemarks: z.string().optional(),
});

export const leaveBalanceSchema = z.object({
  year: z.number().int().positive(),
  leaveType: leaveTypeEnum,
  totalDays: z.number().min(0),
  carriedForward: z.number().min(0).default(0),
});

export type LeaveApplicationInput = z.infer<typeof createLeaveApplicationSchema>;
export type LeaveStatusInput = z.infer<typeof updateLeaveStatusSchema>;
export type LeaveBalanceInput = z.infer<typeof leaveBalanceSchema>;