import "server-only";

import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-response";
import { getAttendancePolicy } from "@/lib/server/attendance";
import type { PayrollEmployeeRow, PayrollMonthResult } from "@/lib/types/payroll";

const weekdayToIndex: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

function formatYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function normalizeToken(value: string | null | undefined): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenList(value: string | null | undefined): string[] {
  const normalized = normalizeToken(value);
  return normalized ? normalized.split(" ") : [];
}

function isUnplannedNameOrCode(params: { name?: string | null; code?: string | null }): boolean {
  const name = normalizeToken(params.name);
  const code = normalizeToken(params.code);
  const nameTokens = tokenList(params.name);
  const codeTokens = tokenList(params.code);
  return (
    name.includes("unplan") ||
    name.includes("unplai") ||
    name.includes("unpla") ||
    code.includes("unplan") ||
    code.includes("unplai") ||
    code.includes("unpla") ||
    nameTokens.includes("unplanned") ||
    codeTokens.includes("unplanned") ||
    (nameTokens.includes("un") && (nameTokens.includes("planned") || nameTokens.includes("plan"))) ||
    (codeTokens.includes("un") && (codeTokens.includes("planned") || codeTokens.includes("plan")))
  );
}

function parseMonth(month: string): { year: number; month: number } {
  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthNum = Number(monthStr);
  if (!Number.isInteger(year) || !Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12) {
    throw new ApiError(400, "Month must be in YYYY-MM format.", { month });
  }
  return { year, month: monthNum };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function getMonthRange(year: number, month: number): { start: Date; end: Date; daysInMonth: number } {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  const daysInMonth = end.getDate();
  return { start, end, daysInMonth };
}

function getWeeklyOffIndexes(policy: { weeklyOff1?: string; weeklyOff2?: string } | null): Set<number> {
  const set = new Set<number>();
  if (!policy) return set;
  if (policy.weeklyOff1 && weekdayToIndex[policy.weeklyOff1] !== undefined) set.add(weekdayToIndex[policy.weeklyOff1]);
  if (policy.weeklyOff2 && weekdayToIndex[policy.weeklyOff2] !== undefined) set.add(weekdayToIndex[policy.weeklyOff2]);
  return set;
}

function buildWorkingCalendar(params: {
  year: number;
  month: number;
  weeklyOffs: Set<number>;
  holidayYmds: Set<string>;
}) {
  const { start, daysInMonth } = getMonthRange(params.year, params.month);

  let weekOffDays = 0;
  let holidays = 0;
  const workingYmds: string[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(params.year, params.month - 1, day);
    const ymd = formatYmd(date);

    if (params.weeklyOffs.has(date.getDay())) {
      weekOffDays++;
      continue;
    }

    if (params.holidayYmds.has(ymd)) {
      holidays++;
      continue;
    }

    workingYmds.push(ymd);
  }

  return {
    periodStart: start,
    periodEnd: new Date(params.year, params.month, 0),
    weekOffDays,
    holidays,
    workingDays: workingYmds.length,
    workingYmds,
  };
}

function statusToPayable(status: string | null | undefined): number {
  switch (status) {
    case "PRESENT":
    case "LATE":
      return 1;
    case "HALF_DAY":
      return 0.5;
    case "ON_LEAVE":
      // Assumption: paid leave counts as payable.
      return 1;
    default:
      return 0;
  }
}

function sessionToFraction(session: string | null | undefined): number {
  return session && session !== "FULL_DAY" ? 0.5 : 1;
}

function getLeaveFractionForDay(params: {
  ymd: string;
  startYmd: string;
  endYmd: string;
  startSession: string | null | undefined;
  endSession: string | null | undefined;
}): number {
  const { ymd, startYmd, endYmd, startSession, endSession } = params;

  if (startYmd === endYmd && ymd === startYmd) {
    if ((startSession ?? "FULL_DAY") === "FULL_DAY" && (endSession ?? "FULL_DAY") === "FULL_DAY") return 1;
    if ((startSession ?? "FULL_DAY") !== "FULL_DAY" && (endSession ?? "FULL_DAY") !== "FULL_DAY") return 1;
    return 0.5;
  }

  if (ymd === startYmd) return sessionToFraction(startSession);
  if (ymd === endYmd) return sessionToFraction(endSession);
  return 1;
}

export async function getPayrollForMonth(companyId: string, month: string): Promise<PayrollMonthResult | null> {
  const { year, month: monthNum } = parseMonth(month);

  const run = await prisma.payrollRun.findUnique({
    where: { companyId_year_month: { companyId, year, month: monthNum } },
  });

  if (!run) return null;

  const sharedRows = await prisma.$queryRaw<Array<{ sharedWithEmployees: boolean }>>`
    SELECT "sharedWithEmployees"
    FROM "payroll_runs"
    WHERE "id" = ${run.id}
    LIMIT 1
  `;
  const sharedWithEmployees = sharedRows[0]?.sharedWithEmployees ?? false;

  const items = await prisma.payrollItem.findMany({
    where: { payrollRunId: run.id, companyId },
    include: {
      employee: {
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          lastName: true,
          branchId: true,
          dateOfJoining: true,
          bankName: true,
          bankAccountNumber: true,
          pfNumber: true,
          pfUAN: true,
          esiNumber: true,
          panNumber: true,
          department: { select: { name: true } },
          designation: { select: { name: true } },
        },
      },
    },
    orderBy: [{ employee: { employeeCode: "asc" } }],
  });

  return {
    run: {
      id: run.id,
      year: run.year,
      month: run.month,
      periodStart: run.periodStart.toISOString(),
      periodEnd: run.periodEnd.toISOString(),
      weekOffDays: run.weekOffDays,
      holidays: run.holidays,
      workingDays: run.workingDays,
      sharedWithEmployees,
      status: run.status,
      createdAt: run.createdAt.toISOString(),
      updatedAt: run.updatedAt.toISOString(),
    },
    rows: items.map((item) => ({
      employee: {
        id: item.employee.id,
        employeeCode: item.employee.employeeCode,
        firstName: item.employee.firstName,
        lastName: item.employee.lastName,
        branchId: item.employee.branchId,
        dateOfJoining: item.employee.dateOfJoining?.toISOString() ?? null,
        departmentName: item.employee.department?.name ?? null,
        designationName: item.employee.designation?.name ?? null,
        bankName: item.employee.bankName ?? null,
        bankAccountNumber: item.employee.bankAccountNumber ?? null,
        pfNumber: item.employee.pfNumber ?? null,
        pfUAN: item.employee.pfUAN ?? null,
        esiNumber: item.employee.esiNumber ?? null,
        panNumber: item.employee.panNumber ?? null,
      },
      basicSalary: item.basicSalary ?? null,
      workingDays: item.workingDays,
      presentDays: item.presentDays,
      payableDays: item.payableDays,
      grossPay: item.grossPay ?? null,
      deductions: item.deductions ?? null,
      netPay: item.netPay ?? null,
    })),
  };
}

export async function generatePayrollForMonth(params: {
  companyId: string;
  userId: string;
  month: string;
  overwrite?: boolean;
}): Promise<PayrollMonthResult> {
  const { companyId, userId, month, overwrite = true } = params;
  const { year, month: monthNum } = parseMonth(month);
  const { start, end } = getMonthRange(year, monthNum);

  const [policy, generalSetting] = await Promise.all([
    getAttendancePolicy(companyId),
    prisma.generalSetting.findUnique({ where: { companyId }, select: { workweek: true } }),
  ]);

  const weeklyOffs = getWeeklyOffIndexes(
    policy
      ? { weeklyOff1: policy.weeklyOff1, weeklyOff2: policy.weeklyOff2 }
      : generalSetting?.workweek === "MON_SAT"
        ? { weeklyOff1: "SUNDAY" }
        : { weeklyOff1: "SUNDAY", weeklyOff2: "SATURDAY" },
  );

  const employees = await prisma.employee.findMany({
    where: { companyId, isDeleted: false },
    select: { id: true, employeeCode: true, firstName: true, lastName: true, branchId: true, basicSalary: true },
    orderBy: { employeeCode: "asc" },
  });

  const branchIds = [...new Set(employees.map((e) => e.branchId).filter(Boolean))] as string[];

  const holidays = await prisma.holiday.findMany({
    where: {
      companyId,
      date: { gte: start, lte: end },
      OR: [{ branchId: null }, ...(branchIds.length > 0 ? [{ branchId: { in: branchIds } }] : [])],
    },
    select: { date: true, branchId: true, isOptional: true },
  });

  const globalHolidayYmds = new Set<string>();
  const branchHolidayYmds = new Map<string, Set<string>>();

  for (const h of holidays) {
    // Assumption: optional holidays are still treated as holidays for payroll working-day calculation.
    const ymd = formatYmd(h.date);
    if (!h.branchId) {
      globalHolidayYmds.add(ymd);
      continue;
    }
    if (!branchHolidayYmds.has(h.branchId)) branchHolidayYmds.set(h.branchId, new Set<string>());
    branchHolidayYmds.get(h.branchId)!.add(ymd);
  }

  const calendarBase = buildWorkingCalendar({ year, month: monthNum, weeklyOffs, holidayYmds: globalHolidayYmds });

  const attendances = await prisma.attendance.findMany({
    where: {
      companyId,
      employeeId: { in: employees.map((e) => e.id) },
      date: { gte: start, lte: end },
    },
    select: { employeeId: true, date: true, status: true },
  });

  const attendanceByEmployeeDay = new Map<string, string>();
  for (const a of attendances) {
    attendanceByEmployeeDay.set(`${a.employeeId}:${formatYmd(a.date)}`, a.status);
  }

  const leaveApplications = await prisma.leaveApplication.findMany({
    where: {
      companyId,
      employeeId: { in: employees.map((e) => e.id) },
      status: "APPROVED",
      isCancelled: false,
      startDate: { lte: end },
      endDate: { gte: start },
    },
    select: {
      employeeId: true,
      startDate: true,
      endDate: true,
      startSession: true,
      endSession: true,
      leaveType: true,
      leaveTypeConfig: { select: { type: true, name: true, code: true } },
    },
  });

  const paidLeaveByEmployeeDay = new Map<string, number>();
  const unpaidLeaveByEmployeeDay = new Map<string, number>();

  function addLeave(map: Map<string, number>, key: string, value: number) {
    if (value <= 0) return;
    const existing = map.get(key) ?? 0;
    map.set(key, Math.min(1, existing + value));
  }

  for (const app of leaveApplications) {
    const category = app.leaveTypeConfig?.type ?? app.leaveType ?? null;
    const isUnplanned = isUnplannedNameOrCode({
      name: app.leaveTypeConfig?.name,
      code: app.leaveTypeConfig?.code,
    });
    const isUnpaid = category === "UNPAID" || isUnplanned;
    const startYmd = formatYmd(app.startDate);
    const endYmd = formatYmd(app.endDate);

    const cursor = new Date(app.startDate);
    const endDate = new Date(app.endDate);
    while (cursor <= endDate) {
      const ymd = formatYmd(cursor);
      const fraction = getLeaveFractionForDay({
        ymd,
        startYmd,
        endYmd,
        startSession: app.startSession,
        endSession: app.endSession,
      });
      const key = `${app.employeeId}:${ymd}`;
      if (isUnpaid) addLeave(unpaidLeaveByEmployeeDay, key, fraction);
      else addLeave(paidLeaveByEmployeeDay, key, fraction);
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  const rows: PayrollEmployeeRow[] = employees.map((emp) => {
    const employeeHolidayYmds = emp.branchId ? branchHolidayYmds.get(emp.branchId) : undefined;
    const combinedHolidayYmds = employeeHolidayYmds
      ? new Set([...globalHolidayYmds, ...employeeHolidayYmds])
      : globalHolidayYmds;

    const calendar =
      combinedHolidayYmds === globalHolidayYmds
        ? calendarBase
        : buildWorkingCalendar({ year, month: monthNum, weeklyOffs, holidayYmds: combinedHolidayYmds });

    let presentDays = 0;
    let payableDays = 0;

    for (const ymd of calendar.workingYmds) {
      const status = attendanceByEmployeeDay.get(`${emp.id}:${ymd}`);
      let attendancePayable = statusToPayable(status);

      const unpaidLeave = unpaidLeaveByEmployeeDay.get(`${emp.id}:${ymd}`) ?? 0;
      if (status === "ON_LEAVE" && unpaidLeave > 0) {
        attendancePayable = 0;
      }

      const paidLeave = paidLeaveByEmployeeDay.get(`${emp.id}:${ymd}`) ?? 0;
      const payable = Math.min(1, attendancePayable + paidLeave);

      payableDays += payable;
      if (payable > 0) presentDays += payable;
    }

    const basicSalary = emp.basicSalary ?? null;
    const grossPay = basicSalary;
    const netPay =
      basicSalary !== null && calendar.workingDays > 0
        ? round2(basicSalary * (payableDays / calendar.workingDays))
        : null;
    const deductions = grossPay !== null && netPay !== null ? round2(Math.max(0, grossPay - netPay)) : null;

    return {
      employee: { id: emp.id, employeeCode: emp.employeeCode, firstName: emp.firstName, lastName: emp.lastName, branchId: emp.branchId },
      basicSalary,
      workingDays: calendar.workingDays,
      presentDays: round2(presentDays),
      payableDays: round2(payableDays),
      grossPay,
      deductions,
      netPay,
    };
  });

  const tx = await prisma.$transaction(async (db) => {
    const existing = await db.payrollRun.findUnique({
      where: { companyId_year_month: { companyId, year, month: monthNum } },
      select: { id: true },
    });

    if (existing && overwrite) {
      await db.payrollItem.deleteMany({ where: { payrollRunId: existing.id } });
      await db.payrollRun.delete({ where: { id: existing.id } });
    }

    const run = await db.payrollRun.upsert({
      where: { companyId_year_month: { companyId, year, month: monthNum } },
      update: {
        periodStart: calendarBase.periodStart,
        periodEnd: calendarBase.periodEnd,
        weekOffDays: calendarBase.weekOffDays,
        holidays: calendarBase.holidays,
        workingDays: calendarBase.workingDays,
        generatedBy: userId,
        status: "GENERATED",
      },
      create: {
        companyId,
        year,
        month: monthNum,
        periodStart: calendarBase.periodStart,
        periodEnd: calendarBase.periodEnd,
        weekOffDays: calendarBase.weekOffDays,
        holidays: calendarBase.holidays,
        workingDays: calendarBase.workingDays,
        generatedBy: userId,
        status: "GENERATED",
      },
      select: { id: true },
    });

    if (rows.length > 0) {
      await db.payrollItem.createMany({
        data: rows.map((r) => ({
          payrollRunId: run.id,
          companyId,
          employeeId: r.employee.id,
          basicSalary: r.basicSalary,
          workingDays: r.workingDays,
          payableDays: r.payableDays,
          presentDays: r.presentDays,
          grossPay: r.grossPay,
          deductions: r.deductions,
          netPay: r.netPay,
        })),
      });
    }

    return run.id;
  });

  const result = await getPayrollForMonth(companyId, month);
  if (!result) {
    throw new ApiError(500, "Payroll generation failed.");
  }
  return result;
}
