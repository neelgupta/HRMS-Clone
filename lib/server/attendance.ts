import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type {
  CreateShiftInput,
  UpdateShiftInput,
  ShiftSearchInput,
  AssignShiftInput,
  ClockInInput,
  ClockOutInput,
  AttendanceSearchInput,
  ManualAttendanceInput,
  RegularizationRequestInput,
  RegularizationReviewInput,
  AttendancePolicyInput,
} from "@/lib/validations/attendance";
import { AttendanceStatus, RegularizationStatus } from "@prisma/client";

export type ShiftListItem = {
  id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  gracePeriodMins: number;
  halfDayHours: number;
  minWorkingHours: number;
  isFlexible: boolean;
  isNightShift: boolean;
  isActive: boolean;
};

export type ShiftDetail = ShiftListItem;

export type AttendanceListItem = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  date: Date;
  clockIn: Date | null;
  clockOut: Date | null;
  totalBreakMins: number | null;
  totalHours: number | null;
  overtimeHours: number | null;
  status: string;
  shift: { id: string; name: string; startTime: string; endTime: string } | null;
};

export type AttendanceDetail = AttendanceListItem & {
  clockInIp: string | null;
  clockOutIp: string | null;
  clockInLocation: unknown | null;
  clockOutLocation: unknown | null;
  clockInPhoto: string | null;
  clockOutPhoto: string | null;
  breakStart: Date | null;
  breakEnd: Date | null;
  totalBreakMins: number | null;
  remarks: string | null;
  regularizations: Array<{
    id: string;
    requestedClockIn: Date | null;
    requestedClockOut: Date | null;
    reason: string;
    status: string;
    reviewedBy: string | null;
    reviewedAt: Date | null;
    reviewRemarks: string | null;
    createdAt: Date;
  }>;
};

type ListShiftsResult = {
  shifts: ShiftListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type ListAttendancesResult = {
  attendances: AttendanceListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type AttendanceSummary = {
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalHalfDay: number;
  totalOnLeave: number;
  totalHoliday: number;
  totalWeekOff: number;
  totalOvertimeHours: number;
};

async function createAuditLog(params: {
  companyId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: unknown;
  newValues?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      companyId: params.companyId,
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      oldValues: params.oldValues ?? undefined,
      newValues: params.newValues ?? undefined,
    },
  });
}

export async function createShift(
  companyId: string,
  userId: string,
  input: CreateShiftInput
): Promise<{ shift: ShiftDetail }> {
  const shift = await prisma.shift.create({
    data: {
      companyId,
      name: input.name,
      code: input.code,
      startTime: input.startTime,
      endTime: input.endTime,
      gracePeriodMins: input.gracePeriodMins,
      halfDayHours: input.halfDayHours,
      minWorkingHours: input.minWorkingHours,
      isFlexible: input.isFlexible,
      isNightShift: input.isNightShift,
      isActive: input.isActive,
    },
  });

  await createAuditLog({
    companyId,
    userId,
    action: "CREATE",
    entityType: "Shift",
    entityId: shift.id,
    newValues: input,
  });

  return { shift };
}

export async function updateShift(
  companyId: string,
  userId: string,
  input: UpdateShiftInput
): Promise<{ shift: ShiftDetail }> {
  const existing = await prisma.shift.findUnique({
    where: { id: input.id },
  });

  if (!existing || existing.companyId !== companyId) {
    throw new Error("Shift not found");
  }

  const shift = await prisma.shift.update({
    where: { id: input.id },
    data: {
      name: input.name,
      code: input.code,
      startTime: input.startTime,
      endTime: input.endTime,
      gracePeriodMins: input.gracePeriodMins,
      halfDayHours: input.halfDayHours,
      minWorkingHours: input.minWorkingHours,
      isFlexible: input.isFlexible,
      isNightShift: input.isNightShift,
      isActive: input.isActive,
    },
  });

  await createAuditLog({
    companyId,
    userId,
    action: "UPDATE",
    entityType: "Shift",
    entityId: shift.id,
    oldValues: existing,
    newValues: input,
  });

  return { shift };
}

export async function listShifts(
  companyId: string,
  input: ShiftSearchInput
): Promise<ListShiftsResult> {
  const where: Prisma.ShiftWhereInput = {
    companyId,
    ...(input.search && {
      OR: [
        { name: { contains: input.search, mode: "insensitive" } },
        { code: { contains: input.search, mode: "insensitive" } },
      ],
    }),
    ...(input.isActive !== undefined && { isActive: input.isActive }),
  };

  const [shifts, total] = await Promise.all([
    prisma.shift.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.shift.count({ where }),
  ]);

  return {
    shifts,
    total,
    page: input.page,
    limit: input.limit,
    totalPages: Math.ceil(total / input.limit),
  };
}

export async function getShift(
  companyId: string,
  shiftId: string
): Promise<ShiftDetail | null> {
  const shift = await prisma.shift.findFirst({
    where: { id: shiftId, companyId },
  });

  return shift;
}

export async function deleteShift(
  companyId: string,
  userId: string,
  shiftId: string
): Promise<void> {
  const existing = await prisma.shift.findFirst({
    where: { id: shiftId, companyId },
  });

  if (!existing) {
    throw new Error("Shift not found");
  }

  await prisma.shift.delete({ where: { id: shiftId } });

  await createAuditLog({
    companyId,
    userId,
    action: "DELETE",
    entityType: "Shift",
    entityId: shiftId,
    oldValues: existing,
  });
}

export async function assignShift(
  companyId: string,
  userId: string,
  input: AssignShiftInput
): Promise<void> {
  const employee = await prisma.employee.findFirst({
    where: { id: input.employeeId, companyId },
  });

  if (!employee) {
    throw new Error("Employee not found in your company");
  }

  const shift = await prisma.shift.findFirst({
    where: { id: input.shiftId, companyId },
  });

  if (!shift) {
    throw new Error("Shift not found in your company");
  }

  if (employee.companyId !== companyId) {
    throw new Error("Employee does not belong to your company");
  }

  if (shift.companyId !== companyId) {
    throw new Error("Shift does not belong to your company");
  }

  await prisma.shiftAssignment.upsert({
    where: {
      employeeId_shiftId_effectiveFrom: {
        employeeId: input.employeeId,
        shiftId: input.shiftId,
        effectiveFrom: new Date(input.effectiveFrom),
      },
    },
    create: {
      employeeId: input.employeeId,
      shiftId: input.shiftId,
      effectiveFrom: new Date(input.effectiveFrom),
      effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : null,
    },
    update: {
      effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : null,
      isActive: true,
    },
  });

  await createAuditLog({
    companyId,
    userId,
    action: "ASSIGN",
    entityType: "ShiftAssignment",
    newValues: input,
  });
}

export async function getEmployeeShift(
  employeeId: string,
  date: Date = new Date()
): Promise<{ shift: ShiftListItem | null; assignment: unknown | null }> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true, companyId: true },
  });

  if (!employee) {
    return { shift: null, assignment: null };
  }

  const assignment = await prisma.shiftAssignment.findFirst({
    where: {
      employeeId,
      effectiveFrom: { lte: date },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: date } }],
      isActive: true,
    },
    include: { shift: true },
    orderBy: { effectiveFrom: "desc" },
  });

  if (assignment) {
    if (assignment.shift.companyId !== employee.companyId) {
      console.error(`[SECURITY] Cross-company shift assignment detected! Employee ${employeeId} (Company: ${employee.companyId}) has assignment to Shift ${assignment.shiftId} (Company: ${assignment.shift.companyId}). Cleaning up...`);
      await prisma.shiftAssignment.delete({ where: { id: assignment.id } });
      const defaultShift = await prisma.shift.findFirst({
        where: { companyId: employee.companyId, isActive: true },
        orderBy: { createdAt: "asc" },
      });
      return { shift: (defaultShift as ShiftListItem | null) ?? null, assignment: null };
    }
    return {
      shift: assignment.shift as ShiftListItem,
      assignment,
    };
  }

  const defaultShift = await prisma.shift.findFirst({
    where: { companyId: employee.companyId, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  return { shift: (defaultShift as ShiftListItem | null) ?? null, assignment: null };
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map((v) => Number(v));
  return h * 60 + m;
}

function dateOnlyUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dateOnlyUtcFromYmd(ymd: string): Date {
  const [year, month, day] = ymd.split("-").map((value) => Number(value));
  if (!year || !month || !day) {
    throw new Error("Invalid date format. Expected YYYY-MM-DD.");
  }
  return new Date(Date.UTC(year, month - 1, day));
}

function getShiftWindow(params: {
  date: Date;
  shift: { startTime: string; endTime: string; isNightShift?: boolean | null };
}): { start: Date; end: Date; durationHours: number } {
  const base = new Date(params.date);
  base.setHours(0, 0, 0, 0);

  const startMinutes = parseTimeToMinutes(params.shift.startTime);
  const endMinutes = parseTimeToMinutes(params.shift.endTime);

  const start = new Date(base.getTime() + startMinutes * 60_000);
  let end = new Date(base.getTime() + endMinutes * 60_000);

  const crossesMidnight =
    params.shift.isNightShift === true || endMinutes <= startMinutes;
  if (crossesMidnight) {
    end = new Date(end.getTime() + 24 * 60 * 60_000);
  }

  const durationHours = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
  return { start, end, durationHours };
}

function roundHours(value: number): number {
  // Keep more precision so the timelog chart shows activity immediately after clock-in.
  // Example: 1 minute ≈ 0.02 hours (would become 0.0 if rounded to 0.1).
  const rounded = Math.round(value * 100) / 100;
  if (value > 0 && rounded === 0) return 0.01;
  return rounded;
}

function formatDateYmd(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function diffMins(start: Date, end: Date): number {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60)));
}

export async function clockIn(
  companyId: string,
  employeeId: string,
  input: ClockInInput
): Promise<{ attendance: AttendanceDetail }> {
  const today = dateOnlyUtc(new Date());

  const existing = await prisma.attendance.findFirst({
    where: { employeeId, date: today },
  });

  if (existing && existing.clockIn) {
    throw new Error("Already clocked in today");
  }

  const { shift } = await getEmployeeShift(employeeId, today);
  let status: AttendanceStatus = "PRESENT";
  let remarks = input.remarks;

  if (shift) {
    const now = new Date();
    const { start: shiftStart } = getShiftWindow({ date: today, shift });
    const latestOnTime = new Date(shiftStart.getTime() + shift.gracePeriodMins * 60_000);

    if (now.getTime() > latestOnTime.getTime()) {
      status = "LATE";
      remarks = remarks || "Late arrival";
    }
  }

  const attendance = await prisma.attendance.create({
    data: {
      companyId,
      employeeId,
      date: today,
      shiftId: shift?.id,
      clockIn: new Date(),
      clockInIp: input.clockInIp,
      clockInLocation: input.clockInLocation ?? undefined,
      clockInPhoto: input.clockInPhoto,
      status,
      remarks: input.remarks || remarks,
    },
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          employeeCode: true,
        },
      },
      shift: true,
      regularizations: true,
    },
  });

  return {
    attendance: {
      id: attendance.id,
      employeeId: attendance.employeeId,
      employeeName: `${attendance.employee.firstName} ${attendance.employee.lastName}`,
      employeeCode: attendance.employee.employeeCode,
      date: attendance.date,
      clockIn: attendance.clockIn,
      clockOut: attendance.clockOut,
      totalHours: attendance.totalHours,
      overtimeHours: attendance.overtimeHours,
      status: attendance.status,
      shift: attendance.shift,
      clockInIp: attendance.clockInIp,
      clockOutIp: attendance.clockOutIp,
      clockInLocation: attendance.clockInLocation,
      clockOutLocation: attendance.clockOutLocation,
      clockInPhoto: attendance.clockInPhoto,
      clockOutPhoto: attendance.clockOutPhoto,
      breakStart: attendance.breakStart,
      breakEnd: attendance.breakEnd,
      totalBreakMins: attendance.totalBreakMins,
      remarks: attendance.remarks,
      regularizations: attendance.regularizations,
    },
  };
}

export async function clockOut(
  companyId: string,
  employeeId: string,
  input: ClockOutInput
): Promise<{ attendance: AttendanceDetail }> {
  const today = dateOnlyUtc(new Date());

  const existing = await prisma.attendance.findFirst({
    where: { employeeId, date: today },
    include: { shift: true },
  });

  if (!existing) {
    throw new Error("No attendance record found for today. Please clock in first.");
  }

  if (existing.clockOut) {
    throw new Error("Already clocked out today");
  }

  const clockInTime = existing.clockIn?.getTime() || 0;
  const clockOutTime = Date.now();
  let totalHours = (clockOutTime - clockInTime) / (1000 * 60 * 60);
  
  if (existing.totalBreakMins) {
    totalHours -= existing.totalBreakMins / 60;
  }
  totalHours = Math.max(0, totalHours);

  let overtimeHours = 0;
  const expectedHours = existing.shift
    ? getShiftWindow({ date: existing.date, shift: existing.shift }).durationHours
    : null;

  if (expectedHours !== null && totalHours > expectedHours) {
    overtimeHours = totalHours - expectedHours;
  }

  // Update status based on working hours thresholds (shift-specific, with sane defaults).
  let nextStatus: AttendanceStatus = existing.status;
  const minWorkingHours = existing.shift?.minWorkingHours ?? 8;

  if (totalHours > 0 && totalHours < minWorkingHours) {
    nextStatus = "HALF_DAY";
  }

  const attendance = await prisma.attendance.update({
    where: { id: existing.id },
    data: {
      clockOut: new Date(),
      clockOutIp: input.clockOutIp,
      clockOutLocation: input.clockOutLocation ?? undefined,
      clockOutPhoto: input.clockOutPhoto,
      totalHours,
      overtimeHours,
      status: nextStatus,
      remarks: input.remarks || existing.remarks,
    },
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          employeeCode: true,
        },
      },
      shift: true,
      regularizations: true,
    },
  });

  return {
    attendance: {
      id: attendance.id,
      employeeId: attendance.employeeId,
      employeeName: `${attendance.employee.firstName} ${attendance.employee.lastName}`,
      employeeCode: attendance.employee.employeeCode,
      date: attendance.date,
      clockIn: attendance.clockIn,
      clockOut: attendance.clockOut,
      totalHours: attendance.totalHours,
      overtimeHours: attendance.overtimeHours,
      status: attendance.status,
      shift: attendance.shift,
      clockInIp: attendance.clockInIp,
      clockOutIp: attendance.clockOutIp,
      clockInLocation: attendance.clockInLocation,
      clockOutLocation: attendance.clockOutLocation,
      clockInPhoto: attendance.clockInPhoto,
      clockOutPhoto: attendance.clockOutPhoto,
      breakStart: attendance.breakStart,
      breakEnd: attendance.breakEnd,
      totalBreakMins: attendance.totalBreakMins,
      remarks: attendance.remarks,
      regularizations: attendance.regularizations,
    },
  };
}

export async function breakStart(
  companyId: string,
  employeeId: string,
  input: { remarks?: string }
): Promise<{ attendance: AttendanceDetail }> {
  const today = dateOnlyUtc(new Date());

  const existing = await prisma.attendance.findFirst({
    where: { employeeId, date: today },
  });

  if (!existing) {
    throw new Error("No attendance record found for today. Please clock in first.");
  }

  if (existing.clockOut) {
    throw new Error("You are already clocked out for today.");
  }

  if (existing.breakStart && !existing.breakEnd) {
    throw new Error("Already on break. Please end break first.");
  }

  const attendance = await prisma.attendance.update({
    where: { id: existing.id },
    data: {
      breakStart: new Date(),
      // Support multiple breaks by clearing breakEnd and accumulating totalBreakMins on every break end.
      breakEnd: null,
      remarks: input.remarks || existing.remarks,
    },
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          employeeCode: true,
        },
      },
      shift: true,
      regularizations: true,
    },
  });

  return {
    attendance: {
      id: attendance.id,
      employeeId: attendance.employeeId,
      employeeName: `${attendance.employee.firstName} ${attendance.employee.lastName}`,
      employeeCode: attendance.employee.employeeCode,
      date: attendance.date,
      clockIn: attendance.clockIn,
      clockOut: attendance.clockOut,
      breakStart: attendance.breakStart,
      breakEnd: attendance.breakEnd,
      totalBreakMins: attendance.totalBreakMins,
      totalHours: attendance.totalHours,
      overtimeHours: attendance.overtimeHours,
      status: attendance.status,
      shift: attendance.shift,
      clockInIp: attendance.clockInIp,
      clockOutIp: attendance.clockOutIp,
      clockInLocation: attendance.clockInLocation,
      clockOutLocation: attendance.clockOutLocation,
      clockInPhoto: attendance.clockInPhoto,
      clockOutPhoto: attendance.clockOutPhoto,
      remarks: attendance.remarks,
      regularizations: attendance.regularizations,
    },
  };
}

export async function breakEnd(
  companyId: string,
  employeeId: string,
  input: { remarks?: string }
): Promise<{ attendance: AttendanceDetail }> {
  const today = dateOnlyUtc(new Date());

  const existing = await prisma.attendance.findFirst({
    where: { employeeId, date: today },
  });

  if (!existing) {
    throw new Error("No attendance record found for today.");
  }

  if (!existing.breakStart) {
    throw new Error("Break not started. Please start break first.");
  }

  if (existing.breakEnd) {
    throw new Error("Break already ended for today.");
  }

  const breakEndTime = new Date();
  const breakMins = Math.round((breakEndTime.getTime() - existing.breakStart.getTime()) / (1000 * 60));
  const totalBreakMins = (existing.totalBreakMins ?? 0) + Math.max(0, breakMins);

  const attendance = await prisma.attendance.update({
    where: { id: existing.id },
    data: {
      breakEnd: breakEndTime,
      totalBreakMins,
      remarks: input.remarks || existing.remarks,
    },
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          employeeCode: true,
        },
      },
      shift: true,
      regularizations: true,
    },
  });

  return {
    attendance: {
      id: attendance.id,
      employeeId: attendance.employeeId,
      employeeName: `${attendance.employee.firstName} ${attendance.employee.lastName}`,
      employeeCode: attendance.employee.employeeCode,
      date: attendance.date,
      clockIn: attendance.clockIn,
      clockOut: attendance.clockOut,
      breakStart: attendance.breakStart,
      breakEnd: attendance.breakEnd,
      totalBreakMins: attendance.totalBreakMins,
      totalHours: attendance.totalHours,
      overtimeHours: attendance.overtimeHours,
      status: attendance.status,
      shift: attendance.shift,
      clockInIp: attendance.clockInIp,
      clockOutIp: attendance.clockOutIp,
      clockInLocation: attendance.clockInLocation,
      clockOutLocation: attendance.clockOutLocation,
      clockInPhoto: attendance.clockInPhoto,
      clockOutPhoto: attendance.clockOutPhoto,
      remarks: attendance.remarks,
      regularizations: attendance.regularizations,
    },
  };
}

export async function getTodayAttendance(
  employeeId: string
): Promise<AttendanceDetail | null> {
  const today = dateOnlyUtc(new Date());

  const attendance = await prisma.attendance.findFirst({
    where: { employeeId, date: today },
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          employeeCode: true,
        },
      },
      shift: true,
      regularizations: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!attendance) return null;

  return {
    id: attendance.id,
    employeeId: attendance.employeeId,
    employeeName: `${attendance.employee.firstName} ${attendance.employee.lastName}`,
    employeeCode: attendance.employee.employeeCode,
    date: attendance.date,
    clockIn: attendance.clockIn,
    clockOut: attendance.clockOut,
    totalHours: attendance.totalHours,
    overtimeHours: attendance.overtimeHours,
    status: attendance.status,
    shift: attendance.shift,
    clockInIp: attendance.clockInIp,
    clockOutIp: attendance.clockOutIp,
    clockInLocation: attendance.clockInLocation,
    clockOutLocation: attendance.clockOutLocation,
    clockInPhoto: attendance.clockInPhoto,
    clockOutPhoto: attendance.clockOutPhoto,
    breakStart: attendance.breakStart,
    breakEnd: attendance.breakEnd,
    totalBreakMins: attendance.totalBreakMins,
    remarks: attendance.remarks,
    regularizations: attendance.regularizations,
  };
}

export async function listAttendances(
  companyId: string,
  input: AttendanceSearchInput
): Promise<ListAttendancesResult> {
  const buildDateOnly = (dateStr: string) => dateOnlyUtcFromYmd(dateStr);

  const where: Prisma.AttendanceWhereInput = {
    companyId,
    ...(input.employeeId && { employeeId: input.employeeId }),
    ...(input.dateFrom && { date: { gte: buildDateOnly(input.dateFrom) } }),
    ...(input.dateTo && { date: { lte: buildDateOnly(input.dateTo) } }),
    ...(input.status && { status: input.status as AttendanceStatus }),
    ...(input.department && {
      employee: { department: { name: { contains: input.department, mode: "insensitive" } } },
    }),
    ...(input.search && {
      employee: {
        OR: [
          { firstName: { contains: input.search, mode: "insensitive" } },
          { lastName: { contains: input.search, mode: "insensitive" } },
          { employeeCode: { contains: input.search, mode: "insensitive" } },
        ],
      },
    }),
  };

  const [attendances, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
        shift: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: [{ date: "desc" }, { employee: { firstName: "asc" } }],
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.attendance.count({ where }),
  ]);

  return {
    attendances: attendances.map((a) => ({
      id: a.id,
      employeeId: a.employeeId,
      employeeName: `${a.employee.firstName} ${a.employee.lastName}`,
      employeeCode: a.employee.employeeCode,
      date: a.date,
      clockIn: a.clockIn,
      clockOut: a.clockOut,
      totalBreakMins: a.totalBreakMins,
      totalHours: a.totalHours,
      overtimeHours: a.overtimeHours,
      status: a.status,
      shift: a.shift,
    })),
    total,
    page: input.page,
    limit: input.limit,
    totalPages: Math.ceil(total / input.limit),
  };
}

export async function getAttendance(
  companyId: string,
  attendanceId: string
): Promise<AttendanceDetail | null> {
  const attendance = await prisma.attendance.findFirst({
    where: { id: attendanceId, companyId },
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          employeeCode: true,
        },
      },
      shift: true,
      regularizations: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!attendance) return null;

  return {
    id: attendance.id,
    employeeId: attendance.employeeId,
    employeeName: `${attendance.employee.firstName} ${attendance.employee.lastName}`,
    employeeCode: attendance.employee.employeeCode,
    date: attendance.date,
    clockIn: attendance.clockIn,
    clockOut: attendance.clockOut,
    totalHours: attendance.totalHours,
    overtimeHours: attendance.overtimeHours,
    status: attendance.status,
    shift: attendance.shift,
    clockInIp: attendance.clockInIp,
    clockOutIp: attendance.clockOutIp,
    clockInLocation: attendance.clockInLocation,
    clockOutLocation: attendance.clockOutLocation,
    clockInPhoto: attendance.clockInPhoto,
    clockOutPhoto: attendance.clockOutPhoto,
    breakStart: attendance.breakStart,
    breakEnd: attendance.breakEnd,
    totalBreakMins: attendance.totalBreakMins,
    remarks: attendance.remarks,
    regularizations: attendance.regularizations,
  };
}

export async function manualAttendance(
  companyId: string,
  userId: string,
  input: ManualAttendanceInput
): Promise<{ attendance: AttendanceDetail }> {
  const employee = await prisma.employee.findFirst({
    where: { id: input.employeeId, companyId },
  });

  if (!employee) {
    throw new Error("Employee not found");
  }

  const date = dateOnlyUtc(new Date(input.date));

  const existing = await prisma.attendance.findFirst({
    where: { employeeId: input.employeeId, date },
  });

  let attendance;
  if (existing) {
    attendance = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        clockIn: input.clockIn ? new Date(input.clockIn) : null,
        clockOut: input.clockOut ? new Date(input.clockOut) : null,
        status: input.status as AttendanceStatus,
        remarks: input.remarks,
      },
    });
  } else {
    attendance = await prisma.attendance.create({
      data: {
        companyId,
        employeeId: input.employeeId,
        date,
        clockIn: input.clockIn ? new Date(input.clockIn) : null,
        clockOut: input.clockOut ? new Date(input.clockOut) : null,
        status: input.status as AttendanceStatus,
        remarks: input.remarks,
      },
    });
  }

  await createAuditLog({
    companyId,
    userId,
    action: "MANUAL_ENTRY",
    entityType: "Attendance",
    entityId: attendance.id,
    newValues: input,
  });

  return {
    attendance: {
      id: attendance.id,
      employeeId: attendance.employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      employeeCode: employee.employeeCode,
      date: attendance.date,
      clockIn: attendance.clockIn,
      clockOut: attendance.clockOut,
      totalHours: attendance.totalHours,
      overtimeHours: attendance.overtimeHours,
      status: attendance.status,
      shift: null,
      clockInIp: attendance.clockInIp,
      clockOutIp: attendance.clockOutIp,
      clockInLocation: attendance.clockInLocation,
      clockOutLocation: attendance.clockOutLocation,
      clockInPhoto: attendance.clockInPhoto,
      clockOutPhoto: attendance.clockOutPhoto,
      breakStart: attendance.breakStart,
      breakEnd: attendance.breakEnd,
      totalBreakMins: attendance.totalBreakMins,
      remarks: attendance.remarks,
      regularizations: [],
    },
  };
}

export type EmployeeAttendanceDashboard = {
  month: string; // YYYY-MM
  dateFrom: string;
  dateTo: string;
  summary: {
    present: number;
    absent: number;
    lateIn: number;
    earlyOut: number;
    halfDay: number;
    penalty: number;
  };
  timelogs: Array<{
    // X-axis label in UI (date label like "13 Apr")
    name: string;
    // Calendar date for this entry (YYYY-MM-DD)
    date: string;
    // Weekday (Mon/Tue/...)
    day: string;
    beforeBreak: number;
    break: number;
    afterBreak: number;
    times: {
      clockIn: string | null;
      breakStart: string | null;
      breakEnd: string | null;
      clockOut: string | null;
    };
    durationsMins: {
      beforeBreak: number;
      break: number;
      afterBreak: number;
      total: number;
    };
  }>;
  alerts: {
    earlyOut: number;
    lateArrivals: number;
    halfDays: number;
    maxLateArrivalsAllowed: number;
    remainingLateAllowed: number;
  };
};

export async function getEmployeeAttendanceDashboard(params: {
  companyId: string;
  employeeId: string;
  month?: string; // YYYY-MM
}): Promise<EmployeeAttendanceDashboard> {
  const now = new Date();
  const todayYmd = formatDateYmd(now);
  const [yearStr, monthStr] = (params.month ?? "").split("-");
  const year = Number(yearStr) || now.getUTCFullYear();
  const monthIndex = (Number(monthStr) || now.getUTCMonth() + 1) - 1;

  const monthStart = new Date(Date.UTC(year, monthIndex, 1));
  const monthEnd = new Date(Date.UTC(year, monthIndex + 1, 0));

  const policy = await prisma.attendancePolicy.findUnique({
    where: { companyId: params.companyId },
    select: {
      earlyDepartureMins: true,
    },
  });
  const earlyDepartureMins = policy?.earlyDepartureMins ?? 0;

  const attendances = await prisma.attendance.findMany({
    where: {
      companyId: params.companyId,
      employeeId: params.employeeId,
      date: { gte: monthStart, lte: monthEnd },
    },
    include: {
      shift: {
        select: {
          startTime: true,
          endTime: true,
          gracePeriodMins: true,
          halfDayHours: true,
          minWorkingHours: true,
          isNightShift: true,
        },
      },
    },
    orderBy: { date: "asc" },
  });

  const attendanceByDate = new Map<string, (typeof attendances)[number]>();
  for (const a of attendances) {
    attendanceByDate.set(formatDateYmd(a.date), a);
  }

  const isWeekdayUtc = (date: Date) => {
    const day = date.getUTCDay();
    return day >= 1 && day <= 5;
  };

  const computeWorkedHours = (attendance: (typeof attendances)[number]) => {
    if (!attendance.clockIn || !attendance.clockOut) return null;
    let hours = (attendance.clockOut.getTime() - attendance.clockIn.getTime()) / (1000 * 60 * 60);
    if (attendance.totalBreakMins) hours -= attendance.totalBreakMins / 60;
    return Math.max(0, hours);
  };

  const rangeEnd =
    year === now.getUTCFullYear() && monthIndex === now.getUTCMonth()
      ? dateOnlyUtc(now)
      : monthEnd;

  let present = 0;
  let absent = 0;

  for (let cursor = new Date(monthStart); cursor.getTime() <= rangeEnd.getTime(); cursor = new Date(cursor.getTime() + 24 * 60 * 60_000)) {
    if (!isWeekdayUtc(cursor)) continue;
    const ymd = formatDateYmd(cursor);
    const attendance = attendanceByDate.get(ymd);

    if (!attendance) {
      absent++;
      continue;
    }

    if (
      ymd === todayYmd &&
      attendance.clockIn &&
      !attendance.clockOut
    ) {
      // Don't count the current in-progress day as absent/present yet.
      continue;
    }

    if (attendance.status === "ON_LEAVE" || attendance.status === "HOLIDAY" || attendance.status === "WEEK_OFF") {
      continue;
    }

    const requiredHours = attendance.shift?.minWorkingHours ?? 8;
    const workedHours = attendance.totalHours ?? computeWorkedHours(attendance);

    if (
      attendance.clockIn &&
      attendance.clockOut &&
      workedHours !== null &&
      workedHours >= requiredHours
    ) {
      present++;
    } else {
      absent++;
    }
  }

  let lateIn = 0;
  let earlyOut = 0;
  let halfDay = 0;

  for (const a of attendances) {
    if (a.shift && a.clockIn) {
      const { start } = getShiftWindow({ date: a.date, shift: a.shift });
      const latestOnTime = new Date(start.getTime() + (a.shift.gracePeriodMins ?? 0) * 60_000);
      if (a.clockIn.getTime() > latestOnTime.getTime()) {
        lateIn++;
      }
    }

    const minWorkingHours = a.shift?.minWorkingHours ?? 8;
    const halfDayHours = a.shift?.halfDayHours ?? 4;
    if (a.totalHours !== null && a.totalHours !== undefined) {
      if (a.totalHours > 0 && a.totalHours < minWorkingHours && a.totalHours >= halfDayHours) {
        halfDay++;
      }
    }

    if (a.shift && a.clockOut) {
      const { end } = getShiftWindow({ date: a.date, shift: a.shift });
      const earliestAllowed = new Date(end.getTime() - earlyDepartureMins * 60_000);
      if (a.clockOut.getTime() < earliestAllowed.getTime()) {
        earlyOut++;
      }
    }
  }

  const penalty = lateIn + earlyOut;

  // Timelogs chart: show all days in the selected month up to today (for the current month).
  const timelogs: EmployeeAttendanceDashboard["timelogs"] = [];

  for (let cursor = new Date(monthStart); cursor.getTime() <= rangeEnd.getTime(); cursor = new Date(cursor.getTime() + 24 * 60 * 60_000)) {
    const date = cursor;
    const ymd = formatDateYmd(date);
    const attendance = attendanceByDate.get(ymd);

    const label = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      timeZone: "UTC",
    });

    const dayName = date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });

    if (!attendance) {
      timelogs.push({
        name: label,
        date: ymd,
        day: dayName,
        beforeBreak: 0,
        break: 0,
        afterBreak: 0,
        times: { clockIn: null, breakStart: null, breakEnd: null, clockOut: null },
        durationsMins: { beforeBreak: 0, break: 0, afterBreak: 0, total: 0 },
      });
      continue;
    }

    const rawClockIn = attendance.clockIn;
    const rawClockOut = attendance.clockOut;
    const breakStart = attendance.breakStart;
    const breakEnd = attendance.breakEnd;

    const activeClockOut = rawClockOut ?? (ymd === todayYmd && rawClockIn ? new Date() : null);

    if (!rawClockIn || !activeClockOut) {
      timelogs.push({
        name: label,
        date: ymd,
        day: dayName,
        beforeBreak: 0,
        break: 0,
        afterBreak: 0,
        times: {
          clockIn: rawClockIn ? rawClockIn.toISOString() : null,
          breakStart: breakStart ? breakStart.toISOString() : null,
          breakEnd: breakEnd ? breakEnd.toISOString() : null,
          clockOut: rawClockOut ? rawClockOut.toISOString() : null,
        },
        durationsMins: { beforeBreak: 0, break: 0, afterBreak: 0, total: 0 },
      });
      continue;
    }

    const clockIn = rawClockIn;
    const clockOut = activeClockOut;

    // Support multiple breaks by using `totalBreakMins` as the accumulated break time for the day.
    const baseBreakMins = attendance.totalBreakMins ?? 0;
    const inProgressBreakMins = breakStart && !breakEnd ? diffMins(breakStart, clockOut) : 0;
    const breakMins = Math.max(0, baseBreakMins + Math.max(0, inProgressBreakMins));

    const workedMins = Math.max(0, diffMins(clockIn, clockOut) - breakMins);

    timelogs.push({
      name: label,
      date: ymd,
      day: dayName,
      beforeBreak: roundHours(workedMins / 60),
      break: roundHours(breakMins / 60),
      afterBreak: 0,
      times: {
        clockIn: rawClockIn.toISOString(),
        breakStart: breakStart ? breakStart.toISOString() : null,
        breakEnd: breakEnd ? breakEnd.toISOString() : null,
        clockOut: rawClockOut ? rawClockOut.toISOString() : null,
      },
      durationsMins: {
        beforeBreak: workedMins,
        break: breakMins,
        afterBreak: 0,
        total: workedMins,
      },
    });
  }

  const maxLateArrivalsAllowed = 3;
  const remainingLateAllowed = Math.max(0, maxLateArrivalsAllowed - lateIn);

  return {
    month: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
    dateFrom: monthStart.toISOString(),
    dateTo: monthEnd.toISOString(),
    summary: { present, absent, lateIn, earlyOut, halfDay, penalty },
    timelogs,
    alerts: {
      earlyOut,
      lateArrivals: lateIn,
      halfDays: halfDay,
      maxLateArrivalsAllowed,
      remainingLateAllowed,
    },
  };
}

export async function getAttendanceSummary(
  companyId: string,
  dateFrom: string,
  dateTo: string
): Promise<AttendanceSummary> {
  const where: Prisma.AttendanceWhereInput = {
    companyId,
    date: {
      gte: new Date(dateFrom),
      lte: new Date(dateTo),
    },
  };

  const attendances = await prisma.attendance.findMany({
    where,
    select: {
      status: true,
      overtimeHours: true,
    },
  });

  return {
    totalPresent: attendances.filter((a) => a.status === "PRESENT").length,
    totalAbsent: attendances.filter((a) => a.status === "ABSENT").length,
    totalLate: attendances.filter((a) => a.status === "LATE").length,
    totalHalfDay: attendances.filter((a) => a.status === "HALF_DAY").length,
    totalOnLeave: attendances.filter((a) => a.status === "ON_LEAVE").length,
    totalHoliday: attendances.filter((a) => a.status === "HOLIDAY").length,
    totalWeekOff: attendances.filter((a) => a.status === "WEEK_OFF").length,
    totalOvertimeHours: attendances.reduce((sum, a) => sum + (a.overtimeHours || 0), 0),
  };
}

export async function requestRegularization(
  employeeId: string,
  input: RegularizationRequestInput
): Promise<void> {
  const attendance = await prisma.attendance.findUnique({
    where: { id: input.attendanceId },
  });

  if (!attendance) {
    throw new Error("Attendance record not found");
  }

  if (attendance.employeeId !== employeeId) {
    throw new Error("Not authorized to request regularization for this attendance");
  }

  await prisma.attendanceRegularization.create({
    data: {
      attendanceId: input.attendanceId,
      employeeId,
      requestedClockIn: input.requestedClockIn ? new Date(input.requestedClockIn) : null,
      requestedClockOut: input.requestedClockOut ? new Date(input.requestedClockOut) : null,
      reason: input.reason,
      status: "PENDING",
    },
  });
}

export async function reviewRegularization(
  companyId: string,
  userId: string,
  regularizationId: string,
  input: RegularizationReviewInput
): Promise<void> {
  const regularization = await prisma.attendanceRegularization.findUnique({
    where: { id: regularizationId },
    include: { attendance: true },
  });

  if (!regularization) {
    throw new Error("Regularization request not found");
  }

  if (regularization.attendance.companyId !== companyId) {
    throw new Error("Not authorized");
  }

  await prisma.attendanceRegularization.update({
    where: { id: regularizationId },
    data: {
      status: input.status as RegularizationStatus,
      reviewedBy: userId,
      reviewedAt: new Date(),
      reviewRemarks: input.reviewRemarks,
    },
  });

  if (input.status === "APPROVED") {
    await prisma.attendance.update({
      where: { id: regularization.attendanceId },
      data: {
        clockIn: regularization.requestedClockIn,
        clockOut: regularization.requestedClockOut,
      },
    });
  }

  await createAuditLog({
    companyId,
    userId,
    action: input.status === "APPROVED" ? "APPROVE" : "REJECT",
    entityType: "AttendanceRegularization",
    entityId: regularizationId,
    newValues: input,
  });
}

export async function getAttendancePolicy(
  companyId: string
): Promise<AttendancePolicyInput | null> {
  const policy = await prisma.attendancePolicy.findUnique({
    where: { companyId },
  });

  if (!policy) return null;

  return {
    allowLateArrival: policy.allowLateArrival,
    gracePeriodMins: policy.gracePeriodMins,
    allowEarlyDeparture: policy.allowEarlyDeparture,
    earlyDepartureMins: policy.earlyDepartureMins,
    halfDayHours: policy.halfDayHours,
    minWorkingHours: policy.minWorkingHours,
    allowOvertime: policy.allowOvertime,
    maxOvertimeHoursDay: policy.maxOvertimeHoursDay,
    deductSalaryForLate: policy.deductSalaryForLate,
    lateArrivalDeductPerc: policy.lateArrivalDeductPerc,
    requirePhotoCapture: policy.requirePhotoCapture,
    requireGpsLocation: policy.requireGpsLocation,
    requireIpRestriction: policy.requireIpRestriction,
    allowedIps: policy.allowedIps as string[],
    weeklyOff1: policy.weeklyOff1,
    weeklyOff2: policy.weeklyOff2 ?? undefined,
  };
}

export async function saveAttendancePolicy(
  companyId: string,
  userId: string,
  input: AttendancePolicyInput
): Promise<void> {
  await prisma.attendancePolicy.upsert({
    where: { companyId },
    create: {
      companyId,
      ...input,
    },
    update: input,
  });

  await createAuditLog({
    companyId,
    userId,
    action: "UPDATE",
    entityType: "AttendancePolicy",
    newValues: input,
  });
}

export async function listRegularizations(
  companyId: string,
  status?: string
): Promise<unknown[]> {
  const regularizations = await prisma.attendanceRegularization.findMany({
    where: {
      attendance: { companyId },
      ...(status && { status: status as RegularizationStatus }),
    },
    include: {
      attendance: {
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              department: {
                select: { name: true },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return regularizations;
}

export async function cleanupOrphanedShiftAssignments(companyId?: string): Promise<{
  deletedAssignments: number;
  deletedAttendances: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let deletedAssignments = 0;
  let deletedAttendances = 0;

  try {
    const orphanedAssignments = await prisma.shiftAssignment.findMany({
      where: companyId ? { shift: { companyId } } : {},
      include: { shift: true, employee: true },
    });

    for (const assignment of orphanedAssignments) {
      if (assignment.shift.companyId !== assignment.employee.companyId) {
        console.log(`[CLEANUP] Deleting orphaned ShiftAssignment ${assignment.id}: Employee ${assignment.employeeId} (Company: ${assignment.employee.companyId}) -> Shift ${assignment.shiftId} (Company: ${assignment.shift.companyId})`);
        await prisma.shiftAssignment.delete({ where: { id: assignment.id } });
        deletedAssignments++;
      }
    }
  } catch (error) {
    errors.push(`Failed to cleanup ShiftAssignments: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  try {
    const orphanedAttendances = await prisma.attendance.findMany({
      where: companyId ? { companyId } : {},
      include: { employee: true },
    });

    for (const attendance of orphanedAttendances) {
      if (attendance.companyId !== attendance.employee.companyId) {
        console.log(`[CLEANUP] Deleting orphaned Attendance ${attendance.id}: Company ${attendance.companyId} vs Employee ${attendance.employeeId} (Company: ${attendance.employee.companyId})`);
        await prisma.attendance.delete({ where: { id: attendance.id } });
        deletedAttendances++;
      }
    }
  } catch (error) {
    errors.push(`Failed to cleanup Attendances: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  return { deletedAssignments, deletedAttendances, errors };
}

export async function validateCompanyDataIntegrity(companyId: string): Promise<{
  isValid: boolean;
  issues: string[];
  stats: {
    totalEmployees: number;
    totalShifts: number;
    totalShiftAssignments: number;
    totalAttendances: number;
    orphanedAssignments: number;
    orphanedAttendances: number;
  };
}> {
  const issues: string[] = [];

  const [employees, shifts, assignments, attendances] = await Promise.all([
    prisma.employee.count({ where: { companyId } }),
    prisma.shift.count({ where: { companyId } }),
    prisma.shiftAssignment.count({
      where: { employee: { companyId }, shift: { companyId } },
    }),
    prisma.attendance.count({ where: { companyId } }),
  ]);

  const orphanedAssignments = await prisma.shiftAssignment.count({
    where: {
      employee: { companyId },
      shift: { NOT: { companyId } },
    },
  });

  const orphanedAttendances = await prisma.attendance.count({
    where: {
      employee: { NOT: { companyId } },
    },
  });

  if (orphanedAssignments > 0) {
    issues.push(`${orphanedAssignments} ShiftAssignments with mismatched company`);
  }

  if (orphanedAttendances > 0) {
    issues.push(`${orphanedAttendances} Attendances with mismatched employee company`);
  }

  return {
    isValid: issues.length === 0,
    issues,
    stats: {
      totalEmployees: employees,
      totalShifts: shifts,
      totalShiftAssignments: assignments,
      totalAttendances: attendances,
      orphanedAssignments,
      orphanedAttendances,
    },
  };
}
