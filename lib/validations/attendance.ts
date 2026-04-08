import { z } from "zod";

export const attendanceStatusEnum = z.enum([
  "PENDING",
  "PRESENT",
  "ABSENT",
  "HALF_DAY",
  "LATE",
  "ON_LEAVE",
  "HOLIDAY",
  "WEEK_OFF",
]);

export const regularizationStatusEnum = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

export const createShiftSchema = z.object({
  name: z.string().min(1, "Shift name is required"),
  code: z.string().min(1, "Shift code is required"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
  gracePeriodMins: z.number().int().min(0).default(0),
  halfDayHours: z.number().min(0).max(24).default(4),
  minWorkingHours: z.number().min(0).max(24).default(8),
  isFlexible: z.boolean().default(false),
  isNightShift: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const updateShiftSchema = createShiftSchema.partial().extend({
  id: z.string().min(1, "Shift ID is required"),
});

export const shiftSearchSchema = z.object({
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const assignShiftSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  shiftId: z.string().min(1, "Shift ID is required"),
  effectiveFrom: z.string().min(1, "Effective from date is required"),
  effectiveTo: z.string().optional().nullable(),
});

export const clockInSchema = z.object({
  clockInIp: z.string().optional(),
  clockInLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
  }).optional(),
  clockInPhoto: z.string().optional(),
  remarks: z.string().optional(),
});

export const clockOutSchema = z.object({
  clockOutIp: z.string().optional(),
  clockOutLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
  }).optional(),
  clockOutPhoto: z.string().optional(),
  remarks: z.string().optional(),
});

export const breakStartSchema = z.object({
  remarks: z.string().optional(),
});

export const breakEndSchema = z.object({
  remarks: z.string().optional(),
});

export const attendanceSearchSchema = z.object({
  search: z.string().optional(),
  employeeId: z.string().optional(),
  department: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  date: z.string().optional(),
  status: attendanceStatusEnum.optional(),
  view: z.enum(["day", "list"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const manualAttendanceSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  date: z.string().min(1, "Date is required"),
  clockIn: z.string().optional().nullable(),
  clockOut: z.string().optional().nullable(),
  breakStart: z.string().optional().nullable(),
  breakEnd: z.string().optional().nullable(),
  status: attendanceStatusEnum,
  remarks: z.string().optional(),
});

export const regularizationRequestSchema = z.object({
  attendanceId: z.string().min(1, "Attendance ID is required"),
  requestedClockIn: z.string().optional().nullable(),
  requestedClockOut: z.string().optional().nullable(),
  reason: z.string().min(1, "Reason is required"),
});

export const regularizationReviewSchema = z.object({
  status: regularizationStatusEnum,
  reviewRemarks: z.string().optional(),
});

export const attendancePolicySchema = z.object({
  allowLateArrival: z.boolean().default(true),
  gracePeriodMins: z.number().int().min(0).default(0),
  allowEarlyDeparture: z.boolean().default(true),
  earlyDepartureMins: z.number().int().min(0).default(0),
  halfDayHours: z.number().min(0).max(24).default(4),
  minWorkingHours: z.number().min(0).max(24).default(8),
  allowOvertime: z.boolean().default(false),
  maxOvertimeHoursDay: z.number().min(0).max(24).default(4),
  deductSalaryForLate: z.boolean().default(false),
  lateArrivalDeductPerc: z.number().min(0).max(100).default(0),
  requirePhotoCapture: z.boolean().default(false),
  requireGpsLocation: z.boolean().default(false),
  requireIpRestriction: z.boolean().default(false),
  allowedIps: z.array(z.string()).default([]),
  weeklyOff1: z.string().default("SUNDAY"),
  weeklyOff2: z.string().nullable().optional(),
});

export type CreateShiftInput = z.infer<typeof createShiftSchema>;
export type UpdateShiftInput = z.infer<typeof updateShiftSchema>;
export type ShiftSearchInput = z.infer<typeof shiftSearchSchema>;
export type AssignShiftInput = z.infer<typeof assignShiftSchema>;
export type ClockInInput = z.infer<typeof clockInSchema>;
export type ClockOutInput = z.infer<typeof clockOutSchema>;
export type BreakStartInput = z.infer<typeof breakStartSchema>;
export type BreakEndInput = z.infer<typeof breakEndSchema>;
export type AttendanceSearchInput = z.infer<typeof attendanceSearchSchema>;
export type ManualAttendanceInput = z.infer<typeof manualAttendanceSchema>;
export type RegularizationRequestInput = z.infer<typeof regularizationRequestSchema>;
export type RegularizationReviewInput = z.infer<typeof regularizationReviewSchema>;
export type AttendancePolicyInput = z.infer<typeof attendancePolicySchema>;
