import { z } from "zod";

export const leaveCategoryEnum = z.enum([
  "CASUAL",
  "SICK",
  "PRIVILEGE",
  "MATERNITY",
  "PATERNITY",
  "BEREAVEMENT",
  "UNPAID",
  "COMP_OFF",
  "WORK_FROM_HOME",
]);

export const sessionTypeEnum = z.enum([
  "FULL_DAY",
  "FIRST_HALF",
  "SECOND_HALF",
]);

export const approvalStatusEnum = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "MODIFICATION_REQUESTED",
]);

export const leaveStatusEnum = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
]);

export const notificationTypeEnum = z.enum([
  "LEAVE_APPLIED",
  "LEAVE_APPROVED",
  "LEAVE_REJECTED",
  "LEAVE_MODIFICATION_REQUESTED",
  "LEAVE_CANCELLED",
  "BALANCE_LOW",
  "COMP_OFF_EARNED",
  "COMP_OFF_EXPIRING",
  "COMP_OFF_APPLIED",
  "COMP_OFF_APPROVED",
  "COMP_OFF_REJECTED",
]);

export const compOffStatusEnum = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
  "USED",
  "CANCELLED",
]);

export const leaveTypeConfigSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required").max(10),
  type: leaveCategoryEnum,
  annualDays: z.number().int().min(0).default(0),
  accrualType: z.enum(["MONTHLY", "YEARLY"]).default("YEARLY"),
  accrualRate: z.number().min(0).default(0),
  maxConsecutive: z.number().int().min(0).default(0),
  minNoticeDays: z.number().int().min(0).default(0),
  canApplyHalfDay: z.boolean().default(true),
  maxHalfDaysPerYear: z.number().int().min(0).default(0),
  genderSpecific: z.enum(["MALE", "FEMALE"]).nullable().default(null),
  allowCarryForward: z.boolean().default(false),
  maxCarryForward: z.number().int().min(0).default(0),
  allowEncashment: z.boolean().default(false),
  maxEncashDays: z.number().int().min(0).default(0),
  expiryDays: z.number().int().min(0).default(0),
  sortOrder: z.number().int().default(0),
});

export const createLeaveTypeConfigSchema = leaveTypeConfigSchema;

export const updateLeaveTypeConfigSchema = leaveTypeConfigSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const createLeaveApplicationFullSchema = z.object({
  leaveTypeId: z.string().uuid("Invalid leave type ID"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  startSession: sessionTypeEnum.default("FULL_DAY"),
  endSession: sessionTypeEnum.default("FULL_DAY"),
  reason: z.string().optional(),
  attachmentUrl: z.string().url().optional(),
});

export const approveLeaveSchema = z.object({
  action: z.enum(["APPROVED", "REJECTED", "MODIFICATION_REQUESTED"]),
  comments: z.string().optional(),
});

export const leaveCommentSchema = z.object({
  comment: z.string().min(1, "Comment is required"),
  isInternal: z.boolean().default(false),
});

export const holidaySchema = z.object({
  name: z.string().min(1, "Holiday name is required"),
  date: z.string().min(1, "Date is required"),
  description: z.string().optional(),
  branchId: z.string().uuid().optional(),
  isOptional: z.boolean().default(false),
  isRecurring: z.boolean().default(true),
});

export const compOffRequestSchema = z.object({
  workDate: z.string().min(1, "Work date is required"),
  workSession: sessionTypeEnum.default("FULL_DAY"),
  reason: z.string().optional(),
  attachmentUrl: z.string().url().optional(),
});

export const leavePolicySchema = z.object({
  approvalLevel1: z.enum(["MANAGER", "HR", "BOTH"]).default("MANAGER"),
  approvalLevel2: z.enum(["MANAGER", "HR", "BOTH"]).nullable().default(null),
  managerApprovalDays: z.number().int().min(1).default(2),
  hrApprovalDays: z.number().int().min(1).default(3),
  encashmentStartMonth: z.number().int().min(1).max(12).default(1),
  encashmentEndMonth: z.number().int().min(1).max(12).default(3),
  processCarryForward: z.boolean().default(true),
  carryForwardDeadline: z.string().nullable().optional(),
  allowAutoApproval: z.boolean().default(false),
  autoApprovalDaysThreshold: z.number().int().min(0).default(0),
});

export type LeaveTypeConfigInput = z.infer<typeof createLeaveTypeConfigSchema>;
export type UpdateLeaveTypeConfigInput = z.infer<typeof updateLeaveTypeConfigSchema>;
export type CreateLeaveApplicationInput = z.infer<typeof createLeaveApplicationFullSchema>;
export type ApproveLeaveInput = z.infer<typeof approveLeaveSchema>;
export type LeaveCommentInput = z.infer<typeof leaveCommentSchema>;
export type HolidayInput = z.infer<typeof holidaySchema>;
export type CompOffRequestInput = z.infer<typeof compOffRequestSchema>;
export type LeavePolicyInput = z.infer<typeof leavePolicySchema>;