"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { MdEventNote, MdCalendarToday, MdInfo } from "react-icons/md";
import { EmployeeLayout } from "@/components/employee";
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
  const [attachment, setAttachment] = useState<File | null>(null);
  const [showSession, setShowSession] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string>("");
  const [showEndDate, setShowEndDate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (watchLeaveTypeId) {
      const type = leaveTypes.find((lt) => lt.id === watchLeaveTypeId);
      setSelectedType(type || null);
    }
  }, [watchLeaveTypeId, leaveTypes]);

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
      const [typesRes, balanceRes, holidayRes, leaveRes] = await Promise.all([
        getLeaveTypes(),
        getLeaveBalances(),
        getHolidays(),
        fetch("/api/leave", { credentials: "include" }).then((r) => r.json()),
      ]);

      const res = typesRes as any;
      const balRes = balanceRes as any;
      const holRes = holidayRes as any;

      // API returns { leaveTypes } directly, not wrapped in data
      const fetchedTypes = res.leaveTypes || res.data?.leaveTypes || [];
      setLeaveTypes(fetchedTypes.filter((lt: LeaveTypeConfig) => lt.isActive));

      const fetchedBalances = balRes.balances || balRes.data?.balances || [];
      setBalances(fetchedBalances);

      const fetchedHolidays = holRes.holidays || holRes.data?.holidays || [];
      setHolidays(fetchedHolidays);

      if (leaveRes.applications) {
        setApplications(leaveRes.applications);
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

  async function handleAttachmentUpload(file: File): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/leave/attachment", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to upload attachment");
      }
      
      const result = await response.json();
      return result.url;
    } catch (error: any) {
      setAttachmentError(error.message || "Failed to upload file");
      return null;
    }
  }

  async function onSubmit(data: CreateLeaveApplicationInput) {
    setSubmitting(true);
    setAttachmentError("");
    try {
      let attachmentUrl: string | undefined;
      
      if (attachment) {
        const url = await handleAttachmentUpload(attachment);
        if (url) {
          attachmentUrl = url;
        } else if (attachmentError) {
          setSubmitting(false);
          return;
        }
      }
      
      const result = await createLeaveApplication({
        leaveTypeId: data.leaveTypeId,
        startDate: data.startDate,
        endDate: data.endDate,
        startSession: data.startSession,
        endSession: data.endSession,
        reason: data.reason,
        attachmentUrl,
      });

      const application = (result as any).application || (result as any).data?.application;

      if (application) {
        toast.success("Leave application submitted successfully!");
        
        const leaveType = leaveTypes.find(lt => lt.id === data.leaveTypeId);
        const appWithType = {
          ...application,
          leaveTypeConfig: leaveType || application.leaveTypeConfig || null
        };
        setApplications(prev => [appWithType, ...prev]);
        
        reset();
        setActiveTab("my");
        setAttachment(null);
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

  function handleAttachmentClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setAttachmentError("File size must be less than 5MB");
        return;
      }
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      if (!allowedTypes.includes(file.type)) {
        setAttachmentError("Invalid file type. Allowed: JPG, PNG, GIF, PDF, DOC");
        return;
      }
      setAttachment(file);
      setAttachmentError("");
    }
  }

  function removeAttachment() {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handlePreview() {
    setSelectedDates({ start: watchStartDate || "", end: watchEndDate || "" });
    setConfirmModal(true);
  }

  const activeLeaveTypes = leaveTypes.filter((lt) => lt.isActive);

  function getLeaveCategory(type: string): "PAID" | "UNPAID" | "UNPLANNED" {
    const paidTypes = ["CASUAL", "SICK", "PRIVILEGE", "MATERNITY", "PATERNITY", "BEREAVEMENT"];
    const unpaidTypes = ["UNPAID"];
    if (paidTypes.includes(type)) return "PAID";
    if (unpaidTypes.includes(type)) return "UNPAID";
    return "UNPLANNED";
  }

  function getCategoryColor(category: string) {
    switch (category) {
      case "PAID": return "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "UNPAID": return "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400";
      case "UNPLANNED": return "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400";
      default: return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
    }
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
          {/* Leave Balance Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Leave Balance</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Unpaid Category */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </span>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Unpaid</span>
                </div>
                <div className="space-y-2 pl-10">
                  {balances.filter(b => getLeaveCategory(leaveTypes.find(lt => lt.id === b.leaveTypeId)?.type || "") === "UNPAID").map(balance => {
                    const type = leaveTypes.find(lt => lt.id === balance.leaveTypeId);
                    const isUnlimited = balance.availableDays === -1;
                    return (
                      <div key={balance.id} className="flex items-center justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">{type?.name || "Leave"}</span>
                        <span className={`text-sm font-semibold ${isUnlimited ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                          {isUnlimited ? "Unlimited" : balance.availableDays}
                        </span>
                      </div>
                    );
                  })}
                  {balances.filter(b => getLeaveCategory(leaveTypes.find(lt => lt.id === b.leaveTypeId)?.type || "") === "UNPAID").length === 0 && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">No unpaid leaves configured</span>
                  )}
                </div>
              </div>

              {/* Vertical Separator */}
              <div className="hidden md:block w-px bg-slate-200 dark:bg-slate-700"></div>

              {/* Paid Category */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </span>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Paid</span>
                </div>
                <div className="space-y-2 pl-10">
                  {balances.filter(b => getLeaveCategory(leaveTypes.find(lt => lt.id === b.leaveTypeId)?.type || "") === "PAID").map(balance => {
                    const type = leaveTypes.find(lt => lt.id === balance.leaveTypeId);
                    const isUnlimited = balance.availableDays === -1;
                    return (
                      <div key={balance.id} className="flex items-center justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">{type?.name || "Leave"}</span>
                        <span className={`text-sm font-semibold ${isUnlimited ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                          {isUnlimited ? "Unlimited" : balance.availableDays}
                        </span>
                      </div>
                    );
                  })}
                  {balances.filter(b => getLeaveCategory(leaveTypes.find(lt => lt.id === b.leaveTypeId)?.type || "") === "PAID").length === 0 && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">No paid leaves configured</span>
                  )}
                </div>
              </div>

              {/* Vertical Separator */}
              <div className="hidden md:block w-px bg-slate-200 dark:bg-slate-700"></div>

              {/* Unplanned Category */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </span>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Unplanned</span>
                </div>
                <div className="space-y-2 pl-10">
                  {balances.filter(b => getLeaveCategory(leaveTypes.find(lt => lt.id === b.leaveTypeId)?.type || "") === "UNPLANNED").map(balance => {
                    const type = leaveTypes.find(lt => lt.id === balance.leaveTypeId);
                    const isUnlimited = balance.availableDays === -1;
                    return (
                      <div key={balance.id} className="flex items-center justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">{type?.name || "Leave"}</span>
                        <span className={`text-sm font-semibold ${isUnlimited ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                          {isUnlimited ? "Unlimited" : balance.availableDays}
                        </span>
                      </div>
                    );
                  })}
                  {balances.filter(b => getLeaveCategory(leaveTypes.find(lt => lt.id === b.leaveTypeId)?.type || "") === "UNPLANNED").length === 0 && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">No unplanned leaves configured</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Leave Balance Cards - Additional Info */}
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
                const isUnlimited = balance.availableDays === -1;
                
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
                      {isUnlimited ? <span className="text-red-600 dark:text-red-400">Unlimited</span> : (
                        <>
                          {balance.availableDays}
                          <span className="text-sm font-normal text-slate-400 ml-1">/ {balance.allocatedDays}</span>
                        </>
                      )}
                    </p>
                    {!isUnlimited && (
                      <>
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
                      </>
                    )}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Leave Type Selection - Floating Label */}
            <div className="relative col-span-1 md:col-span-2">
              <select
                {...register("leaveTypeId")}
                onChange={(e) => {
                  setValue("leaveTypeId", e.target.value);
                  trigger("leaveTypeId");
                }}
                className="peer w-full px-4 pt-6 pb-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition focus:border-indigo-500 dark:focus:border-indigo-500 appearance-none"
              >
                <option value=""></option>
                {activeLeaveTypes.map((type) => {
                  const balance = balances.find((b) => b.leaveTypeId === type.id);
                  return (
                    <option key={type.id} value={type.id}>
                      {type.name} ({balance?.availableDays ?? 0} days available)
                    </option>
                  );
                })}
              </select>
              <label className={`absolute left-4 transition-all pointer-events-none ${
                watchLeaveTypeId 
                  ? "top-2 text-xs text-indigo-600 dark:text-indigo-400" 
                  : "top-4 text-sm text-slate-400"
              } peer-focus:top-2 peer-focus:text-xs peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400`}>
                Leave Type <span className="text-red-500">*</span>
              </label>
            </div>

            {selectedType && (
              <div className="col-span-1 md:col-span-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700">
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

            {/* Date Selection - Floating Label */}
            <div className="relative">
              <input
                type="date"
                {...register("startDate")}
                defaultValue={new Date().toISOString().split("T")[0]}
                min={new Date().toISOString().split("T")[0]}
                className="peer w-full px-4 pt-6 pb-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition focus:border-indigo-500 dark:focus:border-indigo-500"
              />
              <label className={`absolute left-4 transition-all pointer-events-none ${
                watchStartDate 
                  ? "top-2 text-xs text-indigo-600 dark:text-indigo-400" 
                  : "top-4 text-sm text-slate-400"
              } peer-focus:top-2 peer-focus:text-xs peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400`}>
                From Date <span className="text-red-500">*</span>
              </label>
            </div>

            {showEndDate ? (
              <div className="relative">
                <input
                  type="date"
                  {...register("endDate")}
                  min={watchStartDate || new Date().toISOString().split("T")[0]}
                  defaultValue={watchStartDate || new Date().toISOString().split("T")[0]}
                  className="peer w-full px-4 pt-6 pb-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition focus:border-indigo-500 dark:focus:border-indigo-500"
                />
                <label className={`absolute left-4 transition-all pointer-events-none ${
                  watchEndDate 
                    ? "top-2 text-xs text-indigo-600 dark:text-indigo-400" 
                    : "top-4 text-sm text-slate-400"
                } peer-focus:top-2 peer-focus:text-xs peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400`}>
                  To Date <span className="text-red-500">*</span>
                </label>
                <div className="flex justify-end mt-2">
                  <button type="button" onClick={() => setShowEndDate(false)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                    Less than one day?
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-end">
                <button type="button" onClick={() => { setShowEndDate(true); setValue("endDate", watchStartDate || new Date().toISOString().split("T")[0]); }} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                  More than one day?
                </button>
              </div>
            )}

            {/* Session Selection */}
            <div className="relative">
              <select
                {...register("startSession")}
                className="peer w-full px-4 pt-6 pb-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition focus:border-indigo-500 dark:focus:border-indigo-500 appearance-none"
              >
                <option value="FULL_DAY">Full Day</option>
                <option value="FIRST_HALF">First Half</option>
                <option value="SECOND_HALF">Second Half</option>
              </select>
              <label className="absolute left-4 top-4 text-sm text-slate-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400 transition-all pointer-events-none">
                Start Session
              </label>
            </div>

            <div className="relative">
              <select
                {...register("endSession")}
                className="peer w-full px-4 pt-6 pb-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition focus:border-indigo-500 dark:focus:border-indigo-500 appearance-none"
              >
                <option value="FULL_DAY">Full Day</option>
                <option value="FIRST_HALF">First Half</option>
                <option value="SECOND_HALF">Second Half</option>
              </select>
              <label className="absolute left-4 top-4 text-sm text-slate-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400 transition-all pointer-events-none">
                End Session
              </label>
            </div>

            {/* Preview */}
            {previewDays > 0 && (
              <div className={`col-span-1 md:col-span-2 p-4 rounded-xl border ${
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
              <div className="col-span-1 md:col-span-2 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
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

            {/* Reason - Floating Label Textarea */}
            <div className="relative col-span-1 md:col-span-2">
              <textarea
                {...register("reason")}
                rows={4}
                placeholder=" "
                className="peer w-full px-4 pt-6 pb-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition focus:border-indigo-500 dark:focus:border-indigo-500 resize-none"
              />
              <label className="absolute left-4 top-4 text-sm text-slate-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400 transition-all pointer-events-none">
                Reason
              </label>
            </div>

            {/* Add Attachment - Dashed Box */}
            <div className="col-span-1 md:col-span-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-6 text-center hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors cursor-pointer">
              <div className="flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Add Attachment</p>
              </div>
            </div>

            {/* Submit */}
            <div className="col-span-1 md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
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
