type ApiResponse<T> = {
  data?: T;
  message?: string;
  error?: string;
};

export interface LeaveTypeConfig {
  id: string;
  name: string;
  code: string;
  type: LeaveCategory;
  annualDays: number;
  isActive: boolean;
  accrualType: "MONTHLY" | "YEARLY";
  accrualRate: number;
  maxConsecutive: number;
  minNoticeDays: number;
  canApplyHalfDay: boolean;
  maxHalfDaysPerYear: number;
  genderSpecific: "MALE" | "FEMALE" | null;
  allowCarryForward: boolean;
  maxCarryForward: number;
  allowEncashment: boolean;
  maxEncashDays: number;
  expiryDays: number;
  sortOrder: number;
}

export type LeaveCategory =
  | "CASUAL"
  | "SICK"
  | "PRIVILEGE"
  | "MATERNITY"
  | "PATERNITY"
  | "BEREAVEMENT"
  | "UNPAID"
  | "COMP_OFF"
  | "WORK_FROM_HOME";

export type SessionType = "FULL_DAY" | "FIRST_HALF" | "SECOND_HALF";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "MODIFICATION_REQUESTED";
export type CompOffStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "USED" | "CANCELLED";

export interface LeaveApplication {
  id: string;
  employeeId: string;
  companyId: string;
  leaveTypeId: string | null;
  leaveTypeConfig: LeaveTypeConfig | null;
  startDate: string;
  endDate: string;
  startSession: SessionType;
  endSession: SessionType;
  totalDays: number;
  reason: string | null;
  attachmentUrl: string | null;
  status: LeaveStatus;
  level1Status: ApprovalStatus;
  level1ReviewedBy: string | null;
  level1ReviewedAt: string | null;
  level1Remarks: string | null;
  level2Status: ApprovalStatus | null;
  level2ReviewedBy: string | null;
  level2ReviewedAt: string | null;
  level2Remarks: string | null;
  currentApproverLevel: number;
  approverId: string | null;
  isCancelled: boolean;
  createdAt: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: { name: string | null };
    designation?: { name: string | null };
  };
}

export interface LeaveApplicationInput {
  leaveTypeId: string;
  startDate: string;
  endDate?: string;
  reason?: string;
  isHalfDay?: boolean;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeId: string | null;
  leaveTypeConfig: LeaveTypeConfig | null;
  year: number;
  month: number | null;
  allocatedDays: number;
  accruedDays: number;
  carriedForward: number;
  usedDays: number;
  pendingDays: number;
  availableDays: number;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  description: string | null;
  branchId: string | null;
  branch?: { id: string; name: string } | null;
  isOptional: boolean;
  isRecurring: boolean;
}

export interface HolidayInput {
  name: string;
  date: string;
  description?: string;
  branchId?: string;
  isOptional?: boolean;
  isRecurring?: boolean;
}

export interface CompOffRequest {
  id: string;
  employeeId: string;
  workDate: string;
  workSession: SessionType;
  expiryDate: string | null;
  isUsed: boolean;
  usedOnDate: string | null;
  reason: string | null;
  attachmentUrl: string | null;
  status: CompOffStatus;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CompOffBalance {
  id: string;
  employeeId: string;
  earnedDays: number;
  usedDays: number;
  availableDays: number;
}

export interface LeavePolicy {
  id: string;
  companyId: string;
  approvalLevel1: "MANAGER" | "HR" | "BOTH";
  approvalLevel2: "MANAGER" | "HR" | "BOTH" | null;
  managerApprovalDays: number;
  hrApprovalDays: number;
  encashmentStartMonth: number;
  encashmentEndMonth: number;
  processCarryForward: boolean;
  carryForwardDeadline: string | null;
  allowAutoApproval: boolean;
  autoApprovalDaysThreshold: number;
}

export interface LeaveNotification {
  id: string;
  employeeId: string;
  type: string;
  title: string;
  message: string;
  relatedType: string | null;
  relatedId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface LeaveComment {
  id: string;
  applicationId: string;
  userId: string;
  user: { id: string; name: string };
  comment: string;
  isInternal: boolean;
  createdAt: string;
}

export const leaveCategoryLabels: Record<LeaveCategory, string> = {
  CASUAL: "Casual Leave",
  SICK: "Sick Leave",
  PRIVILEGE: "Privilege Leave",
  MATERNITY: "Maternity Leave",
  PATERNITY: "Paternity Leave",
  BEREAVEMENT: "Bereavement Leave",
  UNPAID: "Unpaid Leave",
  COMP_OFF: "Compensatory Off",
  WORK_FROM_HOME: "Work From Home",
};

export const sessionTypeLabels: Record<SessionType, string> = {
  FULL_DAY: "Full Day",
  FIRST_HALF: "First Half",
  SECOND_HALF: "Second Half",
};

export const leaveStatusLabels: Record<LeaveStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export const approvalStatusLabels: Record<ApprovalStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  MODIFICATION_REQUESTED: "Modification Requested",
};

export const compOffStatusLabels: Record<CompOffStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
  USED: "Used",
  CANCELLED: "Cancelled",
};

// API Functions
export async function getLeaveTypes(): Promise<ApiResponse<{ leaveTypes: LeaveTypeConfig[] }>> {
  const res = await fetch("/api/leave/types", { credentials: "include" });
  return res.json();
}

export async function createLeaveType(data: Partial<LeaveTypeConfig>): Promise<ApiResponse<{ leaveType: LeaveTypeConfig }>> {
  const res = await fetch("/api/leave/types", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  return res.json();
}

export async function updateLeaveType(id: string, data: Partial<LeaveTypeConfig>): Promise<ApiResponse<{ leaveType: LeaveTypeConfig }>> {
  const res = await fetch(`/api/leave/types/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  return res.json();
}

export async function deleteLeaveType(id: string): Promise<ApiResponse<{ message: string }>> {
  const res = await fetch(`/api/leave/types/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  return res.json();
}

export async function createLeaveApplication(data: LeaveApplicationInput): Promise<ApiResponse<{ application: LeaveApplication }>> {
  const res = await fetch("/api/leave", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  return res.json();
}

export async function getLeaveApplications(filters?: {
  status?: LeaveStatus;
  leaveTypeId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{ applications: LeaveApplication[]; total: number; page: number; totalPages: number }>> {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined) params.set(k, String(v));
    });
  }
  const res = await fetch(`/api/leave?${params}`, { credentials: "include" });
  return res.json();
}

export async function getLeaveApplication(id: string): Promise<ApiResponse<{ application: LeaveApplication }>> {
  const res = await fetch(`/api/leave/${id}`, { credentials: "include" });
  return res.json();
}

export async function cancelLeaveApplication(id: string): Promise<ApiResponse<{ application: LeaveApplication }>> {
  const res = await fetch(`/api/leave/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  return res.json();
}

export async function approveLeaveApplication(
  id: string,
  action: "APPROVED" | "REJECTED" | "MODIFICATION_REQUESTED",
  comments?: string
): Promise<ApiResponse<any>> {
  const res = await fetch(`/api/leave/${id}/approve`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, comments }),
    credentials: "include",
  });
  return res.json();
}

export async function addLeaveComment(
  applicationId: string,
  comment: string,
  isInternal: boolean = false
): Promise<ApiResponse<{ comment: LeaveComment }>> {
  const res = await fetch(`/api/leave/${applicationId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comment, isInternal }),
    credentials: "include",
  });
  return res.json();
}

export async function getLeaveBalances(employeeId?: string, year?: number): Promise<ApiResponse<{ balances: LeaveBalance[]; year: number }>> {
  const params = new URLSearchParams();
  if (employeeId) params.set("employeeId", employeeId);
  if (year) params.set("year", String(year));
  const res = await fetch(`/api/leave/balance?${params}`, { credentials: "include" });
  return res.json();
}

export async function getLeavePolicy(): Promise<ApiResponse<{ policy: LeavePolicy | null }>> {
  const res = await fetch("/api/leave/balance/policy", { credentials: "include" });
  return res.json();
}

export async function updateLeavePolicy(data: Partial<LeavePolicy>): Promise<ApiResponse<{ policy: LeavePolicy }>> {
  const res = await fetch("/api/leave/balance/policy", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  return res.json();
}

export async function initializeLeaveBalances(employeeId: string, year: number): Promise<ApiResponse<{ message: string }>> {
  const res = await fetch("/api/leave/balance/initialize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employeeId, year }),
    credentials: "include",
  });
  return res.json();
}

export async function getHolidays(year?: number, branchId?: string): Promise<ApiResponse<{ holidays: Holiday[]; year: number }>> {
  const params = new URLSearchParams();
  if (year) params.set("year", String(year));
  if (branchId) params.set("branchId", branchId);
  const res = await fetch(`/api/leave/holidays?${params}`, { credentials: "include" });
  return res.json();
}

export async function createHoliday(data: HolidayInput): Promise<ApiResponse<{ holiday: Holiday }>> {
  const res = await fetch("/api/leave/holidays", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  return res.json();
}

export async function updateHoliday(id: string, data: Partial<HolidayInput>): Promise<ApiResponse<{ holiday: Holiday }>> {
  const res = await fetch(`/api/leave/holidays/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  return res.json();
}

export async function deleteHoliday(id: string): Promise<ApiResponse<{ message: string }>> {
  const res = await fetch(`/api/leave/holidays/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  return res.json();
}

export async function createCompOffRequest(data: {
  workDate: string;
  workSession?: SessionType;
  reason?: string;
}): Promise<ApiResponse<{ request: CompOffRequest }>> {
  const res = await fetch("/api/leave/comp-off", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  return res.json();
}

export async function getCompOffRequests(filters?: {
  status?: CompOffStatus;
  employeeId?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{ requests: CompOffRequest[]; total: number; page: number; totalPages: number }>> {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined) params.set(k, String(v));
    });
  }
  const res = await fetch(`/api/leave/comp-off?${params}`, { credentials: "include" });
  return res.json();
}

export async function approveCompOffRequest(id: string, approved: boolean, comments?: string): Promise<ApiResponse<any>> {
  const res = await fetch(`/api/leave/comp-off/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approved, comments }),
    credentials: "include",
  });
  return res.json();
}

export async function getCompOffBalance(employeeId?: string): Promise<ApiResponse<{ balance: CompOffBalance | null }>> {
  const params = employeeId ? `?employeeId=${employeeId}` : "";
  const res = await fetch(`/api/leave/comp-off/balance${params}`, { credentials: "include" });
  return res.json();
}

export async function getLeaveNotifications(unreadOnly?: boolean): Promise<ApiResponse<{ notifications: LeaveNotification[] }>> {
  const params = unreadOnly ? "?unread=true" : "";
  const res = await fetch(`/api/leave/notifications${params}`, { credentials: "include" });
  return res.json();
}

export async function markNotificationAsRead(id: string): Promise<ApiResponse<{ notification: LeaveNotification }>> {
  const res = await fetch(`/api/leave/notifications/${id}`, {
    method: "PUT",
    credentials: "include",
  });
  return res.json();
}

// HR Admin Notification Functions
export async function getHRNotifications(unreadOnly?: boolean): Promise<ApiResponse<{ notifications: LeaveNotification[] }>> {
  const params = unreadOnly ? "?unread=true" : "";
  const res = await fetch(`/api/leave/notifications/hr${params}`, { credentials: "include" });
  return res.json();
}

export async function markHRNotificationAsRead(id: string): Promise<ApiResponse<{ notification: LeaveNotification }>> {
  const res = await fetch("/api/leave/notifications/hr", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
    credentials: "include",
  });
  return res.json();
}

export async function markAllHRNotificationsAsRead(): Promise<ApiResponse<{ count: number }>> {
  const res = await fetch("/api/leave/notifications/hr", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ markAll: true }),
    credentials: "include",
  });
  return res.json();
}