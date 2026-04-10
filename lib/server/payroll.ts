import "server-only";

import { prisma } from "@/lib/prisma";
import { getProfessionalTax } from "@/lib/constants/pt-slabs";

// ============================================================
// INTERFACES
// ============================================================

export interface PayrollSettings {
  // PF
  pfEnabled: boolean;
  pfRate: number;
  pfWageCeiling: number;
  pfContribOnActual: boolean;
  // ESI
  esiEnabled: boolean;
  esiRate: number;
  esiEmployerRate: number;
  esiWageCeiling: number;
  // TDS
  tdsEnabled: boolean;
  taxRegime: "OLD" | "NEW";
  // PT
  ptEnabled: boolean;
  ptState: string | null;
  professionalTax: number; // fallback flat amount when ptState is unset
  // Gratuity
  gratuityEnabled: boolean;
  gratuityRate: number;
  // Component defaults
  defaultBasicPercent: number;
  defaultHraPercent: number;
  defaultConveyanceAmt: number;
  // Calculation rules
  workingDaysCalcMethod: string;
  midMonthCalcMethod: string;
  roundingRule: string;
  // Overtime
  overtimeEnabled: boolean;
  overtimeRate: number;
  // LOP
  halfDayAsLop: number;
  lateDaysThreshold: number;
}

export interface AttendanceSummary {
  workingDays: number;    // Total payable working days in the month
  daysPresent: number;    // Full-day present (PRESENT + LATE)
  halfDays: number;       // HALF_DAY attendance count
  lateDays: number;       // Late-arrival count (subset of daysPresent)
  lopDays: number;        // ABSENT days (excludes leaves — handled separately)
  overtimeHours: number;
}

export interface PayrollCalculationResult {
  employeeId: string;
  workingDays: number;
  daysWorked: number;
  lopDays: number;
  halfDays: number;
  lateDays: number;
  overtimeHours: number;
  taxRegimeUsed: "OLD" | "NEW";
  earnings: {
    basic: number;
    hra: number;
    conveyance: number;
    specialAllowance: number;
    bonus: number;
    otherEarnings: number;
    overtimeAmount: number;
    totalEarnings: number;
  };
  deductions: {
    pf: number;
    esi: number;
    tds: number;
    professionalTax: number;
    loanDeduction: number;
    otherDeductions: number;
    totalDeductions: number;
  };
  employerContributions: {
    epf: number;      // Employer EPF share (3.67% of PF wage)
    eps: number;      // EPS contribution (8.33% of PF wage, max ₹1,250)
    esi: number;      // Employer ESI (3.25% of gross)
    gratuity: number; // Monthly gratuity accrual (4.81% of basic)
    totalEmployerCost: number;
  };
  grossSalary: number;  // Full-month gross before any LOP
  lopAmount: number;    // ₹ amount lost to LOP
  netPay: number;
}

export interface TaxDeclarationAmounts {
  section80C?: number;        // PF + LIC + ELSS + PPF etc. (max ₹1,50,000)
  section80D?: number;        // Health insurance premiums (max ₹50,000 combined)
  section80CCD1B?: number;    // NPS additional deduction (max ₹50,000)
  hraExemption?: number;      // Pre-computed HRA exemption (old regime)
  ltaExemption?: number;      // LTA (old regime)
  homeLoanInterest?: number;  // Sec 24(b) home loan interest (max ₹2,00,000)
  otherDeductions?: number;
}

// ============================================================
// SETTINGS
// ============================================================

export async function getPayrollSettings(
  companyId: string
): Promise<PayrollSettings> {
  let s = await prisma.payrollSetting.findUnique({ where: { companyId } });

  if (!s) {
    s = await prisma.payrollSetting.create({ data: { companyId } });
  }

  return {
    pfEnabled: s.pfEnabled,
    pfRate: Number(s.pfRate),
    pfWageCeiling: Number(s.pfWageCeiling),
    pfContribOnActual: s.pfContribOnActual,
    esiEnabled: s.esiEnabled,
    esiRate: Number(s.esiRate),
    esiEmployerRate: Number(s.esiEmployerRate),
    esiWageCeiling: Number(s.esiWageCeiling),
    tdsEnabled: s.tdsEnabled,
    taxRegime: s.taxRegime as "OLD" | "NEW",
    ptEnabled: s.ptEnabled,
    ptState: s.ptState ?? null,
    professionalTax: Number(s.professionalTax),
    gratuityEnabled: s.gratuityEnabled,
    gratuityRate: Number(s.gratuityRate),
    defaultBasicPercent: Number(s.defaultBasicPercent),
    defaultHraPercent: Number(s.defaultHraPercent),
    defaultConveyanceAmt: Number(s.defaultConveyanceAmt),
    workingDaysCalcMethod: s.workingDaysCalcMethod,
    midMonthCalcMethod: s.midMonthCalcMethod,
    roundingRule: s.roundingRule,
    overtimeEnabled: s.overtimeEnabled,
    overtimeRate: Number(s.overtimeRate),
    halfDayAsLop: Number(s.halfDayAsLop),
    lateDaysThreshold: s.lateDaysThreshold,
  };
}

// ============================================================
// WORKING DAYS CALCULATION  (FIX #1)
// ============================================================

const WEEKDAY_INDEX: Record<string, number> = {
  SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3,
  THURSDAY: 4, FRIDAY: 5, SATURDAY: 6,
};

function countWeeklyOffsInMonth(
  year: number,
  month: number,
  weeklyOff1: string,
  weeklyOff2: string | null
): number {
  const d1 = WEEKDAY_INDEX[weeklyOff1?.toUpperCase()] ?? 0;
  const d2 =
    weeklyOff2 ? (WEEKDAY_INDEX[weeklyOff2.toUpperCase()] ?? -1) : -1;

  const daysInMonth = new Date(year, month, 0).getDate();
  let count = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const wd = new Date(year, month - 1, day).getDay();
    if (wd === d1 || (d2 >= 0 && wd === d2)) count++;
  }
  return count;
}

/**
 * Returns the number of payable working days in a month:
 *   = calendar days − weekly offs − public/company holidays on working days
 */
export async function getWorkingDaysInMonth(
  companyId: string,
  year: number,
  month: number
): Promise<{ workingDays: number; holidayCount: number; weeklyOffCount: number }> {
  const daysInMonth = new Date(year, month, 0).getDate();

  // 1. Fetch attendance policy for weekly-off configuration
  const policy = await prisma.attendancePolicy.findUnique({
    where: { companyId },
    select: { weeklyOff1: true, weeklyOff2: true },
  });
  const weeklyOff1 = policy?.weeklyOff1 ?? "SUNDAY";
  const weeklyOff2 = policy?.weeklyOff2 ?? null;

  const weeklyOffCount = countWeeklyOffsInMonth(year, month, weeklyOff1, weeklyOff2);

  // 2. Count mandatory (non-optional) holidays that fall on working days
  const startDate = new Date(year, month - 1, 1);
  const endDate   = new Date(year, month - 1, daysInMonth);

  const holidays = await prisma.holiday.findMany({
    where: { companyId, isOptional: false, date: { gte: startDate, lte: endDate } },
    select: { date: true },
  });

  const off1 = WEEKDAY_INDEX[weeklyOff1.toUpperCase()] ?? 0;
  const off2 = weeklyOff2 ? (WEEKDAY_INDEX[weeklyOff2.toUpperCase()] ?? -1) : -1;

  let holidayCount = 0;
  for (const h of holidays) {
    const wd = new Date(h.date).getDay();
    if (wd !== off1 && (off2 < 0 || wd !== off2)) {
      holidayCount++;
    }
  }

  const workingDays = Math.max(1, daysInMonth - weeklyOffCount - holidayCount);
  return { workingDays, holidayCount, weeklyOffCount };
}

// ============================================================
// PF CALCULATION  (FIX #2 — correct EPS/EPF split)
// ============================================================

export interface PFResult {
  employeePF: number;   // 12% of PF wage (employee deduction)
  employerEPF: number;  // 3.67% of PF wage (employer EPF share)
  eps: number;          // 8.33% of PF wage, capped at ₹1,250 (EPS)
  totalContrib: number; // employeePF + employerEPF + eps
}

export function calculatePF(
  basicSalary: number,
  settings: PayrollSettings
): PFResult {
  if (!settings.pfEnabled || basicSalary <= 0) {
    return { employeePF: 0, employerEPF: 0, eps: 0, totalContrib: 0 };
  }

  // PF wage: use actual basic if pfContribOnActual, else cap at wage ceiling
  const pfWage = settings.pfContribOnActual
    ? basicSalary
    : Math.min(basicSalary, settings.pfWageCeiling);

  // Employee contribution: 12% of PF wage
  const employeePF = Math.floor(pfWage * (settings.pfRate / 100));

  // EPS (Employee Pension Scheme): 8.33% of PF wage, hard-capped at ₹1,250
  // (₹15,000 × 8.33% = ₹1,249.50 → rounds to ₹1,250)
  const eps = Math.min(Math.floor(pfWage * 0.0833), 1250);

  // Employer EPF = employer's 12% minus EPS (i.e. 3.67%)
  const employerEPF = Math.max(0, employeePF - eps);

  return {
    employeePF,
    employerEPF,
    eps,
    totalContrib: employeePF + employerEPF + eps,
  };
}

// ============================================================
// ESI CALCULATION  (FIX #3 — correct rounding)
// ============================================================

export function calculateESI(
  grossSalary: number,
  settings: PayrollSettings
): { employeeESI: number; employerESI: number } {
  if (!settings.esiEnabled || grossSalary <= 0) {
    return { employeeESI: 0, employerESI: 0 };
  }
  // If gross > esi ceiling, neither employee nor employer pays ESI
  if (grossSalary > settings.esiWageCeiling) {
    return { employeeESI: 0, employerESI: 0 };
  }

  // ESIC rounds to nearest rupee
  const employeeESI = Math.round(grossSalary * (settings.esiRate / 100));
  const employerESI = Math.round(grossSalary * (settings.esiEmployerRate / 100));
  return { employeeESI, employerESI };
}

// ============================================================
// PROFESSIONAL TAX  (FIX #4 — state-wise slabs, not hardcoded)
// ============================================================

export function calculateProfessionalTax(
  grossSalary: number,
  settings: PayrollSettings,
  month: number
): number {
  if (!settings.ptEnabled) return 0;

  if (settings.ptState) {
    return getProfessionalTax(grossSalary, settings.ptState, month);
  }

  // Fallback: flat amount configured in settings (legacy)
  return Number(settings.professionalTax) || 0;
}

// ============================================================
// INCOME TAX / TDS  (FIX #5 — full rewrite, both regimes)
// ============================================================

// ── New Tax Regime slabs (FY 2025-26 / AY 2026-27) ─────────
// Budget 2025 revision — effective April 2025
const NEW_REGIME_SLABS = [
  { min: 0,        max: 400_000,   rate: 0.00 },
  { min: 400_000,  max: 800_000,   rate: 0.05 },
  { min: 800_000,  max: 1_200_000, rate: 0.10 },
  { min: 1_200_000,max: 1_600_000, rate: 0.15 },
  { min: 1_600_000,max: 2_000_000, rate: 0.20 },
  { min: 2_000_000,max: 2_400_000, rate: 0.25 },
  { min: 2_400_000,max: Infinity,  rate: 0.30 },
];
const NEW_STANDARD_DEDUCTION = 75_000;
// Sec 87A: full rebate if taxable income ≤ ₹12,00,000 (effectively 0 tax up to ₹12L)
const NEW_87A_LIMIT  = 1_200_000;

// ── Old Tax Regime slabs (FY 2025-26) ───────────────────────
const OLD_REGIME_SLABS = [
  { min: 0,        max: 250_000,  rate: 0.00 },
  { min: 250_000,  max: 500_000,  rate: 0.05 },
  { min: 500_000,  max: 1_000_000,rate: 0.20 },
  { min: 1_000_000,max: Infinity, rate: 0.30 },
];
const OLD_STANDARD_DEDUCTION = 50_000;
// Sec 87A: full rebate if taxable income ≤ ₹5,00,000
const OLD_87A_LIMIT   = 500_000;
const OLD_87A_REBATE  = 12_500;

const CESS_RATE = 0.04; // 4% Health & Education Cess

function computeSlabTax(
  income: number,
  slabs: { min: number; max: number; rate: number }[]
): number {
  let tax = 0;
  for (const slab of slabs) {
    if (income <= slab.min) break;
    const taxable = Math.min(income, slab.max) - slab.min;
    tax += taxable * slab.rate;
  }
  return tax;
}

/**
 * Compute annual income tax + cess given the annual taxable gross and
 * applicable deductions/declarations.
 */
export function calculateAnnualTax(
  annualGrossIncome: number,
  regime: "OLD" | "NEW",
  declarations: TaxDeclarationAmounts = {}
): { taxableIncome: number; baseTax: number; cess: number; totalTax: number } {
  if (annualGrossIncome <= 0) {
    return { taxableIncome: 0, baseTax: 0, cess: 0, totalTax: 0 };
  }

  let taxableIncome: number;
  let baseTax: number;

  if (regime === "NEW") {
    // New regime: only standard deduction applies, no 80C / 80D / HRA
    taxableIncome = Math.max(0, annualGrossIncome - NEW_STANDARD_DEDUCTION);
    baseTax = computeSlabTax(taxableIncome, NEW_REGIME_SLABS);

    // Sec 87A rebate: if taxable income ≤ ₹12L → full rebate (tax = 0)
    if (taxableIncome <= NEW_87A_LIMIT) {
      baseTax = 0;
    }
  } else {
    // Old regime: standard deduction + all section deductions
    taxableIncome = Math.max(0, annualGrossIncome - OLD_STANDARD_DEDUCTION);

    const c80C  = Math.min(declarations.section80C      ?? 0, 150_000);
    const c80D  = Math.min(declarations.section80D      ?? 0,  50_000);
    const cNPS  = Math.min(declarations.section80CCD1B  ?? 0,  50_000);
    const cHRA  = Math.max(0, declarations.hraExemption ?? 0);
    const cLTA  = Math.max(0, declarations.ltaExemption ?? 0);
    const cHL   = Math.min(declarations.homeLoanInterest ?? 0, 200_000);
    const cOth  = Math.max(0, declarations.otherDeductions ?? 0);

    const totalDeductions = c80C + c80D + cNPS + cHRA + cLTA + cHL + cOth;
    taxableIncome = Math.max(0, taxableIncome - totalDeductions);

    baseTax = computeSlabTax(taxableIncome, OLD_REGIME_SLABS);

    // Sec 87A rebate for old regime: max ₹12,500 if income ≤ ₹5L
    if (taxableIncome <= OLD_87A_LIMIT) {
      baseTax = Math.max(0, baseTax - Math.min(baseTax, OLD_87A_REBATE));
    }
  }

  baseTax = Math.ceil(baseTax);
  const cess = Math.ceil(baseTax * CESS_RATE);

  return { taxableIncome, baseTax, cess, totalTax: baseTax + cess };
}

/**
 * HRA Exemption (Old Regime only)
 * Exempt = min(a, b, c):
 *   a = Actual annual HRA received
 *   b = 50% of annual Basic (metro) or 40% (non-metro)
 *   c = Annual rent paid − 10% of annual Basic
 */
export function calculateHRAExemption(
  annualBasic: number,
  annualHRA: number,
  annualRentPaid: number,
  isMetroCity: boolean
): number {
  if (annualRentPaid <= 0 || annualHRA <= 0) return 0;

  const a = annualHRA;
  const b = annualBasic * (isMetroCity ? 0.5 : 0.4);
  const c = Math.max(0, annualRentPaid - 0.1 * annualBasic);

  return Math.max(0, Math.min(a, b, c));
}

/**
 * Monthly TDS using annual projection method.
 * Projects current month's salary for the full year, computes annual tax,
 * divides evenly across 12 months.
 */
export async function calculateMonthlyTDS(
  employeeId: string,
  companyId: string,
  month: number,
  year: number,
  monthlyGross: number,
  monthlyBasic: number,
  monthlyHRA: number,
  settings: PayrollSettings
): Promise<number> {
  if (!settings.tdsEnabled || monthlyGross <= 0) return 0;

  // Resolve per-employee tax config (optional override)
  const taxConfig = await prisma.employeeTaxConfig
    .findUnique({ where: { employeeId } })
    .catch(() => null);

  const regime = (taxConfig?.taxRegime ?? settings.taxRegime) as "OLD" | "NEW";
  // Financial year starts in April
  const fyYear = month >= 4 ? year : year - 1;

  // Gather approved tax declarations for this FY
  const declarations = await prisma.taxDeclaration.findMany({
    where: {
      employeeId,
      companyId,
      financialYear: fyYear,
      status: "APPROVED",
    },
    select: { section: true, amount: true },
  });

  const dec: TaxDeclarationAmounts = {};
  for (const d of declarations) {
    const amt = Number(d.amount);
    switch (d.section) {
      case "80C":  dec.section80C      = (dec.section80C      ?? 0) + amt; break;
      case "80D":  dec.section80D      = (dec.section80D      ?? 0) + amt; break;
      case "80CCD":dec.section80CCD1B  = (dec.section80CCD1B  ?? 0) + amt; break;
      case "24B":  dec.homeLoanInterest= (dec.homeLoanInterest ?? 0) + amt; break;
      case "LTA":  dec.ltaExemption    = (dec.ltaExemption    ?? 0) + amt; break;
    }
  }

  if (regime === "OLD") {
    // HRA exemption based on per-employee rent config
    const rent = Number(taxConfig?.monthlyRent ?? 0);
    if (rent > 0) {
      dec.hraExemption = calculateHRAExemption(
        monthlyBasic * 12,
        monthlyHRA   * 12,
        rent         * 12,
        taxConfig?.isMetroCity ?? false
      );
    }

    // Employee PF auto-qualifies under 80C
    if (settings.pfEnabled) {
      const { employeePF } = calculatePF(monthlyBasic, settings);
      dec.section80C = Math.min(
        (dec.section80C ?? 0) + employeePF * 12,
        150_000
      );
    }
  }

  // Project annual gross from current month's salary
  const projectedAnnualGross = monthlyGross * 12;
  const { totalTax } = calculateAnnualTax(projectedAnnualGross, regime, dec);

  return Math.ceil(totalTax / 12);
}

// ============================================================
// ATTENDANCE SUMMARY  (FIX #6 — correct working days, half-days)
// ============================================================

/**
 * Aggregate attendance records per employee for a month.
 *
 * Rules:
 *   PRESENT / LATE  → 1 full present day (LATE also increments lateDays)
 *   HALF_DAY        → 0.5 present (tracked separately)
 *   ABSENT          → 1 LOP day
 *   ON_LEAVE        → handled by leave engine, not here
 *   HOLIDAY / WEEK_OFF → ignored (not LOP)
 */
export async function getAttendanceDataForMonth(
  companyId: string,
  month: number,
  year: number
): Promise<Record<string, AttendanceSummary>> {
  const daysInMonth = new Date(year, month, 0).getDate();
  const startDate   = new Date(year, month - 1, 1);
  const endDate     = new Date(year, month - 1, daysInMonth);

  const { workingDays } = await getWorkingDaysInMonth(companyId, year, month);

  const records = await prisma.attendance.findMany({
    where: { companyId, date: { gte: startDate, lte: endDate } },
    select: { employeeId: true, status: true, overtimeHours: true },
  });

  const result: Record<string, AttendanceSummary> = {};

  for (const rec of records) {
    if (!result[rec.employeeId]) {
      result[rec.employeeId] = {
        workingDays,
        daysPresent: 0,
        halfDays: 0,
        lateDays: 0,
        lopDays: 0,
        overtimeHours: 0,
      };
    }

    const emp = result[rec.employeeId];
    emp.overtimeHours += rec.overtimeHours ?? 0;

    switch (rec.status) {
      case "PRESENT":
        emp.daysPresent++;
        break;
      case "LATE":
        emp.daysPresent++;
        emp.lateDays++;
        break;
      case "HALF_DAY":
        emp.halfDays++;
        break;
      case "ABSENT":
        emp.lopDays++;
        break;
      // ON_LEAVE → resolved via leave engine
      // HOLIDAY / WEEK_OFF → no impact on LOP
      default:
        break;
    }
  }

  return result;
}

// ============================================================
// LEAVE DATA  (FIX #7 — only UNPAID leave = LOP)
// ============================================================

/**
 * Returns LOP days and paid-leave days per employee for the month.
 *
 * Only leaves with LeaveCategory === UNPAID count as LOP.
 * All other approved leave types (CL, SL, PL, WFH, etc.) are paid.
 */
export async function getLeaveDataForMonth(
  companyId: string,
  month: number,
  year: number
): Promise<Record<string, { lopDays: number; paidLeaveDays: number }>> {
  const daysInMonth = new Date(year, month, 0).getDate();
  const startDate   = new Date(year, month - 1, 1);
  const endDate     = new Date(year, month - 1, daysInMonth);

  const leaves = await prisma.leaveApplication.findMany({
    where: {
      companyId,
      status: "APPROVED",
      startDate: { lte: endDate },
      endDate:   { gte: startDate },
    },
    include: {
      leaveTypeConfig: { select: { type: true } },
    },
  });

  const result: Record<string, { lopDays: number; paidLeaveDays: number }> = {};

  for (const leave of leaves) {
    const empId = leave.employeeId;
    if (!result[empId]) result[empId] = { lopDays: 0, paidLeaveDays: 0 };

    const leaveCat =
      leave.leaveTypeConfig?.type ?? leave.leaveType ?? null;

    if (leaveCat === "UNPAID") {
      result[empId].lopDays += leave.totalDays;
    } else {
      // CL, SL, PRIVILEGE, MATERNITY, PATERNITY, BEREAVEMENT, COMP_OFF, WFH
      result[empId].paidLeaveDays += leave.totalDays;
    }
  }

  return result;
}

// ============================================================
// SALARY STRUCTURE
// ============================================================

export async function getEmployeeSalaryStructure(
  employeeId: string,
  effectiveDate: Date
) {
  return prisma.salaryStructure.findFirst({
    where: {
      employeeId,
      isActive: true,
      effectiveFrom: { lte: effectiveDate },
    },
    include: { items: { include: { component: true } } },
    orderBy: { effectiveFrom: "desc" },
  });
}

// ============================================================
// ROUNDING HELPER
// ============================================================

function applyRounding(value: number, rule: string): number {
  switch (rule) {
    case "ROUND_UP":    return Math.ceil(value);
    case "ROUND_DOWN":  return Math.floor(value);
    case "NO_ROUNDING": return value;
    default:            return Math.round(value); // ROUND_OFF
  }
}

// ============================================================
// LOAN DEDUCTION HELPER
// ============================================================

async function getActiveLoanDeduction(
  employeeId: string,
  month: number,
  year: number
): Promise<number> {
  const repayment = await prisma.loanRepayment.findFirst({
    where: {
      month,
      year,
      status: "PENDING",
      loan: { employeeId, status: "ACTIVE" },
    },
    select: { amount: true },
  });
  return repayment ? Number(repayment.amount) : 0;
}

// ============================================================
// CORE SALARY CALCULATION  (combines all fixes)
// ============================================================

export async function calculatePayrollForEmployee(
  companyId: string,
  employeeId: string,
  month: number,
  year: number,
  attendance: AttendanceSummary
): Promise<PayrollCalculationResult> {
  const settings  = await getPayrollSettings(companyId);
  const structure = await getEmployeeSalaryStructure(
    employeeId,
    new Date(year, month - 1, 1)
  );

  if (!structure) {
    throw new Error(`No active salary structure found for employee ${employeeId}`);
  }

  // ── Extract full-month component amounts ──────────────────
  let basicFull = 0, hraFull = 0, convFull = 0, saFull = 0,
      bonusFull = 0, otherFull = 0;

  for (const item of structure.items) {
    if (item.component.type !== "EARNING") continue;
    const amt = Number(item.amount);
    switch (item.component.category) {
      case "BASIC":             basicFull += amt; break;
      case "HRA":               hraFull   += amt; break;
      case "CONVEYANCE":        convFull  += amt; break;
      case "SPECIAL_ALLOWANCE": saFull    += amt; break;
      case "BONUS":             bonusFull += amt; break;
      default:                  otherFull += amt; break;
    }
  }

  const grossFull = basicFull + hraFull + convFull + saFull + bonusFull + otherFull;

  // ── LOP computation ───────────────────────────────────────
  // Late-mark penalty: every N late marks = 0.5 LOP
  const lateLOP = settings.lateDaysThreshold > 0
    ? Math.floor(attendance.lateDays / settings.lateDaysThreshold) * Number(settings.halfDayAsLop)
    : 0;

  // Each half-day = halfDayAsLop (default 0.5) LOP days
  const halfDayLOP = attendance.halfDays * Number(settings.halfDayAsLop);

  // Total LOP = absent days + unpaid-leave days (added by caller) + half-day penalty + late penalty
  const totalLOP = attendance.lopDays + halfDayLOP + lateLOP;

  // ── Pro-rate each earning component by LOP ────────────────
  const workingDays = attendance.workingDays || 1;
  const lopFactor   = Math.min(totalLOP / workingDays, 1); // fraction deducted

  const r = settings.roundingRule;
  const basic    = applyRounding(basicFull * (1 - lopFactor), r);
  const hra      = applyRounding(hraFull   * (1 - lopFactor), r);
  // Conveyance is a reimbursement-type allowance — not pro-rated for LOP
  const conv     = convFull;
  const sa       = applyRounding(saFull    * (1 - lopFactor), r);
  // Bonus is typically not pro-rated (paid separately or as per policy)
  const bonus    = bonusFull;
  const other    = applyRounding(otherFull * (1 - lopFactor), r);

  const lopAmount      = applyRounding(grossFull * lopFactor, r);
  const grossAfterLOP  = basic + hra + conv + sa + bonus + other;

  // ── Overtime ──────────────────────────────────────────────
  let overtimeAmount = 0;
  if (settings.overtimeEnabled && attendance.overtimeHours > 0) {
    const hourlyRate = (grossFull / workingDays) / 8; // 8-hour workday
    overtimeAmount   = applyRounding(
      hourlyRate * attendance.overtimeHours * settings.overtimeRate, r
    );
  }

  const totalEarnings = grossAfterLOP + overtimeAmount;

  // ── Statutory deductions ──────────────────────────────────
  const { employeePF, employerEPF, eps } = calculatePF(basic, settings);
  const { employeeESI, employerESI }     = calculateESI(grossAfterLOP, settings);
  const ptax = calculateProfessionalTax(grossAfterLOP, settings, month);

  const tds = await calculateMonthlyTDS(
    employeeId, companyId, month, year,
    grossAfterLOP, basic, hra, settings
  );

  const loanDeduction = await getActiveLoanDeduction(employeeId, month, year);

  const totalDeductions =
    employeePF + employeeESI + tds + ptax + loanDeduction;

  const netPay = applyRounding(
    Math.max(0, totalEarnings - totalDeductions), r
  );

  // ── Employer-side costs ───────────────────────────────────
  const gratuity = settings.gratuityEnabled
    ? applyRounding(basicFull * settings.gratuityRate, r)
    : 0;

  // ── Tax regime used ───────────────────────────────────────
  const taxConfig = await prisma.employeeTaxConfig
    .findUnique({ where: { employeeId } })
    .catch(() => null);
  const taxRegimeUsed = (taxConfig?.taxRegime ?? settings.taxRegime) as "OLD" | "NEW";

  return {
    employeeId,
    workingDays,
    daysWorked: Math.max(0, workingDays - totalLOP),
    lopDays:    totalLOP,
    halfDays:   attendance.halfDays,
    lateDays:   attendance.lateDays,
    overtimeHours: attendance.overtimeHours,
    taxRegimeUsed,
    earnings: {
      basic,
      hra,
      conveyance: conv,
      specialAllowance: sa,
      bonus,
      otherEarnings: other,
      overtimeAmount,
      totalEarnings,
    },
    deductions: {
      pf: employeePF,
      esi: employeeESI,
      tds,
      professionalTax: ptax,
      loanDeduction,
      otherDeductions: 0,
      totalDeductions,
    },
    employerContributions: {
      epf: employerEPF,
      eps,
      esi: employerESI,
      gratuity,
      totalEmployerCost: employerEPF + eps + employerESI + gratuity,
    },
    grossSalary: grossFull,
    lopAmount,
    netPay,
  };
}

// ============================================================
// PAYROLL RUN
// ============================================================

export async function runPayroll(
  companyId: string,
  month: number,
  year: number,
  processedBy: string
) {
  // Guard: never re-run a locked payroll
  const existingRun = await prisma.payrollRun.findUnique({
    where: { companyId_month_year: { companyId, month, year } },
  });
  if (existingRun?.status === "LOCKED") {
    throw new Error("Payroll for this month is already locked and cannot be re-run.");
  }
  if (existingRun) {
    await prisma.payrollRun.delete({ where: { id: existingRun.id } });
  }

  // Create a DRAFT run placeholder
  const payrollRun = await prisma.payrollRun.create({
    data: {
      companyId,
      month,
      year,
      status: "DRAFT",
      totalEmployees: 0,
      totalEarnings:  0,
      totalDeductions:0,
      totalGross:     0,
      totalNetPay:    0,
      processedBy,
    },
  });

  // Active employees (CONFIRMED + PROBATION)
  const employees = await prisma.employee.findMany({
    where: {
      companyId,
      employmentStatus: { in: ["CONFIRMED", "PROBATION"] },
      isDeleted: false,
    },
    select: { id: true },
  });

  // Bulk-fetch attendance and leave for the month
  const [attendanceMap, leaveMap, { workingDays }, settings] =
    await Promise.all([
      getAttendanceDataForMonth(companyId, month, year),
      getLeaveDataForMonth(companyId, month, year),
      getWorkingDaysInMonth(companyId, year, month),
      getPayrollSettings(companyId),
    ]);

  let totEarnings = 0, totDeductions = 0, totNetPay = 0,
      totGross = 0, processed = 0;

  for (const emp of employees) {
    try {
      // Merge attendance + unpaid-leave LOP
      const attSummary: AttendanceSummary = attendanceMap[emp.id] ?? {
        workingDays,
        daysPresent: 0,
        halfDays:    0,
        lateDays:    0,
        lopDays:     0,
        overtimeHours: 0,
      };
      attSummary.lopDays += leaveMap[emp.id]?.lopDays ?? 0;

      const calc = await calculatePayrollForEmployee(
        companyId, emp.id, month, year, attSummary
      );

      // Persist PayrollItem
      const item = await prisma.payrollItem.create({
        data: {
          payrollRunId:      payrollRun.id,
          employeeId:        emp.id,
          workingDays:       calc.workingDays,
          daysWorked:        Math.floor(calc.daysWorked),
          lopDays:           calc.lopDays,
          halfDays:          calc.halfDays,
          lateDays:          calc.lateDays,
          overtimeHours:     calc.overtimeHours,
          overtimeAmount:    calc.earnings.overtimeAmount,
          grossSalary:       calc.grossSalary,
          lopAmount:         calc.lopAmount,
          basicEarnings:     calc.earnings.basic,
          hraEarnings:       calc.earnings.hra,
          conveyanceEarnings:calc.earnings.conveyance,
          specialAllowance:  calc.earnings.specialAllowance,
          bonusEarnings:     calc.earnings.bonus,
          otherEarnings:     calc.earnings.otherEarnings,
          totalEarnings:     calc.earnings.totalEarnings,
          pfDeduction:       calc.deductions.pf,
          esiDeduction:      calc.deductions.esi,
          tdsDeduction:      calc.deductions.tds,
          professionalTax:   calc.deductions.professionalTax,
          loanDeduction:     calc.deductions.loanDeduction,
          otherDeductions:   0,
          totalDeductions:   calc.deductions.totalDeductions,
          netPay:            calc.netPay,
          arrears:           0,
          reimbursements:    0,
          taxRegimeUsed:     calc.taxRegimeUsed,
          status:            "CALCULATED",
        },
      });

      // ── PF statutory record ────────────────────────────────
      const { employeePF, employerEPF, eps, totalContrib } =
        calculatePF(calc.earnings.basic, settings);

      if (employeePF > 0 || eps > 0) {
        const employee = await prisma.employee.findUnique({
          where: { id: emp.id },
          select: { pfUAN: true, pfNumber: true },
        });
        await prisma.pFRecord.create({
          data: {
            payrollItemId:  item.id,
            employeeId:     emp.id,
            uanNumber:      employee?.pfUAN    ?? undefined,
            pfNumber:       employee?.pfNumber ?? undefined,
            employeeContrib:employeePF,
            employerContrib:employerEPF,
            pensionContrib: eps,
            totalContrib,
          },
        });
      }

      // ── ESI statutory record ───────────────────────────────
      if (calc.deductions.esi > 0) {
        const employee = await prisma.employee.findUnique({
          where: { id: emp.id },
          select: { esiNumber: true },
        });
        await prisma.eSIRecord.create({
          data: {
            payrollItemId:  item.id,
            employeeId:     emp.id,
            esiNumber:      employee?.esiNumber ?? undefined,
            employeeContrib:calc.deductions.esi,
            employerContrib:calc.employerContributions.esi,
            totalContrib:   calc.deductions.esi + calc.employerContributions.esi,
          },
        });
      }

      // ── TDS record ─────────────────────────────────────────
      if (calc.deductions.tds > 0) {
        const annualGross = calc.earnings.totalEarnings * 12;
        const { baseTax, cess } = calculateAnnualTax(
          annualGross, calc.taxRegimeUsed
        );
        await prisma.tDSRecord.create({
          data: {
            payrollItemId: item.id,
            employeeId:    emp.id,
            taxFromSalary: calc.deductions.tds,
            taxFromOther:  0,
            totalTax:      calc.deductions.tds,
            cess:          Math.ceil(calc.deductions.tds * (CESS_RATE / (1 + CESS_RATE))),
            totalTds:      calc.deductions.tds,
          },
        });
      }

      // ── Mark loan repayment deducted ───────────────────────
      if (calc.deductions.loanDeduction > 0) {
        await prisma.loanRepayment.updateMany({
          where: {
            month,
            year,
            status:  "PENDING",
            loan:    { employeeId: emp.id, status: "ACTIVE" },
          },
          data: { status: "DEDUCTED", processedAt: new Date() },
        });
      }

      totEarnings   += calc.earnings.totalEarnings;
      totDeductions += calc.deductions.totalDeductions;
      totNetPay     += calc.netPay;
      totGross      += calc.grossSalary;
      processed++;

    } catch (err) {
      console.error(`[Payroll] Error for employee ${emp.id}:`, err);
    }
  }

  // Update run with final totals and PROCESSED status
  return prisma.payrollRun.update({
    where: { id: payrollRun.id },
    data: {
      status:         "PROCESSED",
      totalEmployees: processed,
      totalEarnings:  totEarnings,
      totalDeductions:totDeductions,
      totalGross:     totGross,
      totalNetPay:    totNetPay,
      processedAt:    new Date(),
    },
  });
}

// ============================================================
// LOCK PAYROLL
// ============================================================

export async function lockPayroll(payrollRunId: string, lockedBy: string) {
  const run = await prisma.payrollRun.findUnique({
    where: { id: payrollRunId },
  });
  if (!run)                    throw new Error("Payroll run not found.");
  if (run.status === "LOCKED") throw new Error("Payroll is already locked.");
  if (run.status !== "PROCESSED")
    throw new Error("Only a PROCESSED payroll run can be locked.");

  return prisma.payrollRun.update({
    where: { id: payrollRunId },
    data:  { status: "LOCKED", lockedAt: new Date(), lockedBy },
  });
}

// ============================================================
// GENERATE PAYSLIP RECORD
// ============================================================

export async function generatePayslip(payrollItemId: string) {
  const existing = await prisma.payslip.findUnique({
    where: { payrollItemId },
  });
  if (existing) return existing;

  return prisma.payslip.create({ data: { payrollItemId } });
}

// ============================================================
// PAYROLL RUN HISTORY
// ============================================================

export async function getPayrollRuns(
  companyId: string,
  page   = 1,
  limit  = 10
) {
  const skip = (page - 1) * limit;
  const [runs, total] = await Promise.all([
    prisma.payrollRun.findMany({
      where: { companyId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      skip,
      take: limit,
      include: { _count: { select: { items: true } } },
    }),
    prisma.payrollRun.count({ where: { companyId } }),
  ]);
  return { runs, total, page, limit, totalPages: Math.ceil(total / limit) };
}
