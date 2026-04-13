"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { MdEventNote, MdCalendarToday, MdInfo } from "react-icons/md";
import { EmployeeLayout } from "@/components/employee";
import { TextInput } from "@/components/ui/text-input";
import { SelectInput } from "@/components/ui/select-input";
import { FormField } from "@/components/ui/form-field";
import { ToggleField } from "@/components/ui/toggle-field";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/loaders/skeleton";
import {
  type LeaveTypeConfig,
  type LeaveBalance,
  type Holiday,
  type SessionType,
  leaveCategoryLabels,
  sessionTypeLabels,
  getLeaveTypes,
  getLeaveBalances,
  getHolidays,
  createLeaveApplication,
  leaveStatusLabels,
} from "@/lib/client/leave";
import {
  createLeaveApplicationFullSchema,
  type CreateLeaveApplicationInput,
} from "@/lib/validations/leave-full";

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

function isUnpaidLeaveType(type: LeaveTypeConfig): boolean {
  const name = normalizeToken(type.name);
  const code = normalizeToken(type.code);
  const nameTokens = tokenList(type.name);
  const codeTokens = tokenList(type.code);
  return (
    type.type === "UNPAID" ||
    name.includes("unpaid") ||
    code.includes("unpaid") ||
    nameTokens.includes("unpaid") ||
    codeTokens.includes("unpaid") ||
    (nameTokens.includes("un") && nameTokens.includes("paid")) ||
    (codeTokens.includes("un") && codeTokens.includes("paid"))
  );
}

function isUnplannedLeaveType(type: LeaveTypeConfig): boolean {
  const name = normalizeToken(type.name);
  const code = normalizeToken(type.code);
  const nameTokens = tokenList(type.name);
  const codeTokens = tokenList(type.code);
  return (
    name.includes("unplan") ||
    name.includes("unplai") || // handles "unplained"
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

function isPaidLeaveType(type: LeaveTypeConfig): boolean {
  // Avoid matching "unpaid" as paid.
  const nameTokens = tokenList(type.name);
  const codeTokens = tokenList(type.code);
  return (nameTokens.includes("paid") || codeTokens.includes("paid")) && !isUnpaidLeaveType(type);
}

function uniqById<T extends { id: string }>(items: Array<T | null | undefined>): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (!item) continue;
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

function LeaveContent() {
  const [activeTab, setActiveTab] = useState<"my" | "apply">("my");
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeConfig[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<LeaveTypeConfig | null>(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [selectedDates, setSelectedDates] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [previewDays, setPreviewDays] = useState(0);
  const [previewBalance, setPreviewBalance] = useState<number | null>(null);
  const [employmentStatus, setEmploymentStatus] = useState<string | null>(null);
  const [isMultiDay, setIsMultiDay] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
    trigger,
  } = useForm<CreateLeaveApplicationInput>({
    resolver: zodResolver(createLeaveApplicationFullSchema),
    defaultValues: {
      startSession: "FULL_DAY",
      endSession: "FULL_DAY",
    },
  });

  const watchStartDate = watch("startDate");
  const watchEndDate = watch("endDate");
  const watchStartSession = watch("startSession");
  const watchEndSession = watch("endSession");
  const watchLeaveTypeId = watch("leaveTypeId");

  const allowedLeaveTypes = useMemo(() => {
    const active = leaveTypes.filter((lt) => lt.isActive);

    const paid = active.filter(isPaidLeaveType);
    const unpaid = active.filter(isUnpaidLeaveType);
    const unplanned = active.filter(isUnplannedLeaveType);

    const isProbation = employmentStatus === "PROBATION";
    if (isProbation) {
      const filtered = uniqById([...unpaid, ...unplanned]);
      return filtered.length > 0 ? filtered : active;
    }

    const filtered = uniqById([paid[0] ?? null, ...unplanned, ...unpaid]);
    return filtered.length > 0 ? filtered : active;
  }, [leaveTypes, employmentStatus]);

  useEffect(() => {
    if (!watchStartDate) return;
    if (!isMultiDay) {
      setValue("endDate", watchStartDate, { shouldValidate: true, shouldDirty: true });
      return;
    }
    if (watchEndDate && watchEndDate < watchStartDate) {
      setValue("endDate", watchStartDate, { shouldValidate: true, shouldDirty: true });
    }
  }, [isMultiDay, watchStartDate, watchEndDate, setValue]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!watchLeaveTypeId) {
      setSelectedType(null);
      return;
    }
    const type = allowedLeaveTypes.find((lt) => lt.id === watchLeaveTypeId);
    setSelectedType(type || null);
  }, [watchLeaveTypeId, allowedLeaveTypes]);

  useEffect(() => {
    if (!watchLeaveTypeId) return;
    if (allowedLeaveTypes.some((t) => t.id === watchLeaveTypeId)) return;
    setValue("leaveTypeId", "");
    setSelectedType(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedLeaveTypes]);

  useEffect(() => {
    if (watchStartDate && watchEndDate) {
      const days = calculateLeaveDays(watchStartDate, watchEndDate, watchStartSession, watchEndSession);
      setPreviewDays(days);

      if (watchLeaveTypeId) {
        const balance = balances.find((b) => b.leaveTypeId === watchLeaveTypeId);
        setPreviewBalance(balance?.availableDays ?? null);
      }
    } else {
      setPreviewDays(0);
      setPreviewBalance(null);
    }
  }, [watchStartDate, watchEndDate, watchStartSession, watchEndSession, watchLeaveTypeId, balances]);

  async function fetchData() {
    setLoading(true);
    try {
      const [typesRes, balanceRes, holidayRes, leaveRes, profileRes] = await Promise.allSettled([
        getLeaveTypes(),
        getLeaveBalances(),
        getHolidays(),
        fetch("/api/leave", { credentials: "include" }).then((r) => r.json()),
        fetch("/api/employees/me", { credentials: "include" }).then((r) => r.json()),
      ]);

      if (typesRes.status === "fulfilled") {
        const res = typesRes.value as any;
        const fetchedTypes = res.leaveTypes || res.data?.leaveTypes || [];
        setLeaveTypes(fetchedTypes.filter((lt: LeaveTypeConfig) => lt.isActive));
      }

      if (balanceRes.status === "fulfilled") {
        const balRes = balanceRes.value as any;
        const fetchedBalances = balRes.balances || balRes.data?.balances || [];        
        setBalances(fetchedBalances);
      }

      if (holidayRes.status === "fulfilled") {
        const holRes = holidayRes.value as any;
        const fetchedHolidays = holRes.holidays || holRes.data?.holidays || [];
        setHolidays(fetchedHolidays);
      }

      if (leaveRes.status === "fulfilled") {
        const leaveJson = leaveRes.value as any;
        if (leaveJson?.applications) setApplications(leaveJson.applications);
      }

      if (profileRes.status === "fulfilled") {
        const prof = profileRes.value as any;
        const status = prof?.employee?.employmentStatus ?? null;
        setEmploymentStatus(typeof status === "string" ? status : null);
      }
    } catch {
      toast.error("Failed to fetch leave data");
    } finally {
      setLoading(false);
    }
  }

  function calculateLeaveDays(
    start: string,
    end: string,
    startSession: SessionType,
    endSession: SessionType,
    holidaysList: Holiday[] = holidays
  ): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    let days = 0;
    const holidayDates = new Set(holidaysList.map((h) => h.date.split("T")[0]));

    const current = new Date(startDate);
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      const dateStr = current.toISOString().split("T")[0];

      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.has(dateStr)) {
        if (current.getTime() === startDate.getTime() && current.getTime() === endDate.getTime()) {
          days += startSession === "FULL_DAY" ? 1 : 0.5;
        } else if (current.getTime() === startDate.getTime()) {
          days += startSession === "FULL_DAY" ? 1 : 0.5;
        } else if (current.getTime() === endDate.getTime()) {
          days += endSession === "FULL_DAY" ? 1 : 0.5;
        } else {
          days += 1;
        }
      }
      current.setDate(current.getDate() + 1);
    }

    return days;
  }

  function isHoliday(date: string): boolean {
    return holidays.some((h) => h.date.split("T")[0] === date);
  }

  function isWeekend(date: string): boolean {
    const d = new Date(date);
    const day = d.getDay();
    return day === 0 || day === 6;
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "PENDING":
        return "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20";
      case "APPROVED":
        return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20";
      case "REJECTED":
        return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20";
      case "CANCELLED":
        return "text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-900/20";
      default:
        return "text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-900/20";
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  async function onSubmit(data: CreateLeaveApplicationInput) {
    setSubmitting(true);
    try {
      const result = await createLeaveApplication({
        leaveTypeId: data.leaveTypeId,
        startDate: data.startDate,
        endDate: data.endDate,
        startSession: data.startSession,
        endSession: data.endSession,
        reason: data.reason,
      });

      // API returns { application } directly, not wrapped in data
      const application = (result as any).application || (result as any).data?.application;

      if (application) {
        toast.success("Leave application submitted successfully!");
        
        // Add new application to list immediately
        const leaveType = leaveTypes.find(lt => lt.id === data.leaveTypeId);
        const appWithType = {
          ...application,
          leaveTypeConfig: leaveType || application.leaveTypeConfig || null
        };
        setApplications(prev => [appWithType, ...prev]);
        
        // Reset form
        reset();
        setActiveTab("my");
        
        // Refresh balances
        fetchData();
      } else {
        toast.error((result as any).error || (result as any).message || "Failed to submit leave application");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit leave application");
    } finally {
      setSubmitting(false);
    }
  }

  function handlePreview() {
    setSelectedDates({ start: watchStartDate || "", end: watchEndDate || watchStartDate || "" });
    setConfirmModal(true);
  }

return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => setActiveTab("my")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "my"
              ? "bg-indigo-600 text-white"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
          }`}
        >
          My Leaves
        </button>
        <button
          onClick={() => setActiveTab("apply")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "apply"
              ? "bg-indigo-600 text-white"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
          }`}
        >
          Apply for Leave
        </button>
      </div>

      {activeTab === "my" && (
        <>
          {/* Leave Balance Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))
            ) : balances.length === 0 ? (
              <div className="col-span-full p-8 text-center text-slate-500 dark:text-slate-400">
                No leave balances configured
              </div>
            ) : (
              balances.map((balance) => {
                const type = leaveTypes.find((lt) => lt.id === balance.leaveTypeId);
                const usedPercentage = balance.allocatedDays > 0 
                  ? (balance.usedDays / balance.allocatedDays) * 100 
                  : 0;
                
                return (
                  <div
                    key={balance.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {type?.name || "Leave"}
                      </p>
                      {balance.pendingDays > 0 && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                          {balance.pendingDays} pending
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {balance.availableDays}
                      <span className="text-sm font-normal text-slate-400 ml-1">/ {balance.allocatedDays}</span>
                    </p>
                    <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(usedPercentage, 100)}%`,
                          backgroundColor: usedPercentage > 80 ? "#ef4444" : usedPercentage > 50 ? "#f59e0b" : "#22c55e",
                        }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {balance.usedDays} used
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Leave History */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-semibold text-slate-900 dark:text-white">Leave History</h2>
            </div>
            {loading ? (
              <div className="p-8 text-center">
                <Skeleton className="h-48 w-full" />
              </div>
            ) : applications.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                  <MdEventNote className="text-2xl text-slate-400" />
                </div>
                <p className="text-slate-600 dark:text-slate-300 font-medium">No Leave Records</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                  Your leave history will appear here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {applications.map((app) => (
                  <div key={app.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-slate-900 dark:text-white">
                            {app.leaveTypeConfig?.name || app.leaveType || "Leave"}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                            {leaveStatusLabels[app.status as keyof typeof leaveStatusLabels] || app.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {formatDate(app.startDate)} - {formatDate(app.endDate)}
                          {app.totalDays && ` • ${app.totalDays} day${app.totalDays !== 1 ? "s" : ""}`}
                        </p>
                        {app.reason && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">
                            {app.reason}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Applied {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "apply" && (
        <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <MdEventNote className="text-xl text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Apply for Leave</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Submit a new leave request</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Leave Type Selection */}
            <FormField label="Leave Type" required error={errors.leaveTypeId?.message}>
              <SelectInput
                {...register("leaveTypeId")}
                disabled={loading || allowedLeaveTypes.length === 0}
                onChange={(e) => {
                  setValue("leaveTypeId", e.target.value);
                  trigger("leaveTypeId");
                }}
              >
                <option value="">
                  {loading
                    ? "Loading leave types..."
                    : allowedLeaveTypes.length === 0
                      ? "No leave types configured"
                      : "Select leave type"}
                </option>
                {!loading &&
                  allowedLeaveTypes.map((type) => {
                    const balance = balances.find((b) => b.leaveTypeId === type.id);
                    return (
                      <option key={type.id} value={type.id}>
                        {type.name} ({balance?.availableDays ?? 0} days available)
                      </option>
                    );
                  })}
              </SelectInput>
            </FormField>

            {selectedType && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <MdInfo className="text-indigo-500" />
                  <span className="font-medium">{selectedType.name}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-500 dark:text-slate-400">
                  {selectedType.maxConsecutive > 0 && (
                    <span>Max {selectedType.maxConsecutive} consecutive days</span>
                  )}
                  {selectedType.minNoticeDays > 0 && (
                    <span>{selectedType.minNoticeDays} days notice required</span>
                  )}
                  {selectedType.canApplyHalfDay && <span>Half day allowed</span>}
                  {selectedType.allowCarryForward && <span>Can carry forward</span>}
                </div>
              </div>
            )}

            {/* Date Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="From Date" required error={errors.startDate?.message}>
                <TextInput
                  type="date"
                  {...register("startDate")}
                  min={new Date().toISOString().split("T")[0]}
                />
              </FormField>

              {isMultiDay ? (
                <FormField label="To Date" required error={errors.endDate?.message}>
                  <TextInput
                    type="date"
                    {...register("endDate")}
                    min={watchStartDate || new Date().toISOString().split("T")[0]}
                  />
                </FormField>
              ) : (
                <input type="hidden" {...register("endDate")} />
              )}
            </div>

            <ToggleField
              checked={isMultiDay}
              onChange={setIsMultiDay}
              label="Multiple days?"
              description="Turn on to select a To Date. Otherwise this is treated as a 1-day leave."
            />

            {/* Session Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Start Session">
                <SelectInput {...register("startSession")}>
                  <option value="FULL_DAY">Full Day</option>
                  <option value="FIRST_HALF">First Half</option>
                  <option value="SECOND_HALF">Second Half</option>
                </SelectInput>
              </FormField>

              {/* <FormField label="End Session">
                <SelectInput {...register("endSession")}>
                  <option value="FULL_DAY">Full Day</option>
                  <option value="FIRST_HALF">First Half</option>
                  <option value="SECOND_HALF">Second Half</option>
                </SelectInput>
              </FormField> */}
            </div>

            {/* Preview */}
            {previewDays > 0 && (
              <div className={`p-4 rounded-xl border ${
                previewBalance !== null && previewDays > previewBalance
                  ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${
                      previewBalance !== null && previewDays > previewBalance
                        ? "text-red-700 dark:text-red-300"
                        : "text-green-700 dark:text-green-300"
                    }`}>
                      Leave Duration Preview
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${
                      previewBalance !== null && previewDays > previewBalance
                        ? "text-red-600 dark:text-red-400"
                        : "text-green-600 dark:text-green-400"
                    }`}>
                      {previewDays} day{previewDays !== 1 ? "s" : ""}
                    </p>
                  </div>
                  {previewBalance !== null && (
                    <div className="text-right">
                      <p className="text-sm text-slate-500 dark:text-slate-400">Available Balance</p>
                      <p className={`text-xl font-bold ${
                        previewDays > previewBalance
                          ? "text-red-600 dark:text-red-400"
                          : "text-slate-900 dark:text-white"
                      }`}>
                        {previewBalance} days
                      </p>
                      {previewDays > previewBalance && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          Exceeds available balance
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Holidays Notice */}
            {watchStartDate && watchEndDate && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                  <MdCalendarToday className="inline mr-2" />
                  Holidays & Weekends
                </p>
                <div className="space-y-1 text-xs text-amber-700 dark:text-amber-300">
                  {(() => {
                    const start = new Date(watchStartDate);
                    const end = new Date(watchEndDate);
                    const excluded: string[] = [];
                    const current = new Date(start);

                    while (current <= end) {
                      const dateStr = current.toISOString().split("T")[0];
                      const holiday = holidays.find((h) => h.date.split("T")[0] === dateStr);
                      if (holiday) {
                        excluded.push(`${holiday.name} (${dateStr})`);
                      } else if (current.getDay() === 0 || current.getDay() === 6) {
                        excluded.push(`Weekend (${dateStr})`);
                      }
                      current.setDate(current.getDate() + 1);
                    }

                    return excluded.length > 0 ? (
                      <p>{excluded.length} day(s) excluded: {excluded.join(", ")}</p>
                    ) : (
                      <p>No holidays or weekends in selected range</p>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Reason */}
            <FormField label="Reason" hint="Optional - provide a reason for your leave">
              <textarea
                {...register("reason")}
                rows={3}
                placeholder="Enter reason for leave..."
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none transition placeholder:text-slate-400"
              />
            </FormField>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab("my")}
                className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || (previewBalance !== null && previewDays > previewBalance)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </div>
        </form>
      )}
    </>
  );
}

export default function LeavePage() {
  return (
    <EmployeeLayout title="My Leave" subtitle="Manage your leave requests">
      <Suspense fallback={
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      }>
        <LeaveContent />
      </Suspense>
    </EmployeeLayout>
  );
}
