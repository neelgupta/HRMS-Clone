export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    ME: `${API_BASE_URL}/api/auth/me`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    RESET_PASSWORD_INIT: `${API_BASE_URL}/api/auth/reset-password/init`,
    RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,
    SET_PASSWORD: `${API_BASE_URL}/api/auth/set-password`,
  },
  EMPLOYEES: {
    LIST: `${API_BASE_URL}/api/employees`,
    ME: `${API_BASE_URL}/api/employees/me`,
    DASHBOARD: `${API_BASE_URL}/api/employees/dashboard`,
    DOCUMENTS: `${API_BASE_URL}/api/employees/documents`,
    STATS: `${API_BASE_URL}/api/employees/stats`,
    EXPORT: `${API_BASE_URL}/api/employees/export`,
  },
  COMPANY: {
    ME: `${API_BASE_URL}/api/company/me`,
    SUMMARY: `${API_BASE_URL}/api/company/summary`,
    UPLOAD: `${API_BASE_URL}/api/company/upload`,
  },
  LEAVE: {
    LIST: `${API_BASE_URL}/api/leave`,
    TYPES: `${API_BASE_URL}/api/leave/types`,
    BALANCE_POLICY: `${API_BASE_URL}/api/leave/balance/policy`,
    BALANCE_INITIALIZE: `${API_BASE_URL}/api/leave/balance/initialize`,
    HOLIDAYS: `${API_BASE_URL}/api/leave/holidays`,
    COMP_OFF: `${API_BASE_URL}/api/leave/comp-off`,
    NOTIFICATIONS: `${API_BASE_URL}/api/leave/notifications`,
    NOTIFICATIONS_HR: `${API_BASE_URL}/api/leave/notifications/hr`,
  },
  ATTENDANCE: {
    LIST: `${API_BASE_URL}/api/attendance`,
    TODAY: `${API_BASE_URL}/api/attendance/today`,
    CLOCK_IN: `${API_BASE_URL}/api/attendance/clock-in`,
    CLOCK_OUT: `${API_BASE_URL}/api/attendance/clock-out`,
    POLICY: `${API_BASE_URL}/api/attendance/policy`,
    REGULARIZATIONS: `${API_BASE_URL}/api/attendance/regularizations`,
    BREAK_START: `${API_BASE_URL}/api/attendance/break-start`,
    BREAK_END: `${API_BASE_URL}/api/attendance/break-end`,
  },
  SHIFTS: {
    LIST: `${API_BASE_URL}/api/shifts`,
    ASSIGN: `${API_BASE_URL}/api/shifts/assign`,
  },
  PAYROLL: {
    GENERATE: `${API_BASE_URL}/api/payroll/generate`,
    SHARE: `${API_BASE_URL}/api/payroll/share`,
  },
  TICKETS: {
    LIST: `${API_BASE_URL}/api/tickets`,
  },
  DEPARTMENTS: {
    LIST: `${API_BASE_URL}/api/departments`,
  },
  DESIGNATIONS: {
    LIST: `${API_BASE_URL}/api/designations`,
  },
  USERS: {
    LIST: `${API_BASE_URL}/api/users`,
    UNLINKED_EMPLOYEES: `${API_BASE_URL}/api/users/unlinked-employees`,
  },
  BRANCHES: {
    LIST: `${API_BASE_URL}/api/branches`,
  },
} as const;

export function buildApiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}