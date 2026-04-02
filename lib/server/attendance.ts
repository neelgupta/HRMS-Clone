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
      oldValues: params.oldValues as Prisma.JsonValue | undefined,
      newValues: params.newValues as Prisma.JsonValue | undefined,
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
    throw new Error("Employee not found");
  }

  const shift = await prisma.shift.findFirst({
    where: { id: input.shiftId, companyId },
  });

  if (!shift) {
    throw new Error("Shift not found");
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

  if (!assignment) {
    const defaultShift = await prisma.shift.findFirst({
      where: { companyId: undefined, isActive: true },
    });
    return { shift: defaultShift, assignment: null };
  }

  return {
    shift: assignment.shift as ShiftListItem,
    assignment,
  };
}

export async function clockIn(
  companyId: string,
  employeeId: string,
  input: ClockInInput
): Promise<{ attendance: AttendanceDetail }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
    const shiftStartTime = parseInt(shift.startTime.split(":")[0]) * 60 + parseInt(shift.startTime.split(":")[1]);
    const clockInTime = today.getHours() * 60 + today.getMinutes();

    if (clockInTime > shiftStartTime + shift.gracePeriodMins) {
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
      clockInLocation: input.clockInLocation as Prisma.JsonValue,
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
  if (existing.shift) {
    const shift = existing.shift;
    const shiftHours = (parseInt(shift.endTime.split(":")[0]) * 60 + parseInt(shift.endTime.split(":")[1])) -
      (parseInt(shift.startTime.split(":")[0]) * 60 + parseInt(shift.startTime.split(":")[1]));
    const expectedHours = shiftHours / 60;

    if (totalHours > expectedHours) {
      overtimeHours = totalHours - expectedHours;
    }
  }

  const attendance = await prisma.attendance.update({
    where: { id: existing.id },
    data: {
      clockOut: new Date(),
      clockOutIp: input.clockOutIp,
      clockOutLocation: input.clockOutLocation as Prisma.JsonValue,
      clockOutPhoto: input.clockOutPhoto,
      totalHours,
      overtimeHours,
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.attendance.findFirst({
    where: { employeeId, date: today },
  });

  if (!existing) {
    throw new Error("No attendance record found for today. Please clock in first.");
  }

  if (existing.breakStart && !existing.breakEnd) {
    throw new Error("Already on break. Please end break first.");
  }

  if (existing.breakStart && existing.breakEnd) {
    throw new Error("Break already completed for today.");
  }

  const attendance = await prisma.attendance.update({
    where: { id: existing.id },
    data: {
      breakStart: new Date(),
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

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

  const attendance = await prisma.attendance.update({
    where: { id: existing.id },
    data: {
      breakEnd: breakEndTime,
      totalBreakMins: breakMins,
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
  const where: Prisma.AttendanceWhereInput = {
    companyId,
    ...(input.employeeId && { employeeId: input.employeeId }),
    ...(input.dateFrom && { date: { gte: new Date(input.dateFrom) } }),
    ...(input.dateTo && { date: { lte: new Date(input.dateTo) } }),
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

  const date = new Date(input.date);
  date.setHours(0, 0, 0, 0);

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
