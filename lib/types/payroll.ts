export type PayrollEmployeeRow = {
  employee: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    branchId: string | null;
    dateOfJoining?: string | null;
    departmentName?: string | null;
    designationName?: string | null;
    bankName?: string | null;
    bankAccountNumber?: string | null;
    pfNumber?: string | null;
    pfUAN?: string | null;
    esiNumber?: string | null;
    panNumber?: string | null;
  };
  basicSalary: number | null;
  workingDays: number;
  presentDays: number;
  payableDays: number;
  grossPay: number | null;
  deductions: number | null;
  netPay: number | null;
};

export type PayrollMonthResult = {
  run: {
    id: string;
    year: number;
    month: number;
    periodStart: string;
    periodEnd: string;
    weekOffDays: number;
    holidays: number;
    workingDays: number;
    sharedWithEmployees: boolean;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  rows: PayrollEmployeeRow[];
};

export type PayrollApiResult = { month: string; run: PayrollMonthResult["run"] | null; rows: PayrollMonthResult["rows"] };
