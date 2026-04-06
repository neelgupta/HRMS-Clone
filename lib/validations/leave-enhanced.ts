import { z } from "zod";

// Leave Type Configuration
export const leaveTypeConfigSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  type: z.enum(["CASUAL", "SICK", "PRIVILEGE", "MATERNITY", "PATERNITY", "BEREAVEMENT", "UNPAID", "COMP_OFF", "WORK_FROM_HOME"]),
  annualDays: z.number().int().min(0).default(0),
  accrualType: z.enum(["MONTHLY", "YEARLY"]).default("YEARLY"),
  accrualRate: z.number().min(0).default(0),
  maxConsecutive: z.number().int().min(0).default(0),
  minNoticeDays: z.number().int().min(0).default(0),
  canApplyHalfDay: z.boolean().default(true),
  maxHalfDaysPerYear: z.number().int().min(0).default(0),
  genderSpecific: z.enum(["MALE", "FEMALE"]).optional(),
  allowCarryForward: z.boolean().default(false),
  maxCarryForward: z.number().int().min(0).default(0),
  allowEncashment: z.boolean().default(false),
  maxEncashDays: z.number().int().min(0).default(0),
  expiryDays: z.number().int().min(0).default(0),
});

// Leave Application with half-day
export const createLeaveApplicationSchema = z.object({
  leaveTypeId: z.string().min(1, "Leave type is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  startSession: z.enum(["FULL_DAY", "FIRST_HALF", "SECOND_HALF"]).default("FULL_DAY"),
  endSession: z.enum(["FULL_DAY", "FIRST_HALF", "SECOND_HALF"]).default("FULL_DAY"),
  reason: z.string().optional(),
});

// Leave Approval
export const approveLeaveSchema = z.object({
  level: z.number().int().min(1).max(2),
  action: z.enum(["APPROVED", "REJECTED", "MODIFICATION_REQUESTED"]),
  remarks: z.string().optional(),
});

// Leave Comment
export const leaveCommentSchema = z.object({
  comment: z.string().min(1, "Comment is required"),
  isInternal: z.boolean().default(false),
});

// Comp-Off Request
export const compOffRequestSchema = z.object({
  workDate: z.string().min(1, "Work date is required"),
  workSession: z.enum(["FULL_DAY", "FIRST_HALF", "SECOND_HALF"]).default("FULL_DAY"),
  reason: z.string().optional(),
});

// Holiday
export const holidaySchema = z.object({
  name: z.string().min(1, "Holiday name is required"),
  date: z.string().min(1, "Date is required"),
  description: z.string().optional(),
  branchId: z.string().optional(),
  isOptional: z.boolean().default(false),
  isRecurring: z.boolean().default(true),
});

// Leave Policy Update
export const leavePolicyUpdateSchema = z.object({
  approvalLevel1: z.enum(["MANAGER", "HR", "BOTH"]).optional(),
  approvalLevel2: z.enum(["MANAGER", "HR"]).optional(),
  managerApprovalDays: z.number().int().min(1).optional(),
  hrApprovalDays: z.number().int().min(1).optional(),
  allowAutoApproval: z.boolean().optional(),
  autoApprovalDaysThreshold: z.number().int().min(0).optional(),
});

export type LeaveTypeConfigInput = z.infer<typeof leaveTypeConfigSchema>;
export type LeaveApplicationInput = z.infer<typeof createLeaveApplicationSchema>;
export type LeaveApprovalInput = z.infer<typeof approveLeaveSchema>;
export type LeaveCommentInput = z.infer<typeof leaveCommentSchema>;
export type CompOffRequestInput = z.infer<typeof compOffRequestSchema>;
export type HolidayInput = z.infer<typeof holidaySchema>;
export type LeavePolicyUpdateInput = z.infer<typeof leavePolicyUpdateSchema>;