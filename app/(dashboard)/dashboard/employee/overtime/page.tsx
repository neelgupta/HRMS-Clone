"use client";

import { useState, useEffect, Suspense } from "react";
import { toast } from "react-hot-toast";
import { MdAccessTime as MdOvertime, MdHistory, MdPendingActions, MdCheckCircle } from "react-icons/md";
import { EmployeeLayout } from "@/components/employee";
import { FormField } from "@/components/ui/form-field";
import { TextInput } from "@/components/ui/text-input";
import { SelectInput } from "@/components/ui/select-input";
import { Skeleton } from "@/components/ui/loaders/skeleton";

interface OvertimeRequest {
  id: string;
  date: string;
  hours: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvedBy: string | null;
  approvedAt: string | null;
  remarks: string | null;
  createdAt: string;
}

interface OvertimeSummary {
  thisMonthHours: number;
  pendingCount: number;
  approvedHours: number;
  totalHours: number;
}

function OvertimeContent() {
  const [requests, setRequests] = useState<OvertimeRequest[]>([]);
  const [summary, setSummary] = useState<OvertimeSummary>({
    thisMonthHours: 0,
    pendingCount: 0,
    approvedHours: 0,
    totalHours: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    hours: "",
    reason: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [requestsRes, summaryRes] = await Promise.all([
        fetch("/api/overtime/requests", { credentials: "include" }),
        fetch("/api/overtime/summary", { credentials: "include" }),
      ]);

      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        setRequests(requestsData.requests || []);
      }

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData);
      }
    } catch (error) {
      console.error("Failed to fetch overtime data:", error);
      toast.error("Failed to load overtime data");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.date) {
      toast.error("Please select a date");
      return;
    }
    
    const hours = parseFloat(formData.hours);
    if (isNaN(hours) || hours <= 0 || hours > 12) {
      toast.error("Please enter valid hours (1-12 hours)");
      return;
    }
    
    if (!formData.reason.trim()) {
      toast.error("Please provide a reason for overtime");
      return;
    }
    
    setSubmitting(true);
    
    try {
      const res = await fetch("/api/overtime/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formData.date,
          hours,
          reason: formData.reason,
        }),
        credentials: "include",
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success("Overtime request submitted successfully");
        setFormData({
          date: new Date().toISOString().split("T")[0],
          hours: "",
          reason: "",
        });
        await fetchData();
      } else {
        toast.error(data.error || "Failed to submit overtime request");
      }
    } catch (error) {
      console.error("Failed to submit overtime:", error);
      toast.error("Failed to submit overtime request");
    } finally {
      setSubmitting(false);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "APPROVED":
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Approved</span>;
      case "REJECTED":
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Rejected</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</span>;
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

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">This Month</p>
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{summary.thisMonthHours} hrs</p>
            </div>
            <MdOvertime className="text-3xl text-indigo-400" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Pending Requests</p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">{summary.pendingCount}</p>
            </div>
            <MdPendingActions className="text-3xl text-amber-400" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Approved</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{summary.approvedHours} hrs</p>
            </div>
            <MdCheckCircle className="text-3xl text-emerald-400" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total (YTD)</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">{summary.totalHours} hrs</p>
            </div>
            <MdHistory className="text-3xl text-purple-400" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Request Overtime</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Date" required>
              <TextInput
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                max={new Date().toISOString().split("T")[0]}
                required
              />
            </FormField>
            <FormField label="Hours" required>
              <TextInput
                type="number"
                min="1"
                max="12"
                step="0.5"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                placeholder="e.g., 2"
                required
              />
            </FormField>
            <div className="md:col-span-2">
              <FormField label="Reason" required>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
                  placeholder="Enter reason for overtime..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                  required
                />
              </FormField>
            </div>
          </div>
          <button 
            type="submit"
            disabled={submitting}
            className="mt-4 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-medium transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Overtime History</h2>
        </div>
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
              <MdOvertime className="text-3xl text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium">No Overtime Records</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Your overtime history will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {requests.map((request) => (
              <div key={request.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium text-slate-900 dark:text-white">
                        {formatDate(request.date)}
                      </span>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {request.hours} hour{request.hours !== 1 ? "s" : ""} - {request.reason}
                    </p>
                    {request.remarks && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Remarks: {request.remarks}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">
                      Applied: {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function OvertimePage() {
  return (
    <EmployeeLayout title="Overtime" subtitle="Request and track your overtime hours">
      <Suspense fallback={<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>}>
        <OvertimeContent />
      </Suspense>
    </EmployeeLayout>
  );
}