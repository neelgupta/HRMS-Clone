"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { 
  HiOutlineSave, 
  HiOutlineRefresh, 
  HiOutlineCheckCircle, 
  HiOutlineClock,
  HiOutlineUserGroup,
  HiOutlineCurrencyRupee,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineCalendar,
  HiOutlineInformationCircle
} from "react-icons/hi";
import { SelectInput } from "@/components/ui/select-input";
import { TextInput } from "@/components/ui/text-input";
import { FormField } from "@/components/ui/form-field";
import { ToggleField } from "@/components/ui/toggle-field";
import { Skeleton } from "@/components/ui/loaders/skeleton";
import type { LeavePolicy } from "@/lib/client/leave";

interface LeavePolicyFormData {
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

const defaultPolicy: LeavePolicyFormData = {
  approvalLevel1: "MANAGER",
  approvalLevel2: null,
  managerApprovalDays: 2,
  hrApprovalDays: 3,
  encashmentStartMonth: 1,
  encashmentEndMonth: 3,
  processCarryForward: true,
  carryForwardDeadline: null,
  allowAutoApproval: false,
  autoApprovalDaysThreshold: 0,
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const approvalLevelOptions = [
  { value: "MANAGER", label: "Direct Manager", description: "Leave approved by employee's direct manager" },
  { value: "HR", label: "HR Admin", description: "Leave approved by HR department" },
  { value: "BOTH", label: "Both Required", description: "Both manager and HR must approve" },
];

function InfoCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
        <Icon className="text-sm text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">{title}</p>
        <p className="text-xs text-blue-600 dark:text-blue-300 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function PolicySection({ 
  title, 
  description, 
  icon: Icon, 
  iconBg, 
  children 
}: { 
  title: string; 
  description: string; 
  icon: any; 
  iconBg: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/50 dark:to-transparent">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center`}>
            <Icon className="text-2xl" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

export default function LeavePolicyPage() {
  const [policy, setPolicy] = useState<LeavePolicy | null>(null);
  const [formData, setFormData] = useState<LeavePolicyFormData>(defaultPolicy);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchPolicy();
  }, []);

  useEffect(() => {
    if (policy) {
      setFormData({
        approvalLevel1: policy.approvalLevel1,
        approvalLevel2: policy.approvalLevel2,
        managerApprovalDays: policy.managerApprovalDays,
        hrApprovalDays: policy.hrApprovalDays,
        encashmentStartMonth: policy.encashmentStartMonth,
        encashmentEndMonth: policy.encashmentEndMonth,
        processCarryForward: policy.processCarryForward,
        carryForwardDeadline: policy.carryForwardDeadline,
        allowAutoApproval: policy.allowAutoApproval,
        autoApprovalDaysThreshold: policy.autoApprovalDaysThreshold,
      });
    }
  }, [policy]);

  async function fetchPolicy() {
    setLoading(true);
    try {
      const res = await fetch("/api/leave/balance/policy", { credentials: "include" });
      const data = await res.json();
      if (res.ok && data.policy) {
        setPolicy(data.policy);
      } else {
        setPolicy(null);
      }
    } catch {
      toast.error("Failed to fetch leave policy");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/leave/balance/policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setPolicy(data.policy);
        setHasChanges(false);
        toast.success("Leave policy saved successfully");
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to save policy");
      }
    } catch {
      toast.error("Failed to save leave policy");
    } finally {
      setSaving(false);
    }
  }

  function handleChange<K extends keyof LeavePolicyFormData>(key: K, value: LeavePolicyFormData[K]) {
    setFormData({ ...formData, [key]: value });
    setHasChanges(true);
  }

  function resetChanges() {
    if (policy) {
      setFormData({
        approvalLevel1: policy.approvalLevel1,
        approvalLevel2: policy.approvalLevel2,
        managerApprovalDays: policy.managerApprovalDays,
        hrApprovalDays: policy.hrApprovalDays,
        encashmentStartMonth: policy.encashmentStartMonth,
        encashmentEndMonth: policy.encashmentEndMonth,
        processCarryForward: policy.processCarryForward,
        carryForwardDeadline: policy.carryForwardDeadline,
        allowAutoApproval: policy.allowAutoApproval,
        autoApprovalDaysThreshold: policy.autoApprovalDaysThreshold,
      });
    } else {
      setFormData(defaultPolicy);
    }
    setHasChanges(false);
  }

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          <Skeleton className="h-12 w-36" />
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <HiOutlineShieldCheck className="text-xl text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Leave Policy</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 ml-13">
            Configure approval workflows, carry forward rules, and encashment settings
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <button
              onClick={resetChanges}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <HiOutlineRefresh className="text-lg" />
              Reset
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <HiOutlineSave className="text-lg" />
                Save Policy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <InfoCard 
        icon={HiOutlineInformationCircle}
        title="Policy Settings"
        description="Changes to leave policy will apply to all new leave applications. Existing approved leaves will not be affected."
      />

      {/* Approval Workflow */}
      <div className="mt-6">
        <PolicySection
          title="Approval Workflow"
          description="Define how leave requests are routed and approved"
          icon={HiOutlineUserGroup}
          iconBg="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
        >
          <div className="space-y-6">
            {/* Level 1 Approval */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Level 1 Approver
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {approvalLevelOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleChange("approvalLevel1", option.value as "MANAGER" | "HR" | "BOTH")}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.approvalLevel1 === option.value
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        formData.approvalLevel1 === option.value
                          ? "border-indigo-500 bg-indigo-500"
                          : "border-slate-300 dark:border-slate-600"
                      }`}>
                        {formData.approvalLevel1 === option.value && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white text-sm">{option.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 ml-7">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Level 2 Approval */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Level 2 Approver <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <button
                  onClick={() => handleChange("approvalLevel2", null)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    formData.approvalLevel2 === null
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      formData.approvalLevel2 === null
                        ? "border-indigo-500 bg-indigo-500"
                        : "border-slate-300 dark:border-slate-600"
                    }`}>
                      {formData.approvalLevel2 === null && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium text-slate-900 dark:text-white text-sm">No Second Level</span>
                  </div>
                </button>
                {approvalLevelOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleChange("approvalLevel2", option.value as "MANAGER" | "HR" | "BOTH")}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.approvalLevel2 === option.value
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        formData.approvalLevel2 === option.value
                          ? "border-indigo-500 bg-indigo-500"
                          : "border-slate-300 dark:border-slate-600"
                      }`}>
                        {formData.approvalLevel2 === option.value && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white text-sm">{option.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* SLA Days */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <FormField
                label="Manager Approval SLA"
                hint="Days allowed for manager to respond"
              >
                <div className="flex items-center gap-3">
                  <TextInput
                    type="number"
                    min={1}
                    max={30}
                    value={formData.managerApprovalDays}
                    onChange={(e) => handleChange("managerApprovalDays", parseInt(e.target.value) || 2)}
                    className="w-24 text-center"
                  />
                  <span className="text-sm text-slate-500 dark:text-slate-400">working days</span>
                </div>
              </FormField>

              <FormField
                label="HR Approval SLA"
                hint="Days allowed for HR to respond"
              >
                <div className="flex items-center gap-3">
                  <TextInput
                    type="number"
                    min={1}
                    max={30}
                    value={formData.hrApprovalDays}
                    onChange={(e) => handleChange("hrApprovalDays", parseInt(e.target.value) || 3)}
                    className="w-24 text-center"
                  />
                  <span className="text-sm text-slate-500 dark:text-slate-400">working days</span>
                </div>
              </FormField>
            </div>
          </div>
        </PolicySection>
      </div>

      {/* Auto Approval */}
      <div className="mt-6">
        <PolicySection
          title="Auto Approval"
          description="Automatically process pending leave requests"
          icon={HiOutlineSparkles}
          iconBg="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
        >
          <div className="space-y-4">
            <ToggleField
              checked={formData.allowAutoApproval}
              onChange={(checked) => handleChange("allowAutoApproval", checked)}
              label="Enable Auto Approval"
              description="Leave requests will be auto-approved if not reviewed within the threshold period"
            />

            {formData.allowAutoApproval && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <FormField
                  label="Auto Approval Threshold"
                  hint="Number of days after which pending requests are auto-approved"
                >
                  <div className="flex items-center gap-3">
                    <TextInput
                      type="number"
                      min={1}
                      max={90}
                      value={formData.autoApprovalDaysThreshold}
                      onChange={(e) => handleChange("autoApprovalDaysThreshold", parseInt(e.target.value) || 5)}
                      className="w-24 text-center"
                    />
                    <span className="text-sm text-slate-500 dark:text-slate-400">days</span>
                  </div>
                </FormField>
              </div>
            )}
          </div>
        </PolicySection>
      </div>

      {/* Carry Forward */}
      <div className="mt-6">
        <PolicySection
          title="Carry Forward"
          description="Configure year-end leave balance handling"
          icon={HiOutlineRefresh}
          iconBg="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
        >
          <div className="space-y-4">
            <ToggleField
              checked={formData.processCarryForward}
              onChange={(checked) => handleChange("processCarryForward", checked)}
              label="Enable Carry Forward"
              description="Unused leave days will be carried over to the next year"
            />

            {formData.processCarryForward && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 space-y-4">
                <FormField
                  label="Carry Forward Deadline"
                  hint="Last date by which carried forward leave must be used (optional)"
                >
                  <TextInput
                    type="date"
                    value={formData.carryForwardDeadline || ""}
                    onChange={(e) => handleChange("carryForwardDeadline", e.target.value || null)}
                    className="max-w-xs"
                  />
                </FormField>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Leave days not used by this deadline will be forfeited. Leave blank for no deadline.
                </p>
              </div>
            )}
          </div>
        </PolicySection>
      </div>

      {/* Encashment */}
      <div className="mt-6">
        <PolicySection
          title="Leave Encashment"
          description="Configure when employees can encash unused leave"
          icon={HiOutlineCurrencyRupee}
          iconBg="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Encashment Window Start"
                hint="First month for encashment requests"
              >
                <SelectInput
                  value={formData.encashmentStartMonth}
                  onChange={(e) => handleChange("encashmentStartMonth", parseInt(e.target.value))}
                >
                  {monthNames.map((name, idx) => (
                    <option key={idx + 1} value={idx + 1}>{name}</option>
                  ))}
                </SelectInput>
              </FormField>

              <FormField
                label="Encashment Window End"
                hint="Last month for encashment requests"
              >
                <SelectInput
                  value={formData.encashmentEndMonth}
                  onChange={(e) => handleChange("encashmentEndMonth", parseInt(e.target.value))}
                >
                  {monthNames.map((name, idx) => (
                    <option key={idx + 1} value={idx + 1}>{name}</option>
                  ))}
                </SelectInput>
              </FormField>
            </div>

            {formData.encashmentStartMonth > formData.encashmentEndMonth ? (
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  <strong>Note:</strong> The encashment window spans across year end 
                  ({monthNames[formData.encashmentStartMonth - 1]} to {monthNames[formData.encashmentEndMonth - 1]})
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  <strong>Encashment Period:</strong> {monthNames[formData.encashmentStartMonth - 1]} to {monthNames[formData.encashmentEndMonth - 1]}
                </p>
              </div>
            )}
          </div>
        </PolicySection>
      </div>

      {/* Summary Card */}
      <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Policy Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-xl bg-white/80 dark:bg-slate-800/80">
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {formData.approvalLevel1 === "BOTH" ? "2" : "1"}{formData.approvalLevel2 ? "+1" : ""}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Approval Levels</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-white/80 dark:bg-slate-800/80">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formData.managerApprovalDays + formData.hrApprovalDays}d
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Max SLA</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-white/80 dark:bg-slate-800/80">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formData.processCarryForward ? "Yes" : "No"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Carry Forward</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-white/80 dark:bg-slate-800/80">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formData.allowAutoApproval ? `${formData.autoApprovalDaysThreshold}d` : "Off"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Auto Approve</p>
          </div>
        </div>
      </div>
    </div>
  );
}
