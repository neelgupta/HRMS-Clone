"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineClock,
  HiOutlineDocumentText,
  HiOutlineFilter,
  HiOutlineUser,
  HiOutlineCalendar,
  HiOutlineChartBar,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from "react-icons/hi";
import { TextInput } from "@/components/ui/text-input";
import { SelectInput } from "@/components/ui/select-input";
import { FormField } from "@/components/ui/form-field";
import { Skeleton } from "@/components/ui/loaders/skeleton";
import { Modal } from "@/components/ui/modal";
import type { LeaveApplication, LeaveTypeConfig } from "@/lib/client/leave";
import { leaveStatusLabels, approvalStatusLabels, sessionTypeLabels } from "@/lib/client/leave";

type FilterStatus = "all" | "PENDING" | "APPROVED" | "REJECTED";

export default function HRLeaveManagementPage() {
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("PENDING");
  const [filterLeaveType, setFilterLeaveType] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<LeaveApplication | null>(null);
  const [actionModal, setActionModal] = useState<{
    app: LeaveApplication;
    action: "APPROVED" | "REJECTED" | "MODIFICATION_REQUESTED";
  } | null>(null);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [filterStatus, filterLeaveType]);

  async function fetchData() {
    setLoading(true);
    try {
      const [appsRes, typesRes] = await Promise.all([
        fetch(`/api/leave?status=${filterStatus}`, { credentials: "include" }),
        fetch("/api/leave/types", { credentials: "include" }),
      ]);

      const appsData = await appsRes.json();
      const typesData = await typesRes.json();

      if (appsRes.ok) {
        setApplications(appsData.applications || []);
      }
      if (typesRes.ok) {
        setLeaveTypes(typesData.leaveTypes || []);
      }
    } catch {
      toast.error("Failed to fetch leave applications");
    } finally {
      setLoading(false);
    }
  }

  async function fetchApplications() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterLeaveType) params.set("leaveTypeId", filterLeaveType);

      const res = await fetch(`/api/leave?${params}`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setApplications(data.applications || []);
        setCurrentPage(1);
      }
    } catch {
      toast.error("Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  }

  async function handleApproval(
    appId: string,
    action: "APPROVED" | "REJECTED" | "MODIFICATION_REQUESTED"
  ) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/leave/${appId}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comments: remarks }),
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Leave ${action.toLowerCase()} successfully!`);
        
        // Immediately update the application in list
        if (data.application) {
          setApplications(prev => 
            prev.map(app => 
              app.id === appId 
                ? { ...app, status: action === "APPROVED" ? "APPROVED" : action === "REJECTED" ? "REJECTED" : app.status }
                : app
            )
          );
        }
        
        setActionModal(null);
        setRemarks("");
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Action failed");
      }
    } catch {
      toast.error("Action failed");
    } finally {
      setSubmitting(false);
    }
  }

  function getStatusBadge(status: string, isLevel = false) {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      APPROVED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      MODIFICATION_REQUESTED: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  }

  function formatSession(session: string) {
    return sessionTypeLabels[session as keyof typeof sessionTypeLabels] || session;
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function getInitials(firstName: string, lastName: string) {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  }

  const filteredApplications = applications.filter((app) => {
    if (searchQuery) {
      const fullName = `${app.employee.firstName} ${app.employee.lastName}`.toLowerCase();
      const email = app.employee.email.toLowerCase();
      const query = searchQuery.toLowerCase();
      if (!fullName.includes(query) && !email.includes(query)) {
        return false;
      }
    }
    return true;
  });

  const pendingCount = applications.filter((a) => a.status === "PENDING").length;
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const paginatedApps = filteredApplications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "PENDING").length,
    approved: applications.filter((a) => a.status === "APPROVED").length,
    rejected: applications.filter((a) => a.status === "REJECTED").length,
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Leave Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review and approve employee leave requests
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => setFilterStatus("all")}
          className={`rounded-2xl border p-4 text-left transition-all ${
            filterStatus === "all"
              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <HiOutlineDocumentText className="text-lg text-slate-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilterStatus("PENDING")}
          className={`rounded-2xl border p-4 text-left transition-all ${
            filterStatus === "PENDING"
              ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-yellow-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <HiOutlineClock className="text-lg text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pending}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pending</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilterStatus("APPROVED")}
          className={`rounded-2xl border p-4 text-left transition-all ${
            filterStatus === "APPROVED"
              ? "border-green-500 bg-green-50 dark:bg-green-900/20"
              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-green-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <HiOutlineCheck className="text-lg text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.approved}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Approved</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilterStatus("REJECTED")}
          className={`rounded-2xl border p-4 text-left transition-all ${
            filterStatus === "REJECTED"
              ? "border-red-500 bg-red-50 dark:bg-red-900/20"
              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-red-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <HiOutlineX className="text-lg text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.rejected}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Rejected</p>
            </div>
          </div>
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <FormField label="Search">
              <TextInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
              />
            </FormField>
          </div>

          <div className="w-48">
            <FormField label="Leave Type">
              <SelectInput
                value={filterLeaveType}
                onChange={(e) => {
                  setFilterLeaveType(e.target.value);
                  fetchApplications();
                }}
              >
                <option value="">All Types</option>
                {leaveTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </SelectInput>
            </FormField>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : paginatedApps.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
              <HiOutlineDocumentText className="text-2xl text-slate-400" />
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium">No leave applications found</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              {filterStatus === "PENDING"
                ? "All pending requests have been processed"
                : "Try adjusting your filters"}
            </p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Employee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Leave Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Days
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {paginatedApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                          {getInitials(app.employee.firstName, app.employee.lastName)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {app.employee.firstName} {app.employee.lastName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {app.employee.department?.name || "No Department"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {app.leaveTypeConfig?.name || "N/A"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {app.leaveTypeConfig?.code}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm text-slate-700 dark:text-slate-200">
                          {formatDate(app.startDate)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatSession(app.startSession)} - {formatSession(app.endSession)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-lg font-semibold text-slate-900 dark:text-white">
                        {app.totalDays}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(app.status)}`}>
                          {leaveStatusLabels[app.status as keyof typeof leaveStatusLabels] || app.status}
                        </span>
                        {app.level1Status && app.level1Status !== "PENDING" && (
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(app.level1Status, true)}`}>
                            L1: {approvalStatusLabels[app.level1Status as keyof typeof approvalStatusLabels] || app.level1Status}
                          </span>
                        )}
                        {app.level2Status && (
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(app.level2Status, true)}`}>
                            L2: {approvalStatusLabels[app.level2Status as keyof typeof approvalStatusLabels] || app.level2Status}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {app.status === "PENDING" ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setActionModal({ app, action: "APPROVED" })}
                            className="w-10 h-10 flex items-center justify-center rounded-xl text-green-600 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                            title="Approve"
                          >
                            <HiOutlineCheck className="text-lg" />
                          </button>
                          <button
                            onClick={() => setActionModal({ app, action: "REJECTED" })}
                            className="w-10 h-10 flex items-center justify-center rounded-xl text-red-600 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                            title="Reject"
                          >
                            <HiOutlineX className="text-lg" />
                          </button>
                          <button
                            onClick={() => setActionModal({ app, action: "MODIFICATION_REQUESTED" })}
                            className="w-10 h-10 flex items-center justify-center rounded-xl text-orange-600 bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors"
                            title="Request Modification"
                          >
                            <HiOutlineClock className="text-lg" />
                          </button>
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-600 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                            title="View Details"
                          >
                            <HiOutlineDocumentText className="text-lg" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-600 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                          title="View Details"
                        >
                          <HiOutlineDocumentText className="text-lg" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredApplications.length)} of{" "}
                  {filteredApplications.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <HiOutlineChevronLeft className="text-lg" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-medium transition-colors ${
                        currentPage === page
                          ? "bg-indigo-600 text-white"
                          : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <HiOutlineChevronRight className="text-lg" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Modal */}
      <Modal
        open={!!actionModal}
        onClose={() => {
          setActionModal(null);
          setRemarks("");
        }}
        title={`${actionModal?.action === "APPROVED" ? "Approve" : actionModal?.action === "REJECTED" ? "Reject" : "Request Modification for"} Leave`}
        size="md"
      >
        {actionModal && (
          <div className="p-6 space-y-6">
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-700/50 p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Employee</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {actionModal.app.employee.firstName} {actionModal.app.employee.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Leave Type</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {actionModal.app.leaveTypeConfig?.name || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Duration</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {actionModal.app.totalDays} day{actionModal.app.totalDays !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Period</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {formatDate(actionModal.app.startDate)} - {formatDate(actionModal.app.endDate)}
                </span>
              </div>
              {actionModal.app.reason && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-600">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Reason</p>
                  <p className="text-sm text-slate-700 dark:text-slate-200">{actionModal.app.reason}</p>
                </div>
              )}
            </div>

            <FormField label="Comments / Remarks" hint="Optional - add a note for the employee">
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                placeholder={
                  actionModal.action === "APPROVED"
                    ? "Add any notes for approval..."
                    : actionModal.action === "REJECTED"
                    ? "Please provide a reason for rejection..."
                    : "Explain what modifications are needed..."
                }
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none transition placeholder:text-slate-400"
              />
            </FormField>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => {
                  setActionModal(null);
                  setRemarks("");
                }}
                className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApproval(actionModal.app.id, actionModal.action)}
                disabled={submitting}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors ${
                  actionModal.action === "APPROVED"
                    ? "bg-green-600 hover:bg-green-700"
                    : actionModal.action === "REJECTED"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-orange-600 hover:bg-orange-700"
                }`}
              >
                {submitting
                  ? "Processing..."
                  : actionModal.action === "APPROVED"
                  ? "Approve Leave"
                  : actionModal.action === "REJECTED"
                  ? "Reject Leave"
                  : "Request Modification"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Details Modal */}
      <Modal
        open={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        title="Leave Application Details"
        size="md"
      >
        {selectedApp && (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                {getInitials(selectedApp.employee.firstName, selectedApp.employee.lastName)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {selectedApp.employee.firstName} {selectedApp.employee.lastName}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {selectedApp.employee.email}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {selectedApp.employee.department?.name || "No Department"} •{" "}
                  {selectedApp.employee.designation?.name || "No Designation"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 dark:bg-slate-700/50 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400">Leave Type</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {selectedApp.leaveTypeConfig?.name || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400">Period</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {formatDate(selectedApp.startDate)} - {formatDate(selectedApp.endDate)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400">Sessions</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {formatSession(selectedApp.startSession)} - {formatSession(selectedApp.endSession)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400">Total Days</span>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {selectedApp.totalDays}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400">Status</span>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(selectedApp.status)}`}>
                  {leaveStatusLabels[selectedApp.status as keyof typeof leaveStatusLabels] || selectedApp.status}
                </span>
              </div>
              {selectedApp.reason && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-600">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Reason</p>
                  <p className="text-sm text-slate-700 dark:text-slate-200">{selectedApp.reason}</p>
                </div>
              )}
            </div>

            {/* Approval History */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                Approval History
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    <HiOutlineClock className="text-sm text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      Application Submitted
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(selectedApp.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {selectedApp.level1ReviewedAt && (
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      selectedApp.level1Status === "APPROVED"
                        ? "bg-green-100 dark:bg-green-900/30"
                        : selectedApp.level1Status === "REJECTED"
                        ? "bg-red-100 dark:bg-red-900/30"
                        : "bg-orange-100 dark:bg-orange-900/30"
                    }`}>
                      {selectedApp.level1Status === "APPROVED" ? (
                        <HiOutlineCheck className="text-sm text-green-600" />
                      ) : selectedApp.level1Status === "REJECTED" ? (
                        <HiOutlineX className="text-sm text-red-600" />
                      ) : (
                        <HiOutlineClock className="text-sm text-orange-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700 dark:text-slate-200">
                        Level 1 Review -{" "}
                        <span className={`font-medium ${
                          selectedApp.level1Status === "APPROVED"
                            ? "text-green-600"
                            : selectedApp.level1Status === "REJECTED"
                            ? "text-red-600"
                            : "text-orange-600"
                        }`}>
                          {approvalStatusLabels[selectedApp.level1Status as keyof typeof approvalStatusLabels]}
                        </span>
                      </p>
                      {selectedApp.level1Remarks && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {selectedApp.level1Remarks}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {new Date(selectedApp.level1ReviewedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
