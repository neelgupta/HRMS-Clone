"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { 
  HiOutlineCheck, 
  HiOutlineX, 
  HiOutlinePencil, 
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineCalendar,
  HiOutlineDocumentText,
  HiOutlineChat,
  HiOutlineEye,
  HiOutlineFilter
} from "react-icons/hi";
import { 
  type LeaveApplication, 
  type LeaveComment,
  leaveStatusLabels,
  approvalStatusLabels,
  getLeaveApplications,
  approveLeaveApplication,
  addLeaveComment
} from "@/lib/client/leave";
import { Skeleton } from "@/components/ui/loaders/skeleton";
import { Modal } from "@/components/ui/modal";
import { TextInput } from "@/components/ui/text-input";
import { SelectInputWithOptions } from "@/components/ui/select-input-with-options";
import { FormField } from "@/components/ui/form-field";

interface LeaveApprovalWorkflowProps {
  filters?: {
    status?: "PENDING" | "APPROVED" | "REJECTED";
    department?: string;
    dateRange?: string;
  };
}

export function LeaveApprovalWorkflow({ filters }: LeaveApprovalWorkflowProps) {
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<LeaveApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionModal, setActionModal] = useState<{
    app: LeaveApplication;
    action: "APPROVE" | "REJECT" | "REQUEST_MODIFICATION";
  } | null>(null);
  const [comments, setComments] = useState("");
  const [commentsModal, setCommentsModal] = useState<LeaveApplication | null>(null);
  const [appComments, setAppComments] = useState<LeaveComment[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>(filters?.status || "PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchApplications();
  }, [filterStatus, searchQuery, currentPage]);

  async function fetchApplications() {
    setLoading(true);
    try {
      const result = await getLeaveApplications({
        status: filterStatus as any,
        page: currentPage,
        limit: itemsPerPage,
      });

      if (result.data?.applications && result.data.applications) {
        setApplications(result.data.applications);
      }
    } catch (error) {
      console.error("Failed to fetch applications:", error);
      toast.error("Failed to load leave applications");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(app: LeaveApplication) {
    setActionModal({ app, action: "APPROVE" });
  }

  async function handleReject(app: LeaveApplication) {
    setActionModal({ app, action: "REJECT" });
  }

  async function handleRequestModification(app: LeaveApplication) {
    setActionModal({ app, action: "REQUEST_MODIFICATION" });
  }

  async function executeAction() {
    if (!actionModal) return;

    setSubmitting(true);
    try {
      const action = actionModal.action === "APPROVE" ? "APPROVED" : 
                     actionModal.action === "REJECT" ? "REJECTED" : "MODIFICATION_REQUESTED";

      const result = await approveLeaveApplication(
        actionModal.app.id,
        action,
        comments
      );

      if (result.data) {
        toast.success(`Leave application ${action.toLowerCase()}d successfully!`);
        setActionModal(null);
        setComments("");
        fetchApplications();
      } else {
        toast.error(result.error || "Failed to process application");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to process application");
    } finally {
      setSubmitting(false);
    }
  }

  async function viewComments(app: LeaveApplication) {
    setCommentsModal(app);
    try {
      const result = await fetch(`/api/leave/${app.id}/comments`, { credentials: "include" });
      if (result.ok) {
        const data = await result.json();
        setAppComments(data.comments || []);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  }

  async function addComment() {
    if (!commentsModal || !comments.trim()) return;

    try {
      const result = await addLeaveComment(commentsModal.id, comments);
      if (result.data?.comment) {
        setAppComments(prev => [result.data.comment, ...prev]);
        setComments("");
        toast.success("Comment added successfully");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to add comment");
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "PENDING":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "APPROVED":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "MODIFICATION_REQUESTED":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400";
    }
  }

  function getApprovalLevelColor(level: number, totalLevels: number) {
    if (level >= totalLevels) return "text-emerald-600 dark:text-emerald-400";
    if (level > 1) return "text-blue-600 dark:text-blue-400";
    return "text-amber-600 dark:text-amber-400";
  }

  const filteredApplications = applications.filter(app => {
    const matchesStatus = !filterStatus || app.status === filterStatus;
    const matchesSearch = !searchQuery || 
      app.employee.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.employee.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.leaveTypeConfig?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Leave Approval Workflow</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Review and approve employee leave requests
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <TextInput
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <HiOutlineFilter className="absolute left-3 top-3 text-slate-400" />
          </div>
          
          <SelectInputWithOptions
            value={filterStatus}
            onChange={(value) => setFilterStatus(value)}
            options={[
              { value: "", label: "All Status" },
              { value: "PENDING", label: "Pending" },
              { value: "APPROVED", label: "Approved" },
              { value: "REJECTED", label: "Rejected" },
            ]}
            placeholder="Filter by status"
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <HiOutlineClock className="text-xl text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Pending</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {applications.filter(app => app.status === "PENDING").length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <HiOutlineCheck className="text-xl text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Approved</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {applications.filter(app => app.status === "APPROVED").length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <HiOutlineX className="text-xl text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Rejected</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {applications.filter(app => app.status === "REJECTED").length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <HiOutlinePencil className="text-xl text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Modification Requested</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {applications.filter(app => app.status === "MODIFICATION_REQUESTED").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-12 text-center">
            <HiOutlineDocumentText className="text-4xl text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No leave applications found
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {searchQuery ? "Try adjusting your search criteria" : "No applications match the current filters"}
            </p>
          </div>
        ) : (
          filteredApplications.map(app => (
            <div key={app.id} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
              {/* Application Header */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      <HiOutlineUser className="text-xl text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {app.employee.firstName} {app.employee.lastName}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {app.employee.email} • {app.employee.department?.name || "No Department"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                      {leaveStatusLabels[app.status as keyof typeof leaveStatusLabels]}
                    </span>
                    <button
                      onClick={() => viewComments(app)}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <HiOutlineChat className="text-slate-600 dark:text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Application Details */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Leave Details */}
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white mb-3">Leave Details</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Type:</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {app.leaveTypeConfig?.name || "Leave"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Duration:</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {app.totalDays} {app.totalDays === 1 ? 'day' : 'days'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Period:</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {new Date(app.startDate).toLocaleDateString()} - {new Date(app.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      {app.reason && (
                        <div>
                          <span className="text-sm text-slate-600 dark:text-slate-400">Reason:</span>
                          <p className="text-sm text-slate-900 dark:text-white mt-1 line-clamp-2">
                            {app.reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Approval Workflow */}
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white mb-3">Approval Workflow</h4>
                    <div className="space-y-3">
                      {/* Level 1 */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                            app.level1Status === "APPROVED" 
                              ? "bg-emerald-100 text-emerald-800"
                              : app.level1Status === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : app.level1Status === "PENDING"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-800"
                          }`}>
                            {app.level1Status === "APPROVED" ? "✓" : 
                             app.level1Status === "REJECTED" ? "✗" : "1"}
                          </div>
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            Level 1
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {approvalStatusLabels[app.level1Status as keyof typeof approvalStatusLabels]}
                          </p>
                          {app.level1ReviewedAt && (
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {new Date(app.level1ReviewedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Level 2 (if applicable) */}
                      {app.level2Status && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                              app.level2Status === "APPROVED" 
                                ? "bg-emerald-100 text-emerald-800"
                                : app.level2Status === "REJECTED"
                                ? "bg-red-100 text-red-800"
                                : app.level2Status === "PENDING"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-100 text-slate-800"
                            }`}>
                              {app.level2Status === "APPROVED" ? "✓" : 
                               app.level2Status === "REJECTED" ? "✗" : "2"}
                            </div>
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              Level 2
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {approvalStatusLabels[app.level2Status as keyof typeof approvalStatusLabels]}
                            </p>
                            {app.level2ReviewedAt && (
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {new Date(app.level2ReviewedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {app.status === "PENDING" && (
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white mb-3">Actions</h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => handleApprove(app)}
                          className="w-full px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
                        >
                          <HiOutlineCheck className="inline mr-2" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(app)}
                          className="w-full px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                        >
                          <HiOutlineX className="inline mr-2" />
                          Reject
                        </button>
                        <button
                          onClick={() => handleRequestModification(app)}
                          className="w-full px-4 py-2 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors"
                        >
                          <HiOutlinePencil className="inline mr-2" />
                          Request Modification
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Modal */}
      {actionModal && (
        <Modal
          open={true}
          onClose={() => setActionModal(null)}
          title={`${actionModal.action.replace('_', ' ')} Leave Application`}
        >
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
              <h4 className="font-medium text-slate-900 dark:text-white mb-2">
                {actionModal.app.employee.firstName} {actionModal.app.employee.lastName}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                {actionModal.app.employee.email}
              </p>
              <div className="space-y-1 text-sm">
                <div><strong>Leave Type:</strong> {actionModal.app.leaveTypeConfig?.name}</div>
                <div><strong>Duration:</strong> {actionModal.app.totalDays} days</div>
                <div><strong>Period:</strong> {new Date(actionModal.app.startDate).toLocaleDateString()} - {new Date(actionModal.app.endDate).toLocaleDateString()}</div>
                {actionModal.app.reason && (
                  <div><strong>Reason:</strong> {actionModal.app.reason}</div>
                )}
              </div>
            </div>

            <FormField label="Comments (Required for rejection/modification)">
              <TextArea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Provide your comments..."
                rows={4}
              />
            </FormField>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setActionModal(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                disabled={submitting || (actionModal.action !== "APPROVE" && !comments.trim())}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  actionModal.action === "APPROVE"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : actionModal.action === "REJECT"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-amber-600 text-white hover:bg-amber-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {submitting ? "Processing..." : `${actionModal.action.replace('_', ' ')} Application`}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Comments Modal */}
      {commentsModal && (
        <Modal
          open={true}
          onClose={() => setCommentsModal(null)}
          title="Application Comments"
        >
          <div className="space-y-4">
            {/* Add Comment */}
            <div className="flex gap-2">
              <TextInput
                value={comments}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setComments(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1"
              />
              <button
                onClick={addComment}
                disabled={!comments.trim()}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
            </div>

            {/* Comments List */}
            <div className="max-h-64 overflow-y-auto space-y-3">
              {appComments.length === 0 ? (
                <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                  No comments yet
                </p>
              ) : (
                appComments.map(comment => (
                  <div key={comment.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {comment.user.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(comment.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {comment.isInternal && (
                        <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                          Internal
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {comment.comment}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
