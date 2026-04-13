import type { PayrollApiResult, PayrollMonthResult } from "@/lib/types/payroll";

type ApiResponse<T> = {
  data?: T;
  error?: string;
};

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export async function fetchPayroll(month: string): Promise<ApiResponse<PayrollApiResult>> {
  try {
    const response = await fetch(`/api/payroll?month=${encodeURIComponent(month)}`);
    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to fetch payroll." };
    }
    const data = await parseJson<PayrollApiResult>(response);
    return { data };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function generatePayroll(month: string, overwrite = true): Promise<ApiResponse<PayrollMonthResult>> {
  try {
    const response = await fetch("/api/payroll/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, overwrite }),
    });

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to generate payroll." };
    }

    const data = await parseJson<PayrollMonthResult>(response);
    return { data };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export type PayrollRunListItem = {
  id: string;
  year: number;
  month: number;
  workingDays: number;
  holidays: number;
  weekOffDays: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export async function fetchPayrollRuns(year?: number): Promise<ApiResponse<{ runs: PayrollRunListItem[] }>> {
  try {
    const url = year ? `/api/payroll/runs?year=${encodeURIComponent(String(year))}` : "/api/payroll/runs";
    const response = await fetch(url);
    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to fetch payroll runs." };
    }
    const data = await parseJson<{ runs: PayrollRunListItem[] }>(response);
    return { data };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function downloadPayrollPdf(month: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`/api/payroll/pdf?month=${encodeURIComponent(month)}`);
    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to download payroll PDF." };
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payroll-${month}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    return { data: undefined };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function setPayrollShared(month: string, share: boolean): Promise<ApiResponse<{ run: { id: string; sharedWithEmployees: boolean } }>> {
  try {
    const response = await fetch("/api/payroll/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, share }),
    });

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to update share settings." };
    }

    const data = await parseJson<{ run: { id: string; sharedWithEmployees: boolean } }>(response);
    return { data };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export type EmployeePayrollItem = {
  basicSalary: number | null;
  grossPay: number | null;
  deductions: number | null;
  netPay: number | null;
  workingDays: number;
  presentDays: number;
  payableDays: number;
};

export type EmployeePayrollMonth = {
  runId: string;
  year: number;
  month: number;
  status: string;
  updatedAt: string;
  calendar?: {
    workingDays: number;
    holidays: number;
    weekOffDays: number;
  };
  item: EmployeePayrollItem;
};

export async function fetchEmployeePayroll(year?: number): Promise<
  ApiResponse<{
    year: number;
    employee: {
      id: string;
      employeeCode: string;
      firstName: string;
      lastName: string;
      department: string | null;
      designation: string | null;
      basicSalary: number | null;
    };
    payroll: EmployeePayrollMonth[];
  }>
> {
  try {
    const url = year ? `/api/payroll/employee?year=${encodeURIComponent(String(year))}` : "/api/payroll/employee";
    const response = await fetch(url);
    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to fetch employee payroll." };
    }
    const data = await parseJson<{
      year: number;
      employee: {
        id: string;
        employeeCode: string;
        firstName: string;
        lastName: string;
        department: string | null;
        designation: string | null;
        basicSalary: number | null;
      };
      payroll: Array<{
        runId: string;
        year: number;
        month: number;
        status: string;
        updatedAt: string;
        calendar?: {
          workingDays: number;
          holidays: number;
          weekOffDays: number;
        };
        item: EmployeePayrollItem;
      }>;
    }>(response);

    return { data: { year: data.year, employee: data.employee, payroll: data.payroll as EmployeePayrollMonth[] } };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}
