import type {
  CreateShiftInput,
  UpdateShiftInput,
  ShiftSearchInput,
  AssignShiftInput,
  ClockInInput,
  ClockOutInput,
  BreakStartInput,
  BreakEndInput,
  AttendanceSearchInput,
  ManualAttendanceInput,
  RegularizationRequestInput,
  RegularizationReviewInput,
  AttendancePolicyInput,
} from "@/lib/validations/attendance";

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

export type AttendanceListItem = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
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
  breakStart: string | null;
  breakEnd: string | null;
  totalBreakMins: number | null;
  remarks: string | null;
  regularizations: Array<{
    id: string;
    requestedClockIn: string | null;
    requestedClockOut: string | null;
    reason: string;
    status: string;
    reviewedBy: string | null;
    reviewedAt: string | null;
    reviewRemarks: string | null;
    createdAt: string;
  }>;
};

export type AttendanceSummary = {
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalHalfDay: number;
  totalOnLeave: number;
  totalHoliday: number;
  totalWeekOff: number;
  totalOvertimeHours: number;
};

export type EmployeeAttendanceDashboard = {
  month: string;
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
    name: string;
    date: string; // YYYY-MM-DD
    day: string; // Mon/Tue/...
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

type ApiResponse<T> = {
  data?: T;
  error?: string;
};

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export async function fetchShifts(
  params: ShiftSearchInput
): Promise<ApiResponse<{
  shifts: ShiftListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>> {
  try {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set("search", params.search);
    if (params.isActive !== undefined) searchParams.set("isActive", String(params.isActive));
    searchParams.set("page", String(params.page));
    searchParams.set("limit", String(params.limit));

    const response = await fetch(`/api/shifts?${searchParams.toString()}`);

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to fetch shifts." };
    }

    const result = await parseJson<{
      shifts: ShiftListItem[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(response);

    return { data: result };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function createShift(
  values: CreateShiftInput
): Promise<ApiResponse<{ shift: ShiftListItem }>> {
  try {
    const response = await fetch("/api/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to create shift." };
    }

    const result = await parseJson<{ shift: ShiftListItem }>(response);
    return { data: result };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function updateShift(
  values: UpdateShiftInput
): Promise<ApiResponse<{ shift: ShiftListItem }>> {
  try {
    const response = await fetch(`/api/shifts/${values.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to update shift." };
    }

    const result = await parseJson<{ shift: ShiftListItem }>(response);
    return { data: result };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function deleteShift(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`/api/shifts/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to delete shift." };
    }

    return {};
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function assignShift(values: AssignShiftInput): Promise<ApiResponse<void>> {
  try {
    const response = await fetch("/api/shifts/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to assign shift." };
    }

    return {};
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function fetchAttendances(
  params: AttendanceSearchInput
): Promise<ApiResponse<{
  attendances: AttendanceListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>> {
  try {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set("search", params.search);
    if (params.employeeId) searchParams.set("employeeId", params.employeeId);
    if (params.department) searchParams.set("department", params.department);
    if (params.dateFrom) searchParams.set("dateFrom", params.dateFrom);
    if (params.dateTo) searchParams.set("dateTo", params.dateTo);
    if (params.status) searchParams.set("status", params.status);
    searchParams.set("page", String(params.page));
    searchParams.set("limit", String(params.limit));

    const response = await fetch(`/api/attendance?${searchParams.toString()}`);

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to fetch attendances." };
    }

    const result = await parseJson<{
      attendances: AttendanceListItem[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(response);

    return { data: result };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function manualAttendance(
  values: ManualAttendanceInput
): Promise<ApiResponse<{ attendance: AttendanceDetail }>> {
  try {
    const response = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to create manual attendance entry." };
    }

    const result = await parseJson<{ attendance: AttendanceDetail }>(response);
    return { data: result };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

let todayAttendanceCache: { data: any; timestamp: number } | null = null;
const ATTENDANCE_CACHE_DURATION = 5000;

export function clearTodayAttendanceCache() {
  todayAttendanceCache = null;
}

export async function fetchTodayAttendance(): Promise<ApiResponse<{
  attendance: AttendanceDetail | null;
  shift: ShiftListItem | null;
  currentTime: string;
}>> {
  const now = Date.now();
  if (todayAttendanceCache && now - todayAttendanceCache.timestamp < ATTENDANCE_CACHE_DURATION) {
    return { data: todayAttendanceCache.data };
  }

  try {
    const response = await fetch("/api/attendance/today");

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to fetch today's attendance." };
    }

    const result = await parseJson<{
      attendance: AttendanceDetail | null;
      shift: ShiftListItem | null;
      currentTime: string;
    }>(response);

    todayAttendanceCache = { data: result, timestamp: now };
    return { data: result };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function clockIn(values: ClockInInput): Promise<ApiResponse<{ attendance: AttendanceDetail }>> {
  try {
    const response = await fetch("/api/attendance/clock-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to clock in." };
    }

    const result = await parseJson<{ attendance: AttendanceDetail }>(response);
    clearTodayAttendanceCache();
    return { data: result };
  } catch {
    return { error: "Failed to clock in." };
  }
}

export async function clockOut(values: ClockOutInput): Promise<ApiResponse<{ attendance: AttendanceDetail }>> {
  try {
    const response = await fetch("/api/attendance/clock-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to clock out." };
    }

    const result = await parseJson<{ attendance: AttendanceDetail }>(response);
    clearTodayAttendanceCache();
    return { data: result };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function fetchAttendanceSummary(
  dateFrom: string,
  dateTo: string
): Promise<ApiResponse<AttendanceSummary>> {
  try {
    const searchParams = new URLSearchParams();
    searchParams.set("dateFrom", dateFrom);
    searchParams.set("dateTo", dateTo);

    const response = await fetch(`/api/attendance/summary?${searchParams.toString()}`);

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to fetch attendance summary." };
    }

    const result = await parseJson<AttendanceSummary>(response);
    return { data: result };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function fetchEmployeeAttendanceDashboard(
  month: string
): Promise<ApiResponse<EmployeeAttendanceDashboard>> {
  try {
    const searchParams = new URLSearchParams();
    if (month) searchParams.set("month", month);

    const response = await fetch(`/api/attendance/dashboard?${searchParams.toString()}`);

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to fetch dashboard attendance." };
    }

    const result = await parseJson<EmployeeAttendanceDashboard>(response);
    return { data: result };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function fetchAttendancePolicy(): Promise<ApiResponse<AttendancePolicyInput | null>> {
  try {
    const response = await fetch("/api/attendance/policy");

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to fetch attendance policy." };
    }

    const result = await parseJson<{ policy: AttendancePolicyInput | null }>(response);
    return { data: result.policy };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function saveAttendancePolicy(
  values: AttendancePolicyInput
): Promise<ApiResponse<void>> {
  try {
    const response = await fetch("/api/attendance/policy", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to save attendance policy." };
    }

    return {};
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function submitRegularization(
  values: RegularizationRequestInput
): Promise<ApiResponse<void>> {
  try {
    const response = await fetch("/api/attendance/regularizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to submit regularization request." };
    }

    return {};
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function reviewRegularization(
  regularizationId: string,
  values: RegularizationReviewInput
): Promise<ApiResponse<void>> {
  try {
    const response = await fetch("/api/attendance/regularizations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regularizationId, ...values }),
    });

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to review regularization." };
    }

    return {};
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function breakStart(values: BreakStartInput): Promise<ApiResponse<{ attendance: AttendanceDetail }>> {
  try {
    const response = await fetch("/api/attendance/break-start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to start break." };
    }

    const result = await parseJson<{ attendance: AttendanceDetail }>(response);
    clearTodayAttendanceCache();
    return { data: result };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function breakEnd(values: BreakEndInput): Promise<ApiResponse<{ attendance: AttendanceDetail }>> {
  try {
    const response = await fetch("/api/attendance/break-end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to end break." };
    }

    const result = await parseJson<{ attendance: AttendanceDetail }>(response);
    clearTodayAttendanceCache();
    return { data: result };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}
