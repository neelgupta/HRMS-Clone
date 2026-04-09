"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { MdEventNote, MdCalendarToday, MdInfo, MdChevronLeft, MdChevronRight, MdHistory } from "react-icons/md";
import { EmployeeLayout } from "@/components/employee";
import { Skeleton } from "@/components/ui/loaders/skeleton";
import { Modal } from "@/components/ui/modal";
import {
  type LeaveTypeConfig,
  type LeaveBalance,
  type Holiday,
  leaveCategoryLabels,
  getLeaveTypes,
  getLeaveBalances,
  getHolidays,
  createLeaveApplication,
  cancelLeaveApplication,
  leaveStatusLabels,
} from "@/lib/client/leave";
import {
  createLeaveApplicationFullSchema,
  type CreateLeaveApplicationInput,
} from "@/lib/validations/leave-full";

function getLeaveCategory(type: string): string {
  const paidTypes = ["CASUAL", "SICK", "PRIVILEGE", "MATERNITY", "PATERNITY", "BEREAVEMENT", "COMP_OFF"];
  const unplannedTypes = ["UNPAID"];
  if (unplannedTypes.includes(type)) return "UNPLANNED";
  if (paidTypes.includes(type)) return "PAID";
  return "UNPAID";
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
  const [previewDays, setPreviewDays] = useState(0);
  const [previewBalance, setPreviewBalance] = useState<number | null>(null);
  const [showEndDate, setShowEndDate] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date());
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [cancelModal, setCancelModal] = useState<{ appId: string; app: any } | null>(null);

  const activeLeaveTypes = leaveTypes.filter((lt) => lt.isActive);

  const calDays = (() => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];
    const startDay = firstDay.getDay();
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add all days of the current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    // Add empty cells for remaining days to complete the grid (5 weeks = 35 cells)
    const remaining = 35 - days.length;
    for (let i = 0; i < remaining; i++) {
      days.push(null);
    }
    
    return days;
  })();

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
  });

  const watchStartDate = watch("startDate");
  const watchEndDate = watch("endDate");
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
      const days = calculateLeaveDays(watchStartDate, watchEndDate, holidays);
      const halfDayAdjustment = isHalfDay ? 0.5 : 0;
      setPreviewDays(Math.max(0.5, days - halfDayAdjustment));

      if (watchLeaveTypeId) {
        const balance = balances.find((b) => b.leaveTypeId === watchLeaveTypeId);
        setPreviewBalance(balance?.availableDays ?? null);
      }
    } else if (watchStartDate && isHalfDay) {
      setPreviewDays(0.5);
      if (watchLeaveTypeId) {
        const balance = balances.find((b) => b.leaveTypeId === watchLeaveTypeId);
        setPreviewBalance(balance?.availableDays ?? null);
      }
    } else if (watchStartDate && isHalfDay) {
      setPreviewDays(0.5);
      if (watchLeaveTypeId) {
        const balance = balances.find((b) => b.leaveTypeId === watchLeaveTypeId);
        setPreviewBalance(balance?.availableDays ?? null);
      }
    } else {
      setPreviewDays(0);
      setPreviewBalance(null);
    }
  }, [watchStartDate, watchEndDate, watchLeaveTypeId, balances, isHalfDay]);

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
        days += 1;
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
        endDate: data.endDate || data.startDate,
        reason: data.reason,
        isHalfDay,
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
        setIsHalfDay(false);
        setShowEndDate(false);
        setActiveTab("my");
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

  async function handleCancelLeave() {
    if (!cancelModal) return;
    
    try {
      const result = await cancelLeaveApplication(cancelModal.appId);
      const cancelled = (result as any).application || (result as any).data?.application;
      
      if (cancelled) {
        toast.success("Leave application cancelled successfully!");
        setCancelModal(null);
        fetchData();
      } else {
        toast.error((result as any).error || (result as any).message || "Failed to cancel leave application");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel leave application");
    }
  }

  function openCancelModal(app: any) {
    setCancelModal({ appId: app.id, app });
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

          {/* Leave History - Top */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden mb-6">
<div className="bg-gradient-to-r from-[#1f2b40] to-[#2c3e50]">              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <MdHistory className="text-white text-lg" />
                  </div>
                  <div>
                    <h2 className="font-bold text-xl">Leave History</h2>
                    <p className="text-purple-100 text-sm">View your past and current leave requests</p>
                  </div>
                </div>
                <div className="text-sm font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  {applications.length} {applications.length === 1 ? 'Request' : 'Requests'}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <select className="w-full px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option>All Types</option>
                    {leaveTypes.filter(t => t.isActive).map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <select className="w-full px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option>All Status</option>
                    <option>Approved</option>
                    <option>Pending</option>
                    <option>Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Leave Type</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Duration</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Applied On</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500 dark:text-slate-400">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                            <MdHistory className="text-2xl text-slate-400 dark:text-slate-500" />
                          </div>
                          <div>
                            <span className="text-lg font-medium text-slate-600 dark:text-slate-300">No leave history found</span>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your leave requests will appear here</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    applications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            {new Date(app.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {app.startDate !== app.endDate && (
                              <div className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                                to {new Date(app.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm font-medium text-slate-900 dark:text-white">{app.leaveTypeConfig?.name || 'Leave'}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900 dark:text-white">{app.duration} {app.duration === 1 ? 'day' : 'days'}</span>
                            {app.isHalfDay && <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">Half Day</span>}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
                            app.status === 'APPROVED' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-green-200 dark:border-green-800/30' : 
                            app.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/30' :
                            'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800/30'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${app.status === 'APPROVED' ? 'bg-green-500' : app.status === 'PENDING' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                            {app.status}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-slate-900 dark:text-white">
                            {new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <button className="px-3 py-1 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors">View</button>
                            {app.status === 'PENDING' && (
                              <button 
                                onClick={() => openCancelModal(app)}
                                className="px-3 py-1 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Main Content Grid - Calendar & Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            
            {/* Calendar Section */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
                {/* Calendar Header */}
<div className="bg-gradient-to-r from-[#1f2b40] to-[#2c3e50]">                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <MdCalendarToday className="text-white text-lg" />
                      </div>
                      <div>
                        <h2 className="font-bold text-xl">Leave Calendar</h2>
                        <p className="text-indigo-100 text-sm">Track your leave schedule</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setCalMonth(new Date())}
                        className="px-4 py-2 text-sm font-medium text-white bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors duration-150 border border-white/30"
                        title="Go to today"
                      >
                        Today
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Calendar Navigation */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center justify-center">
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-700 rounded-lg p-1 shadow-sm">
                      <button 
                        onClick={() => { setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1)); }}
                        className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors duration-150 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                        title="Previous month"
                      >
                        <MdChevronLeft className="text-lg" />
                      </button>
                      <div className="px-4 py-2 min-w-[120px] text-center">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          {calMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      <button 
                        onClick={() => { setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1)); }}
                        className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors duration-150 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                        title="Next month"
                      >
                        <MdChevronRight className="text-lg" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Calendar Grid */}
                <div className="p-6">
                  <div className="grid grid-cols-7 gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <div key={d} className="text-center text-xs font-bold text-slate-600 dark:text-slate-400 py-3 px-2 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                        {d}
                      </div>
                    ))}
                    {calDays.map((day, i) => {
                      // Handle empty cells (null values)
                      if (!day) {
                        return (
                          <div 
                            key={i} 
                            className="min-h-[80px] p-2 rounded-xl border border-dashed border-slate-200/30 dark:border-slate-600/20 bg-slate-50/50 dark:bg-slate-800/20"
                          >
                          </div>
                        );
                      }
                      
                      // Now we know day is not null, so we can safely access its properties
                      const dateStr = day.toISOString().split('T')[0];
                      const leaveApps = applications.filter(a => {
                        const start = new Date(a.startDate).toISOString().split('T')[0];
                        const end = new Date(a.endDate).toISOString().split('T')[0];
                        return dateStr >= start && dateStr <= end;
                      });
                      const isToday = dateStr === new Date().toISOString().split('T')[0];
                      const isHoliday = holidays.some(h => h.date.split('T')[0] === dateStr);
                      
                      return (
                        <div 
                          key={i} 
                          className={`group relative min-h-[80px] p-2 rounded-xl border transition-all duration-200 hover:shadow-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 ${
                            isToday ? 'ring-2 ring-indigo-500 shadow-md shadow-indigo-100 dark:shadow-indigo-900/30' : ''
                          }`}
                        >
                          <div className={`flex items-start justify-between mb-1 ${
                            isToday ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300 font-semibold'
                          }`}>
                            <span className="text-sm">{day.getDate()}</span>
                            {isToday && (
                              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            {isHoliday && (
                              <div className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md px-1.5 py-0.5 border border-red-200 dark:border-red-800/30">
                                <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                                Holiday
                              </div>
                            )}
                            
                            {leaveApps.slice(0, 2).map(app => (
                              <div 
                                key={app.id} 
                                className={`inline-flex items-center gap-1 text-[10px] font-bold rounded-md px-1.5 py-0.5 border truncate max-w-full transition-all duration-150 hover:scale-105 ${
                                  app.status === 'APPROVED' 
                                    ? 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40 border-green-200 dark:border-green-800/30 hover:bg-green-200 dark:hover:bg-green-900/60' 
                                    : app.status === 'PENDING' 
                                    ? 'text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/40 border-yellow-200 dark:border-yellow-800/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/60'
                                    : 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 border-red-200 dark:border-red-800/30 hover:bg-red-200 dark:hover:bg-red-900/60'
                                }`}
                                title={`${app.leaveTypeConfig?.name || 'Leave'} - ${app.status}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                  app.status === 'APPROVED' ? 'bg-green-500' :
                                  app.status === 'PENDING' ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}></span>
                                <span className="truncate">{app.leaveTypeConfig?.name || 'Leave'}</span>
                              </div>
                            ))}
                            
                            {leaveApps.length > 2 && (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold bg-slate-100 dark:bg-slate-700/30 rounded-md px-1.5 py-0.5 border border-slate-200 dark:border-slate-600/30">
                                +{leaveApps.length - 2} more
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sidebar - Takes 1 column on large screens */}
            <div className="lg:col-span-1 space-y-6">
              {/* Quick Stats */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Available</span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {balances.reduce((sum, b) => sum + (b.availableDays > 0 ? b.availableDays : 0), 0)} days
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Used</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {balances.reduce((sum, b) => sum + b.usedDays, 0)} days
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Pending</span>
                    <span className="font-bold text-yellow-600 dark:text-yellow-400">
                      {balances.reduce((sum, b) => sum + b.pendingDays, 0)} days
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Upcoming Holidays */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4">Upcoming Holidays</h3>
                <div className="space-y-3">
                  {holidays.slice(0, 3).map((holiday, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {holiday.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(holiday.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {holidays.length === 0 && (
                    <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                      No upcoming holidays
                    </div>
                  )}
                </div>
              </div>
            </div>
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
                {leaveTypes.filter(t => t.isActive).map((type) => {
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

            {/* Half Day Toggle */}
            <div className="col-span-1 md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <div 
                  onClick={() => setIsHalfDay(!isHalfDay)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${isHalfDay ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isHalfDay ? "left-7" : "left-1"}`}></div>
                </div>
                <span className="text-sm text-slate-700 dark:text-slate-200">Half Day Leave</span>
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

      {/* Cancel Confirmation Modal */}
      {cancelModal && (
        <Modal
          open={!!cancelModal}
          onClose={() => setCancelModal(null)}
          title="Cancel Leave Application"
          size="sm"
        >
          <div className="p-6">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-center text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to cancel this leave application? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setCancelModal(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                No, Keep It
              </button>
              <button
                onClick={handleCancelLeave}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </Modal>
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
