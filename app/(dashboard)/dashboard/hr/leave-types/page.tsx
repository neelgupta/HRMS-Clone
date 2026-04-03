"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { 
  HiOutlinePlus, 
  HiOutlinePencil, 
  HiOutlineTrash, 
  HiOutlineCheck, 
  HiOutlineX,
  HiOutlineCalendar,
  HiOutlineRefresh,
  HiOutlineCurrencyRupee,
  HiOutlineUserGroup,
  HiOutlineClock,
  HiOutlineFilter,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineSparkles,
  HiOutlineViewList
} from "react-icons/hi";
import { TextInput } from "@/components/ui/text-input";
import { SelectInput } from "@/components/ui/select-input";
import { FormField } from "@/components/ui/form-field";
import { ToggleField } from "@/components/ui/toggle-field";
import { Skeleton } from "@/components/ui/loaders/skeleton";
import { Modal } from "@/components/ui/modal";
import type { LeaveTypeConfig, LeaveCategory } from "@/lib/client/leave";
import { leaveCategoryLabels } from "@/lib/client/leave";

const STANDARD_LEAVE_TYPES = [
  {
    name: "Casual Leave",
    code: "CL",
    type: "CASUAL" as LeaveCategory,
    annualDays: 12,
    description: "Short absences for personal reasons",
    emoji: "☀️",
    color: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400" }
  },
  {
    name: "Sick Leave",
    code: "SL",
    type: "SICK" as LeaveCategory,
    annualDays: 10,
    description: "Medical leave for illness or medical appointments",
    emoji: "🏥",
    color: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400" }
  },
  {
    name: "Earned Leave",
    code: "EL",
    type: "PRIVILEGE" as LeaveCategory,
    annualDays: 15,
    description: "Vacation/privilege leave earned over time",
    emoji: "⭐",
    color: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400" },
    allowCarryForward: true,
    maxCarryForward: 5,
    allowEncashment: true,
    maxEncashDays: 10
  },
  {
    name: "Maternity Leave",
    code: "ML",
    type: "MATERNITY" as LeaveCategory,
    annualDays: 180,
    description: "Leave for childbirth and newborn care",
    emoji: "👶",
    color: { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-600 dark:text-pink-400" },
    genderSpecific: "FEMALE" as const,
    canApplyHalfDay: false
  },
  {
    name: "Paternity Leave",
    code: "PL",
    type: "PATERNITY" as LeaveCategory,
    annualDays: 15,
    description: "Leave for new fathers",
    emoji: "👔",
    color: { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-600 dark:text-indigo-400" },
    genderSpecific: "MALE" as const
  },
  {
    name: "Bereavement Leave",
    code: "BL",
    type: "BEREAVEMENT" as LeaveCategory,
    annualDays: 5,
    description: "Leave for family loss/funeral attendance",
    emoji: "🕯️",
    color: { bg: "bg-slate-100 dark:bg-slate-700", text: "text-slate-600 dark:text-slate-400" }
  },
  {
    name: "Unpaid Leave",
    code: "UL",
    type: "UNPAID" as LeaveCategory,
    annualDays: 30,
    description: "Leave without pay for extended absences",
    emoji: "📋",
    color: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-600 dark:text-amber-400" },
    allowCarryForward: false
  },
  {
    name: "Compensatory Off",
    code: "CO",
    type: "COMP_OFF" as LeaveCategory,
    annualDays: 0,
    description: "Time off in lieu of working on holidays/weekends",
    emoji: "🔄",
    color: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-600 dark:text-green-400" }
  }
];

interface LeaveTypeFormData {
  name: string;
  code: string;
  type: LeaveCategory;
  annualDays: number;
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

const defaultFormData: LeaveTypeFormData = {
  name: "",
  code: "",
  type: "CASUAL",
  annualDays: 12,
  accrualType: "YEARLY",
  accrualRate: 0,
  maxConsecutive: 5,
  minNoticeDays: 3,
  canApplyHalfDay: true,
  maxHalfDaysPerYear: 6,
  genderSpecific: null,
  allowCarryForward: false,
  maxCarryForward: 0,
  allowEncashment: false,
  maxEncashDays: 0,
  expiryDays: 0,
  sortOrder: 0,
};

const leaveTypeColors: Record<string, { bg: string; text: string; icon: string }> = {
  CASUAL: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", icon: "☀️" },
  SICK: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400", icon: "🏥" },
  PRIVILEGE: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400", icon: "⭐" },
  MATERNITY: { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-600 dark:text-pink-400", icon: "👶" },
  PATERNITY: { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-600 dark:text-indigo-400", icon: "👔" },
  BEREAVEMENT: { bg: "bg-slate-100 dark:bg-slate-700", text: "text-slate-600 dark:text-slate-400", icon: "🕯️" },
  UNPAID: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-600 dark:text-amber-400", icon: "📋" },
  COMP_OFF: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-600 dark:text-green-400", icon: "🔄" },
  WORK_FROM_HOME: { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-600 dark:text-cyan-400", icon: "🏠" },
};

function LeaveTypeIcon({ type }: { type: string }) {
  const config = leaveTypeColors[type] || leaveTypeColors.CASUAL;
  return (
    <div className={`w-12 h-12 rounded-2xl ${config.bg} flex items-center justify-center text-xl`}>
      {config.icon}
    </div>
  );
}

function FeatureBadge({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50">
      <Icon className="text-sm text-slate-400" />
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{value}</p>
      </div>
    </div>
  );
}

export default function LeaveTypesPage() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<LeaveTypeFormData>(defaultFormData);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [quickSetupOpen, setQuickSetupOpen] = useState(false);
  const [selectedStandardTypes, setSelectedStandardTypes] = useState<number[]>([0, 1, 2, 7]);
  const [setupSubmitting, setSetupSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    accrual: false,
    restrictions: false,
    advanced: false,
  });

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  async function fetchLeaveTypes() {
    setLoading(true);
    try {
      const res = await fetch("/api/leave/types", { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setLeaveTypes(data.leaveTypes || []);
      }
    } catch {
      toast.error("Failed to fetch leave types");
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setFormData(defaultFormData);
    setEditingId(null);
    setExpandedSections({ basic: true, accrual: false, restrictions: false, advanced: false });
    setModalOpen(true);
  }

  function openEditModal(lt: LeaveTypeConfig) {
    setFormData({
      name: lt.name,
      code: lt.code,
      type: lt.type,
      annualDays: lt.annualDays,
      accrualType: lt.accrualType,
      accrualRate: lt.accrualRate,
      maxConsecutive: lt.maxConsecutive,
      minNoticeDays: lt.minNoticeDays,
      canApplyHalfDay: lt.canApplyHalfDay,
      maxHalfDaysPerYear: lt.maxHalfDaysPerYear,
      genderSpecific: lt.genderSpecific,
      allowCarryForward: lt.allowCarryForward,
      maxCarryForward: lt.maxCarryForward,
      allowEncashment: lt.allowEncashment,
      maxEncashDays: lt.maxEncashDays,
      expiryDays: lt.expiryDays,
      sortOrder: lt.sortOrder,
    });
    setEditingId(lt.id);
    setExpandedSections({ basic: true, accrual: false, restrictions: false, advanced: false });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingId ? `/api/leave/types/${editingId}` : "/api/leave/types";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (res.ok) {
        toast.success(editingId ? "Leave type updated successfully" : "Leave type created successfully");
        setModalOpen(false);
        fetchLeaveTypes();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to save");
      }
    } catch {
      toast.error("Failed to save leave type");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/leave/types/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        toast.success("Leave type deleted");
        setDeleteConfirm(null);
        fetchLeaveTypes();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete leave type");
    }
  }

  async function handleToggleActive(lt: LeaveTypeConfig) {
    try {
      const res = await fetch(`/api/leave/types/${lt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !lt.isActive }),
        credentials: "include",
      });

      if (res.ok) {
        toast.success(`Leave type ${lt.isActive ? "deactivated" : "activated"}`);
        fetchLeaveTypes();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to update");
      }
    } catch {
      toast.error("Failed to update status");
    }
  }

  function toggleSection(section: keyof typeof expandedSections) {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }

  function toggleStandardType(index: number) {
    setSelectedStandardTypes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }

  async function handleQuickSetup() {
    setSetupSubmitting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const index of selectedStandardTypes) {
      const template = STANDARD_LEAVE_TYPES[index];
      try {
        const res = await fetch("/api/leave/types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: template.name,
            code: template.code,
            type: template.type,
            annualDays: template.annualDays,
            accrualType: "YEARLY",
            accrualRate: 0,
            maxConsecutive: template.annualDays > 30 ? template.annualDays : 10,
            minNoticeDays: 3,
            canApplyHalfDay: template.canApplyHalfDay !== false,
            maxHalfDaysPerYear: 6,
            genderSpecific: template.genderSpecific || null,
            allowCarryForward: template.allowCarryForward || false,
            maxCarryForward: template.maxCarryForward || 0,
            allowEncashment: template.allowEncashment || false,
            maxEncashDays: template.maxEncashDays || 0,
            expiryDays: 0,
            sortOrder: index,
          }),
          credentials: "include",
        });

        if (res.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`Created ${successCount} leave type${successCount > 1 ? "s" : ""}`);
      setQuickSetupOpen(false);
      fetchLeaveTypes();
    }
    if (errorCount > 0) {
      toast.error(`Failed to create ${errorCount} leave type${errorCount > 1 ? "s" : ""}`);
    }
    setSetupSubmitting(false);
  }

  const activeTypes = leaveTypes.filter((lt) => lt.isActive);
  const inactiveTypes = leaveTypes.filter((lt) => !lt.isActive);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <HiOutlineCalendar className="text-xl text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Leave Types</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 ml-13">
            Configure and manage leave types for your organization
          </p>
        </div>
        <button
          onClick={() => setQuickSetupOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium transition-all"
        >
          <HiOutlineSparkles className="text-lg text-amber-500" />
          Quick Setup
        </button>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30"
        >
          <HiOutlinePlus className="text-lg" />
          Create Leave Type
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Types</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{leaveTypes.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Active</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{activeTypes.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Inactive</p>
          <p className="text-2xl font-bold text-slate-400 mt-1">{inactiveTypes.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Days/Year</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {activeTypes.reduce((sum, lt) => sum + lt.annualDays, 0)}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 w-full rounded-2xl" />
          ))}
        </div>
      ) : leaveTypes.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
            <HiOutlineCalendar className="text-3xl text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Leave Types Yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
            Get started by creating your first leave type. Common examples include Casual Leave, Sick Leave, and Privilege Leave.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <HiOutlinePlus className="text-lg" />
            Create Your First Leave Type
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTypes.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Active Leave Types ({activeTypes.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {activeTypes.map((lt) => (
                  <div
                    key={lt.id}
                    className="group rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300"
                  >
                    {/* Header */}
                    <div className="p-5 border-b border-slate-100 dark:border-slate-700">
                      <div className="flex items-start gap-4">
                        <LeaveTypeIcon type={lt.type} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-slate-900 dark:text-white truncate">{lt.name}</h3>
                            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              Active
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {lt.code} • {leaveCategoryLabels[lt.type] || lt.type}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="p-5 bg-slate-50/50 dark:bg-slate-800/50">
                      <div className="grid grid-cols-3 gap-2">
                        <FeatureBadge 
                          icon={HiOutlineCalendar} 
                          label="Annual" 
                          value={`${lt.annualDays} days`} 
                        />
                        <FeatureBadge 
                          icon={HiOutlineClock} 
                          label="Notice" 
                          value={`${lt.minNoticeDays}d`} 
                        />
                        <FeatureBadge 
                          icon={lt.accrualType === "MONTHLY" ? HiOutlineRefresh : HiOutlineCalendar} 
                          label="Accrual" 
                          value={lt.accrualType === "MONTHLY" ? `${lt.accrualRate}/mo` : "Yearly"} 
                        />
                      </div>
                    </div>

                    {/* Features */}
                    <div className="p-4 flex flex-wrap gap-2">
                      {lt.canApplyHalfDay && (
                        <span className="px-2 py-1 text-xs rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                          Half Day
                        </span>
                      )}
                      {lt.allowCarryForward && (
                        <span className="px-2 py-1 text-xs rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                          Carry Forward
                        </span>
                      )}
                      {lt.allowEncashment && (
                        <span className="px-2 py-1 text-xs rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                          Encashment
                        </span>
                      )}
                      {lt.genderSpecific && (
                        <span className="px-2 py-1 text-xs rounded-lg bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400">
                          {lt.genderSpecific === "MALE" ? "Male Only" : "Female Only"}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="px-4 pb-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(lt)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      >
                        <HiOutlinePencil className="text-sm" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(lt)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                      >
                        Deactivate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {inactiveTypes.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Inactive Leave Types ({inactiveTypes.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {inactiveTypes.map((lt) => (
                  <div
                    key={lt.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 overflow-hidden opacity-60"
                  >
                    <div className="p-5 border-b border-slate-200 dark:border-slate-700">
                      <div className="flex items-start gap-4">
                        <LeaveTypeIcon type={lt.type} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-slate-600 dark:text-slate-300">{lt.name}</h3>
                            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                              Inactive
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {lt.code} • {leaveCategoryLabels[lt.type] || lt.type}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 flex gap-2">
                      <button
                        onClick={() => handleToggleActive(lt)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                      >
                        <HiOutlineCheck className="text-sm" />
                        Activate
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(lt.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      >
                        <HiOutlineTrash className="text-sm" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={editingId ? "Edit Leave Type" : "Create Leave Type"} 
        size="xl"
      >
        <form onSubmit={handleSubmit} className="divide-y divide-slate-200 dark:divide-slate-700">
          {/* Basic Info Section */}
          <div className="p-6">
            <button
              type="button"
              onClick={() => toggleSection("basic")}
              className="flex items-center justify-between w-full text-left mb-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <HiOutlineCalendar className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Basic Information</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Name, code, and category</p>
                </div>
              </div>
              {expandedSections.basic ? (
                <HiOutlineChevronUp className="text-slate-400" />
              ) : (
                <HiOutlineChevronDown className="text-slate-400" />
              )}
            </button>

            {expandedSections.basic && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Leave Type Name" required>
                  <TextInput
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Annual Leave"
                  />
                </FormField>

                <FormField label="Short Code" required hint="Used in reports and filters">
                  <TextInput
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().slice(0, 10) })}
                    placeholder="e.g., AL"
                    maxLength={10}
                  />
                </FormField>

                <FormField label="Leave Category" required>
                  <SelectInput
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as LeaveCategory })}
                  >
                    {Object.entries(leaveCategoryLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </SelectInput>
                </FormField>

                <FormField label="Annual Days Allocation" required>
                  <TextInput
                    type="number"
                    min={0}
                    max={365}
                    value={formData.annualDays}
                    onChange={(e) => setFormData({ ...formData, annualDays: parseInt(e.target.value) || 0 })}
                  />
                </FormField>

                <FormField label="Sort Order" hint="Display order in lists">
                  <TextInput
                    type="number"
                    min={0}
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  />
                </FormField>

                <FormField label="Gender Specific" hint="Restrict to specific gender">
                  <SelectInput
                    value={formData.genderSpecific || ""}
                    onChange={(e) => setFormData({ ...formData, genderSpecific: (e.target.value || null) as "MALE" | "FEMALE" | null })}
                  >
                    <option value="">All Employees</option>
                    <option value="MALE">Male Employees Only</option>
                    <option value="FEMALE">Female Employees Only</option>
                  </SelectInput>
                </FormField>
              </div>
            )}
          </div>

          {/* Accrual Section */}
          <div className="p-6">
            <button
              type="button"
              onClick={() => toggleSection("accrual")}
              className="flex items-center justify-between w-full text-left mb-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <HiOutlineRefresh className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Accrual & Allocation</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">How leave days are earned</p>
                </div>
              </div>
              {expandedSections.accrual ? (
                <HiOutlineChevronUp className="text-slate-400" />
              ) : (
                <HiOutlineChevronDown className="text-slate-400" />
              )}
            </button>

            {expandedSections.accrual && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Accrual Type">
                  <SelectInput
                    value={formData.accrualType}
                    onChange={(e) => setFormData({ ...formData, accrualType: e.target.value as "MONTHLY" | "YEARLY" })}
                  >
                    <option value="YEARLY">Yearly - Full allocation at start of year</option>
                    <option value="MONTHLY">Monthly - Prorated accrual each month</option>
                  </SelectInput>
                </FormField>

                {formData.accrualType === "MONTHLY" && (
                  <FormField label="Monthly Accrual Rate" hint="Days earned per month">
                    <TextInput
                      type="number"
                      min={0}
                      step={0.5}
                      value={formData.accrualRate}
                      onChange={(e) => setFormData({ ...formData, accrualRate: parseFloat(e.target.value) || 0 })}
                    />
                  </FormField>
                )}
              </div>
            )}
          </div>

          {/* Restrictions Section */}
          <div className="p-6">
            <button
              type="button"
              onClick={() => toggleSection("restrictions")}
              className="flex items-center justify-between w-full text-left mb-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <HiOutlineClock className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Restrictions & Limits</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Configure rules and constraints</p>
                </div>
              </div>
              {expandedSections.restrictions ? (
                <HiOutlineChevronUp className="text-slate-400" />
              ) : (
                <HiOutlineChevronDown className="text-slate-400" />
              )}
            </button>

            {expandedSections.restrictions && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Max Consecutive Days" hint="Maximum days in one request">
                    <TextInput
                      type="number"
                      min={0}
                      value={formData.maxConsecutive}
                      onChange={(e) => setFormData({ ...formData, maxConsecutive: parseInt(e.target.value) || 0 })}
                    />
                  </FormField>

                  <FormField label="Minimum Notice Days" hint="Days before leave must be requested">
                    <TextInput
                      type="number"
                      min={0}
                      value={formData.minNoticeDays}
                      onChange={(e) => setFormData({ ...formData, minNoticeDays: parseInt(e.target.value) || 0 })}
                    />
                  </FormField>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 space-y-4">
                  <ToggleField
                    checked={formData.canApplyHalfDay}
                    onChange={(checked) => setFormData({ ...formData, canApplyHalfDay: checked })}
                    label="Allow Half Day Applications"
                    description="Employees can apply for first half or second half"
                  />

                  {formData.canApplyHalfDay && (
                    <FormField label="Maximum Half Days Per Year">
                      <TextInput
                        type="number"
                        min={0}
                        value={formData.maxHalfDaysPerYear}
                        onChange={(e) => setFormData({ ...formData, maxHalfDaysPerYear: parseInt(e.target.value) || 0 })}
                        className="max-w-[200px]"
                      />
                    </FormField>
                  )}
                </div>

                <FormField label="Expiry Days" hint="Leave expires after this many days (0 = never expires)">
                  <TextInput
                    type="number"
                    min={0}
                    value={formData.expiryDays}
                    onChange={(e) => setFormData({ ...formData, expiryDays: parseInt(e.target.value) || 0 })}
                    className="max-w-[200px]"
                  />
                </FormField>
              </div>
            )}
          </div>

          {/* Advanced Section */}
          <div className="p-6">
            <button
              type="button"
              onClick={() => toggleSection("advanced")}
              className="flex items-center justify-between w-full text-left mb-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <HiOutlineCurrencyRupee className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Advanced Options</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Carry forward and encashment</p>
                </div>
              </div>
              {expandedSections.advanced ? (
                <HiOutlineChevronUp className="text-slate-400" />
              ) : (
                <HiOutlineChevronDown className="text-slate-400" />
              )}
            </button>

            {expandedSections.advanced && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 space-y-4">
                  <ToggleField
                    checked={formData.allowCarryForward}
                    onChange={(checked) => setFormData({ ...formData, allowCarryForward: checked })}
                    label="Allow Carry Forward"
                    description="Unused days can be carried to the next year"
                  />

                  {formData.allowCarryForward && (
                    <FormField label="Maximum Carry Forward Days">
                      <TextInput
                        type="number"
                        min={0}
                        value={formData.maxCarryForward}
                        onChange={(e) => setFormData({ ...formData, maxCarryForward: parseInt(e.target.value) || 0 })}
                        className="max-w-[200px]"
                      />
                    </FormField>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 space-y-4">
                  <ToggleField
                    checked={formData.allowEncashment}
                    onChange={(checked) => setFormData({ ...formData, allowEncashment: checked })}
                    label="Allow Encashment"
                    description="Employees can encash unused leave"
                  />

                  {formData.allowEncashment && (
                    <FormField label="Maximum Encashment Days">
                      <TextInput
                        type="number"
                        min={0}
                        value={formData.maxEncashDays}
                        onChange={(e) => setFormData({ ...formData, maxEncashDays: parseInt(e.target.value) || 0 })}
                        className="max-w-[200px]"
                      />
                    </FormField>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.name || !formData.code}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </span>
              ) : editingId ? "Update Leave Type" : "Create Leave Type"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Setup Modal */}
      <Modal open={quickSetupOpen} onClose={() => setQuickSetupOpen(false)} title="Quick Setup - Standard Leave Types" size="lg">
        <div className="p-6">
          <div className="flex items-start gap-4 p-4 mb-6 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
              <HiOutlineSparkles className="text-xl text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Recommended Leave Types</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Select the leave types you want to create. All types come with sensible defaults that you can customize later.
              </p>
            </div>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {STANDARD_LEAVE_TYPES.map((template, index) => {
              const isSelected = selectedStandardTypes.includes(index);
              const exists = leaveTypes.some(lt => lt.code === template.code);
              
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => !exists && toggleStandardType(index)}
                  disabled={exists}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    exists
                      ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 opacity-60 cursor-default"
                      : isSelected
                      ? "border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl ${template.color.bg} flex items-center justify-center text-xl flex-shrink-0`}>
                    {template.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-900 dark:text-white">{template.name}</h4>
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                        {template.code}
                      </span>
                      {exists && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          Already exists
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{template.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span>{template.annualDays} days/year</span>
                      {template.genderSpecific && (
                        <span className="px-1.5 py-0.5 rounded bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                          {template.genderSpecific === "FEMALE" ? "Female only" : "Male only"}
                        </span>
                      )}
                      {template.allowCarryForward && (
                        <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                          <HiOutlineRefresh className="text-xs" />
                          Carry Forward
                        </span>
                      )}
                      {template.allowEncashment && (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <HiOutlineCurrencyRupee className="text-xs" />
                          Encashment
                        </span>
                      )}
                    </div>
                  </div>
                  {exists ? (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <HiOutlineCheck className="text-sm text-white" />
                    </div>
                  ) : (
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-500"
                        : "border-slate-300 dark:border-slate-600"
                    }`}>
                      {isSelected && <HiOutlineCheck className="text-sm text-white" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <HiOutlineViewList className="text-lg" />
              <span>{selectedStandardTypes.length} type{selectedStandardTypes.length !== 1 ? "s" : ""} selected</span>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setQuickSetupOpen(false)}
                className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleQuickSetup}
                disabled={setupSubmitting || selectedStandardTypes.length === 0}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
              >
                {setupSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <HiOutlineSparkles className="text-lg" />
                    Create {selectedStandardTypes.length} Type{selectedStandardTypes.length !== 1 ? "s" : ""}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Leave Type" size="sm">
        <div className="p-6">
          <div className="w-14 h-14 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center">
            <HiOutlineTrash className="text-2xl text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-center text-slate-900 dark:text-white mb-2">
            Delete Leave Type?
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
            This action cannot be undone. Any employees using this leave type may be affected.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
