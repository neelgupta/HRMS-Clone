"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MdArrowBack, MdSend, MdAttachFile } from "react-icons/md";
import { toast } from "react-hot-toast";
import { getTicket, getTicketComments, addTicketComment, updateTicket, type Ticket, type TicketComment } from "@/lib/client/ticket";

const categoryLabels: Record<string, string> = {
  GENERAL: "General Inquiry",
  IT_SUPPORT: "IT Support",
  HR_RELATED: "HR Related",
  PAYROLL: "Payroll",
  LEAVE_MANAGEMENT: "Leave Management",
  ATTENDANCE: "Attendance",
  OTHER: "Other",
};

const statusColors: Record<string, string> = {
  OPEN: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300",
  IN_PROGRESS: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300",
  RESOLVED: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300",
  CLOSED: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300",
  MEDIUM: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300",
  HIGH: "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300",
  URGENT: "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300",
};

function TicketDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchData = async () => {
    try {
      const [ticketData, commentsData, attachmentsData] = await Promise.all([
        getTicket(id),
        getTicketComments(id),
        fetch(`/api/tickets/${id}/attachments`, { credentials: "include" }).then((res) => res.json()),
      ]);
      setTicket(ticketData.ticket);
      setComments(commentsData.comments);
      setAttachments(attachmentsData.attachments || []);
    } catch (error) {
      console.error("Failed to fetch ticket:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      await addTicketComment(id, { comment: newComment });
      setNewComment("");
      fetchData();
      toast.success("Comment added");
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;
    
    try {
      setUpdatingStatus(true);
      await updateTicket(id, { status: newStatus });
      toast.success("Ticket status updated");
      fetchData();
    } catch (error) {
      toast.error("Failed to update ticket");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Ticket not found.</p>
        <Link href="/dashboard/hr/tickets" className="mt-2 text-indigo-600 hover:underline">
          Back to Tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/hr/tickets"
        className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      >
        <MdArrowBack className="w-4 h-4" />
        Back to Tickets
      </Link>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Ticket #{ticket.ticketNumber}</p>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white mt-1">{ticket.title}</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[ticket.status]}`}>
                {ticket.status === "IN_PROGRESS" ? "In Progress" : ticket.status}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Employee</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                {ticket.employee ? `${ticket.employee.firstName} ${ticket.employee.lastName}` : "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Category</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                {categoryLabels[ticket.category] || ticket.category}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Priority</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[ticket.priority]}`}>
                  {ticket.priority}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Created</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                {new Date(ticket.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Description</h2>
            <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <p className="text-sm text-slate-900 dark:text-white whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mt-6">
            <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Update Status</h2>
            <div className="flex flex-wrap gap-2">
              {ticket.status !== "OPEN" && (
                <button
                  onClick={() => handleStatusChange("OPEN")}
                  disabled={updatingStatus}
                  className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-medium hover:bg-emerald-200 dark:hover:bg-emerald-900 disabled:opacity-50"
                >
                  Mark Open
                </button>
              )}
              {ticket.status !== "IN_PROGRESS" && (
                <button
                  onClick={() => handleStatusChange("IN_PROGRESS")}
                  disabled={updatingStatus}
                  className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-lg text-sm font-medium hover:bg-amber-200 dark:hover:bg-amber-900 disabled:opacity-50"
                >
                  In Progress
                </button>
              )}
              {ticket.status !== "RESOLVED" && (
                <button
                  onClick={() => handleStatusChange("RESOLVED")}
                  disabled={updatingStatus}
                  className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900 disabled:opacity-50"
                >
                  Mark Resolved
                </button>
              )}
              {ticket.status !== "CLOSED" && (
                <button
                  onClick={() => handleStatusChange("CLOSED")}
                  disabled={updatingStatus}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50"
                >
                  Close Ticket
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {attachments.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Attachments</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.fileUrl}
                  download={attachment.fileName}
                  className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                >
                  <MdAttachFile className="w-6 h-6 text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {attachment.fileName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {attachment.fileSize ? `${(attachment.fileSize / 1024).toFixed(2)} KB` : ""}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Comments & Updates</h2>
        </div>

        <div className="p-6">
          {comments.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
              No comments yet. You can add a comment below.
            </p>
          ) : (
            <div className="space-y-4 mb-6">
              {comments.map((comment) => (
                <div key={comment.id} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {comment.user?.name || "User"}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{comment.comment}</p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddComment} className="flex items-center gap-3">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment or update..."
              className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={submittingComment || !newComment.trim()}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-colors"
            >
              <MdSend className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function HRTicketDetailPage() {
  return (
    <div className="space-y-6">
      <TicketDetailContent />
    </div>
  );
}
