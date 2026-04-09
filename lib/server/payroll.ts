import { Decimal } from "@prisma/client/runtime/library";
import { PayrollSetting, Employee, PayrollRun, PayrollItem } from "@prisma/client";

export interface PayrollSettings {
  pfRate: number;
  pfWageCeiling: number;
  esiRate: number;
  esiEmployerRate: number;
  esiWageCeiling: number;
  professionalTax: number;
}

export interface SalaryStructureData {
  basic: number;
  hra: number;
  conveyance: number;
  specialAllowance: number;
  bonus: number;
  pfDeduction: number;
  esiDeduction: number;
  tdsDeduction: number;
  professionalTax: number;
  otherDeductions: number;
}

export interface PayrollCalculationResult {
  employeeId: string;
  workingDays: number;
  daysWorked: number;
  lopDays: number;
  earnings: {
    basic: number;
    hra: number;
    conveyance: number;
    specialAllowance: number;
    bonus: number;
    otherEarnings: number;
    totalEarnings: number;
  };
  deductions: {
    pf: number;
    esi: number;
    tds: number;
    professionalTax: number;
    otherDeductions: number;
    totalDeductions: number;
  };
  netPay: number;
}

export async function getPayrollSettings(companyId: string): Promise<PayrollSettings> {
  const { prisma } = await import("@/lib/prisma");
  
  let settings = await prisma.payrollSetting.findUnique({
    where: { companyId },
  });

  if (!settings) {
    settings = await prisma.payrollSetting.create({
      data: { companyId },
    });
  }

  return {
    pfRate: Number(settings.pfRate),
    pfWageCeiling: Number(settings.pfWageCeiling),
    esiRate: Number(settings.esiRate),
    esiEmployerRate: Number(settings.esiEmployerRate),
    esiWageCeiling: Number(settings.esiWageCeiling),
    professionalTax: Number(settings.professionalTax),
  };
}

export function calculatePF(
  grossSalary: number,
  settings: PayrollSettings
): { employeePF: number; employerPF: number; pensionContrib: number } {
  const wageCeiling = settings.pfWageCeiling;
  const pfRate = settings.pfRate / 100;

  const eligibleWage = Math.min(grossSalary, wageCeiling);
  
  const employeePF = Math.floor(eligibleWage * pfRate);
  const employerPF = employeePF;
  const pensionContrib = Math.floor(employerPF * 0.8333);

  return { employeePF, employerPF, pensionContrib };
}

export function calculateESI(
  grossSalary: number,
  settings: PayrollSettings
): { employeeESI: number; employerESI: number } {
  const wageCeiling = settings.esiWageCeiling;
  const esiRate = settings.esiRate / 100;
  const employerRate = settings.esiEmployerRate / 100;

  if (grossSalary > wageCeiling) {
    return { employeeESI: 0, employerESI: 0 };
  }

  const employeeESI = Math.floor(grossSalary * esiRate * 10) / 10;
  const employerESI = Math.floor(grossSalary * employerRate * 100) / 100;

  return { employeeESI, employerESI };
}

export function calculateTDS(
  annualGross: number,
  deductions: number,
  taxDeclarations: number = 0
): number {
  const taxableIncome = annualGross - deductions - taxDeclarations;
  
  let tax = 0;
  if (taxableIncome <= 250000) {
    tax = 0;
  } else if (taxableIncome <= 500000) {
    tax = (taxableIncome - 250000) * 0.05;
  } else if (taxableIncome <= 750000) {
    tax = 12500 + (taxableIncome - 500000) * 0.10;
  } else if (taxableIncome <= 1000000) {
    tax = 37500 + (taxableIncome - 750000) * 0.15;
  } else if (taxableIncome <= 1250000) {
    tax = 75000 + (taxableIncome - 1000000) * 0.20;
  } else if (taxableIncome <= 1500000) {
    tax = 125000 + (taxableIncome - 1250000) * 0.25;
  } else {
    tax = 187500 + (taxableIncome - 1500000) * 0.30;
  }

  const monthlyTDS = Math.ceil(tax / 12);
  return monthlyTDS;
}

export function calculateProfessionalTax(month: number): number {
  const ptSlabs: Record<number, number> = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0,
    7: 200, 8: 200, 9: 200, 10: 200, 11: 200, 12: 200,
  };
  return ptSlabs[month] || 200;
}

export async function getEmployeeSalaryStructure(
  employeeId: string,
  effectiveDate: Date
) {
  const { prisma } = await import("@/lib/prisma");

  const structure = await prisma.salaryStructure.findFirst({
    where: {
      employeeId,
      isActive: true,
      effectiveFrom: { lte: effectiveDate },
    },
    include: {
      items: {
        include: {
          component: true,
        },
      },
    },
    orderBy: { effectiveFrom: "desc" },
  });

  return structure;
}

export async function calculatePayrollForEmployee(
  companyId: string,
  employeeId: string,
  month: number,
  year: number,
  attendanceData: {
    workingDays: number;
    daysPresent: number;
    lopDays: number;
    overtimeHours: number;
  }
): Promise<PayrollCalculationResult> {
  const settings = await getPayrollSettings(companyId);
  const structure = await getEmployeeSalaryStructure(employeeId, new Date(year, month - 1));

  if (!structure) {
    throw new Error("No salary structure found for employee");
  }

  const items = structure.items;
  
  let basic = 0;
  let hra = 0;
  let conveyance = 0;
  let specialAllowance = 0;
  let bonus = 0;

  for (const item of items) {
    const amount = Number(item.amount);
    switch (item.component.category) {
      case "BASIC":
        basic = amount;
        break;
      case "HRA":
        hra = amount;
        break;
      case "CONVEYANCE":
        conveyance = amount;
        break;
      case "SPECIAL_ALLOWANCE":
        specialAllowance = amount;
        break;
      case "BONUS":
        bonus = amount;
        break;
    }
  }

  const grossSalary = basic + hra + conveyance + specialAllowance + bonus;
  const dailyGross = grossSalary / attendanceData.workingDays;
  const lopAmount = dailyGross * attendanceData.lopDays;
  
  const proRatedBasic = basic - (basic / attendanceData.workingDays) * attendanceData.lopDays;
  const proRatedHra = hra - (hra / attendanceData.workingDays) * attendanceData.lopDays;
  const proRatedConveyance = conveyance;
  const proRatedSpecialAllowance = specialAllowance;

  const actualGross = proRatedBasic + proRatedHra + proRatedConveyance + proRatedSpecialAllowance;

  const { employeePF, employerPF, pensionContrib } = calculatePF(actualGross, settings);
  const { employeeESI } = calculateESI(actualGross, settings);
  
  const proRatedPT = calculateProfessionalTax(month) * (attendanceData.daysWorked / attendanceData.workingDays);

  const monthlyGross = actualGross * 12;
  const annualDeductions = employeePF * 12 + employeeESI * 12;
  const tdsDeduction = calculateTDS(monthlyGross, annualDeductions);

  const totalEarnings = actualGross;
  const totalDeductions = employeePF + employeeESI + tdsDeduction + proRatedPT;
  const netPay = totalEarnings - totalDeductions;

  return {
    employeeId,
    workingDays: attendanceData.workingDays,
    daysWorked: attendanceData.daysWorked,
    lopDays: attendanceData.lopDays,
    earnings: {
      basic: Math.round(proRatedBasic),
      hra: Math.round(proRatedHra),
      conveyance: Math.round(proRatedConveyance),
      specialAllowance: Math.round(proRatedSpecialAllowance),
      bonus: Math.round(bonus),
      otherEarnings: 0,
      totalEarnings: Math.round(totalEarnings),
    },
    deductions: {
      pf: employeePF,
      esi: employeeESI,
      tds: tdsDeduction,
      professionalTax: Math.round(proRatedPT),
      otherDeductions: 0,
      totalDeductions: Math.round(totalDeductions),
    },
    netPay: Math.round(netPay),
  };
}

export async function runPayroll(
  companyId: string,
  month: number,
  year: number,
  processedBy: string
) {
  const { prisma } = await import("@/lib/prisma");

  const existingRun = await prisma.payrollRun.findUnique({
    where: {
      companyId_month_year: { companyId, month, year },
    },
  });

  if (existingRun) {
    if (existingRun.status === "LOCKED") {
      throw new Error("Payroll already locked for this month");
    }
    await prisma.payrollRun.delete({
      where: { id: existingRun.id },
    });
  }

  const employees = await prisma.employee.findMany({
    where: {
      companyId,
      employmentStatus: "CONFIRMED",
      isDeleted: false,
    },
  });

  const attendanceData = await getAttendanceDataForMonth(companyId, month, year);
  const leaveData = await getLeaveDataForMonth(companyId, month, year);

  const payrollItems: PayrollItem[] = [];
  let totalEarnings = 0;
  let totalDeductions = 0;
  let totalNetPay = 0;

  for (const employee of employees) {
    const empAttendance = attendanceData[employee.id] || { workingDays: 0, daysPresent: 0, lopDays: 0, overtimeHours: 0 };
    const empLeave = leaveData[employee.id] || { lopDays: 0 };
    
    empAttendance.lopDays += empLeave.lopDays;

    try {
      const calc = await calculatePayrollForEmployee(companyId, employee.id, month, year, empAttendance);

      const item = await prisma.payrollItem.create({
        data: {
          payrollRunId: "",
          employeeId: employee.id,
          workingDays: calc.workingDays,
          daysWorked: calc.daysWorked,
          lopDays: calc.lopDays,
          overtimeHours: calc.lopDays,
          basicEarnings: calc.earnings.basic,
          hraEarnings: calc.earnings.hra,
          conveyanceEarnings: calc.earnings.conveyance,
          specialAllowance: calc.earnings.specialAllowance,
          bonusEarnings: calc.earnings.bonus,
          otherEarnings: calc.earnings.otherEarnings,
          totalEarnings: calc.earnings.totalEarnings,
          pfDeduction: calc.deductions.pf,
          esiDeduction: calc.deductions.esi,
          tdsDeduction: calc.deductions.tds,
          professionalTax: calc.deductions.professionalTax,
          otherDeductions: calc.deductions.otherDeductions,
          totalDeductions: calc.deductions.totalDeductions,
          netPay: calc.netPay,
          status: "CALCULATED",
        },
      });
      
      payrollItems.push(item as unknown as PayrollItem);
      totalEarnings += calc.earnings.totalEarnings;
      totalDeductions += calc.deductions.totalDeductions;
      totalNetPay += calc.netPay;

      if (calc.deductions.pf > 0) {
        await prisma.pFRecord.create({
          data: {
            payrollItemId: item.id,
            employeeId: employee.id,
            employeeContrib: calc.deductions.pf,
            employerContrib: calc.deductions.pf,
            totalContrib: calc.deductions.pf * 2,
            pensionContrib: calc.deductions.pf * 0.0833,
          },
        });
      }

      if (calc.deductions.esi > 0) {
        const esiSettings = await getPayrollSettings(companyId);
        const { employerESI } = calculateESI(calc.earnings.totalEarnings, esiSettings);
        
        await prisma.eSIRecord.create({
          data: {
            payrollItemId: item.id,
            employeeId: employee.id,
            employeeContrib: calc.deductions.esi,
            employerContrib: employerESI,
            totalContrib: calc.deductions.esi + employerESI,
          },
        });
      }

      if (calc.deductions.tds > 0) {
        await prisma.tDSRecord.create({
          data: {
            payrollItemId: item.id,
            employeeId: employee.id,
            taxFromSalary: calc.deductions.tds,
            taxFromOther: 0,
            totalTax: calc.deductions.tds,
            cess: 0,
            totalTds: calc.deductions.tds,
          },
        });
      }

    } catch (error) {
      console.error(`Error processing payroll for employee ${employee.id}:`, error);
    }
  }

  const payrollRun = await prisma.payrollRun.create({
    data: {
      companyId,
      month,
      year,
      status: "PROCESSED",
      totalEmployees: employees.length,
      totalEarnings,
      totalDeductions,
      totalNetPay,
      processedBy,
      processedAt: new Date(),
    },
  });

  await prisma.payrollItem.updateMany({
    where: { id: { in: payrollItems.map(i => i.id) } },
    data: { payrollRunId: payrollRun.id },
  });

  return payrollRun;
}

async function getAttendanceDataForMonth(
  companyId: string,
  month: number,
  year: number
): Promise<Record<string, { workingDays: number; daysPresent: number; lopDays: number; overtimeHours: number }>> {
  const { prisma } = await import("@/lib/prisma");

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const attendance = await prisma.attendance.groupBy({
    by: ["employeeId"],
    where: {
      companyId,
      date: { gte: startDate, lte: endDate },
    },
    _count: true,
    _sum: {
      overtimeHours: true,
    },
  });

  const presentCount = await prisma.attendance.groupBy({
    by: ["employeeId"],
    where: {
      companyId,
      date: { gte: startDate, lte: endDate },
      status: { in: ["PRESENT", "LATE", "HALF_DAY"] },
    },
    _count: true,
  });

  const result: Record<string, any> = {};
  const totalDaysInMonth = endDate.getDate();

  for (const emp of attendance) {
    const present = presentCount.find(p => p.employeeId === emp.employeeId)?._count || 0;
    result[emp.employeeId] = {
      workingDays: totalDaysInMonth,
      daysPresent: present,
      lopDays: totalDaysInMonth - present,
      overtimeHours: emp._sum.overtimeHours || 0,
    };
  }

  return result;
}

async function getLeaveDataForMonth(
  companyId: string,
  month: number,
  year: number
): Promise<Record<string, { lopDays: number }>> {
  const { prisma } = await import("@/lib/prisma");

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const unpaidLeaves = await prisma.leaveApplication.groupBy({
    by: ["employeeId"],
    where: {
      companyId,
      startDate: { lte: endDate },
      endDate: { gte: startDate },
      status: "APPROVED",
    },
    _sum: {
      totalDays: true,
    },
  });

  const result: Record<string, any> = {};
  for (const leave of unpaidLeaves) {
    result[leave.employeeId] = {
      lopDays: Math.ceil(leave._sum.totalDays || 0),
    };
  }

  return result;
}

export async function lockPayroll(
  payrollRunId: string,
  lockedBy: string
) {
  const { prisma } = await import("@/lib/prisma");

  const run = await prisma.payrollRun.findUnique({
    where: { id: payrollRunId },
  });

  if (!run) {
    throw new Error("Payroll run not found");
  }

  if (run.status === "LOCKED") {
    throw new Error("Payroll already locked");
  }

  return await prisma.payrollRun.update({
    where: { id: payrollRunId },
    data: {
      status: "LOCKED",
      lockedAt: new Date(),
      lockedBy,
    },
  });
}

export async function generatePayslip(payrollItemId: string) {
  const { prisma } = await import("@/lib/prisma");

  const existingPayslip = await prisma.payslip.findUnique({
    where: { payrollItemId },
  });

  if (existingPayslip) {
    return existingPayslip;
  }

  return await prisma.payslip.create({
    data: {
      payrollItemId,
    },
  });
}