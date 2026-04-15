export const HR_ROUTES = {
  DASHBOARD: '/dashboard/hr',
  COMPANY_SETUP: '/dashboard/hr/company-setup',
  EMPLOYEES: '/dashboard/hr/employees',
  EMPLOYEE_DETAIL: (id: string) => `/dashboard/hr/employees/${id}`,
  EMPLOYEE_NEW: '/dashboard/hr/employees/new',
  EMPLOYEE_EDIT: (id: string) => `/dashboard/hr/employees/${id}/edit`,
  ATTENDANCE: '/dashboard/hr/attendance',
  ATTENDANCE_REPORTS: '/dashboard/hr/attendance/reports',
  SHIFTS: '/dashboard/hr/shifts',
  LEAVE: '/dashboard/hr/leave',
  LEAVE_TYPES: '/dashboard/hr/leave-types',
  LEAVE_POLICY: '/dashboard/hr/leave-policy',
  HOLIDAYS: '/dashboard/hr/holidays',
  NOTIFICATIONS: '/dashboard/hr/notifications',
  ORGANIZATION: '/dashboard/hr/organization',
  PAYROLL: '/dashboard/hr/payroll',
  PAYROLL_RUN: (id: string) => `/dashboard/hr/payroll/${id}`,
  TICKETS: '/dashboard/hr/tickets',
  SETTINGS: '/dashboard/hr/settings',
} as const;

export const EMPLOYEE_ROUTES = {
  DASHBOARD: '/dashboard/employee',
  PROFILE: '/dashboard/employee/profile',
  INBOX: '/dashboard/employee/inbox',
  EMPLOYEES: '/dashboard/employee/employees',
  ATTENDANCE: '/dashboard/employee/attendance',
  LEAVE: '/dashboard/employee/leave',
  LEAVE_APPLY: '/dashboard/employee/leave/apply',
  PAYROLL: '/dashboard/employee/payroll',
  OVERTIME: '/dashboard/employee/overtime',
  HOLIDAYS: '/dashboard/employee/holidays',
  HELP: '/dashboard/employee/help',
  NOTIFICATIONS: '/dashboard/employee/notifications',
  SELF_SERVICE: {
    DASHBOARD: '/dashboard/employee/self-service/dashboard',
    PROFILE: '/dashboard/employee/self-service/profile',
    PAYSLIPS: '/dashboard/employee/self-service/payslips',
    DOCUMENTS: '/dashboard/employee/self-service/documents',
    ANNOUNCEMENTS: '/dashboard/employee/self-service/announcements',
  },
} as const;

export const API_ROUTES = {
  HR: {
    EMPLOYEES: '/api/employees',
    EMPLOYEE_BY_ID: (id: string) => `/api/employees/${id}`,
    EMPLOYEES_STATS: '/api/employees/stats',
    EMPLOYEES_EXPORT: '/api/employees/export',
    COMPANY: '/api/company',
    DEPARTMENTS: '/api/departments',
    DESIGNATIONS: '/api/designations',
    ATTENDANCE: '/api/attendance',
    ATTENDANCE_REGULARIZATION: '/api/attendance/regularization',
    LEAVE: '/api/leave',
    LEAVE_TYPES: '/api/leave-types',
    LEAVE_POLICY: '/api/leave-policy',
    HOLIDAYS: '/api/holidays',
    SHIFTS: '/api/shifts',
    PAYROLL: '/api/payroll',
    PAYROLL_RUN: (id: string) => `/api/payroll/${id}`,
  },
  EMPLOYEE: {
    ME: '/api/employees/me',
    DASHBOARD: '/api/employees/dashboard',
    COMPANY_EMPLOYEES: '/api/employees/company',
    ATTENDANCE: '/api/employee/attendance',
    LEAVE: '/api/employee/leave',
    LEAVE_BALANCES: '/api/employee/leave/balances',
    PAYROLL: '/api/payroll/employee',
    HOLIDAYS: '/api/employee/holidays',
    OVERTIME: '/api/employee/overtime',
  },
} as const;

export const buildQueryString = (params: Record<string, string | number | undefined>): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  });
  return searchParams.toString();
};

export const withQueryParams = (baseUrl: string, params: Record<string, string | number | undefined>): string => {
  const query = buildQueryString(params);
  return query ? baseUrl + '?' + query : baseUrl;
};

export type HRRoute = typeof HR_ROUTES[keyof typeof HR_ROUTES];
export type EmployeeRoute = typeof EMPLOYEE_ROUTES[keyof typeof EMPLOYEE_ROUTES];
export type ApiRoute = string;
