"use client";

import { useState, useEffect, Suspense } from "react";
import { toast } from "react-hot-toast";
import { MdAdd, MdAccessTime, MdCheck, MdClose, MdInfo } from "react-icons/md";
import { EmployeeLayout } from "@/components/employee";
import { TextInput } from "@/components/ui/text-input";
import { SelectInput } from "@/components/ui/select-input";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/loaders/skeleton";
import {
  type CompOffRequest,
  type CompOffBalance,
  type SessionType,
  sessionTypeLabels,
  compOffStatusLabels,
  getCompOffRequests,
  getCompOffBalance,
  createCompOffRequest,
  approveCompOffRequest,
} from "@/lib/client/leave";

function CompOffContent() {
  const [requests, setRequests] = useState<CompOffRequest[]>([]);
  const [balance, setBalance] = useState<CompOffBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"my" | "request">("my");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("");

  const [formData, setFormData] = useState({
    workDate: "",
    workSession: "FULL_DAY" as SessionType,
    reason: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [requestsRes, balanceRes] = await Promise.all([
        getCompOffRequests(filterStatus ? { status: filterStatus as any } : undefined),
        getCompOffBalance(),
      ]);

      if (requestsRes.data?.requests) {
        setRequests(requestsRes.data.requests);
      }
      if (balanceRes.data?.balance) {
        setBalance(balanceRes.data.balance);
      }
    } catch {
      toast.error("Failed to fetch comp-off data");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const result = await createCompOffRequest({
        workDate: formData.workDate,
        workSession: formData.workSession,
        reason: formData.reason || undefined,
      });

      if (result.data?.request) {
        toast.success("Comp-off request submitted");
        setModalOpen(false);
        setFormData({ workDate: "", workSession: "FULL_DAY", reason: "" });
        fetchData();
      } else {
        toast.error(result.error || "Failed to submit comp-off request");
      }
    } catch {
      toast.error("Failed to submit comp-off request");
    } finally {
      setSubmitting(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "PENDING":
        return "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20";
      case "APPROVED":
        return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20";
      case "REJECTED":
        return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20";
      case "EXPIRED":
        return "text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-900/20";
      case "USED":
        return "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20";
      case "CANCELLED":
        return "text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-900/20";
      default:
        return "text-slate-600 bg-slate-50";
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

  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const approvedRequests = requests.filter((r) => r.status === "APPROVED");
  const usedRequests = requests.filter((r) => r.status === "USED");
  const expiredRequests = requests.filter((r) => r.status === "EXPIRED");

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Compensatory Off</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track and manage your compensatory time off
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <MdAdd className="text-lg" />
          Request Comp-Off
        </button>
      </div>

      {/* Balance Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <MdAccessTime className="text-2xl text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Available Balance</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {balance?.availableDays ?? 0}
                <span className="text-base font-normal text-slate-400 ml-1">days</span>
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">Earned</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {balance?.earnedDays ?? 0}
            <span className="text-sm font-normal text-slate-400 ml-1">days</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">Used</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {balance?.usedDays ?? 0}
            <span className="text-sm font-normal text-slate-400 ml-1">days</span>
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 mb-6">
        <div className="flex items-start gap-3">
          <MdInfo className="text-xl text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              How Compensatory Off Works
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Comp-off is earned when you work on a holiday or weekend. Earned comp-offs must be used within 3 months.
              Approved comp-offs will appear here and can be used when applying for leave.
            </p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4 mb-4">
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            fetchData();
          }}
          className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="USED">Used</option>
          <option value="EXPIRED">Expired</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Requests List */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white">Comp-Off Requests</h2>
        </div>

        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
              <MdAccessTime className="text-2xl text-slate-400" />
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium">No Comp-Off Requests</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              Your comp-off requests will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {requests.map((request) => (
              <div key={request.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                          {new Date(request.workDate).toLocaleDateString("en-US", { month: "short" })}
                        </span>
                        <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                          {new Date(request.workDate).getDate()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          Worked on {formatDate(request.workDate)}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {sessionTypeLabels[request.workSession as SessionType] || request.workSession}
                          {request.reason && ` • ${request.reason}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                      {compOffStatusLabels[request.status as keyof typeof compOffStatusLabels] || request.status}
                    </span>
                    {request.expiryDate && request.status === "APPROVED" && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Use by: {formatDate(request.expiryDate)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Request Compensatory Off" size="md">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> You can only request comp-off for days you have actually worked on a holiday or weekend.
              A proof of work may be required.
            </p>
          </div>

          <FormField label="Date Worked" required>
            <TextInput
              type="date"
              value={formData.workDate}
              onChange={(e) => setFormData({ ...formData, workDate: e.target.value })}
              max={new Date().toISOString().split("T")[0]}
              required
            />
          </FormField>

          <FormField label="Session">
            <SelectInput
              value={formData.workSession}
              onChange={(e) => setFormData({ ...formData, workSession: e.target.value as SessionType })}
            >
              <option value="FULL_DAY">Full Day</option>
              <option value="FIRST_HALF">First Half</option>
              <option value="SECOND_HALF">Second Half</option>
            </SelectInput>
          </FormField>

          <FormField label="Reason" hint="Explain why you worked on this day">
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
              placeholder="e.g., Worked on a project deadline..."
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none transition placeholder:text-slate-400"
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.workDate}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default function CompOffPage() {
  return (
    <EmployeeLayout title="Compensatory Off" subtitle="Manage your compensatory time off">
      <Suspense fallback={
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      }>
        <CompOffContent />
      </Suspense>
    </EmployeeLayout>
  );
}
