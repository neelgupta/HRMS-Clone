"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MdArrowBack, MdSend, MdAttachFile } from "react-icons/md";
import { EmployeeLayout } from "@/components/employee";
import { getTicket, getTicketComments, addTicketComment, type Ticket, type TicketComment } from "@/lib/client/ticket";

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

function TicketDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      setSubmitting(true);
      await addTicketComment(id, { comment: newComment });
      setNewComment("");
      fetchData();
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setSubmitting(false);
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
        <p className="text-slate-500 mb-2">{error || "Ticket not found."}</p>
        <Link href="/dashboard/employee/help" className="mt-2 text-indigo-600 hover:underline">
          Back to My Tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/employee/help"
        className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      >
        <MdArrowBack className="w-4 h-4" />
        Back to My Tickets
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
              <p className="text-sm text-slate-500 dark:text-slate-400">Category</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                {categoryLabels[ticket.category] || ticket.category}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Priority</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{ticket.priority}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Created</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                {new Date(ticket.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Due Date</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                {ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : "Not set"}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Description</h2>
            <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <p className="text-sm text-slate-900 dark:text-white whitespace-pre-wrap">{ticket.description}</p>
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
              disabled={submitting || !newComment.trim()}
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

export default function TicketDetailPage() {
  return (
    <EmployeeLayout title="Ticket Details" subtitle="View and manage your support ticket">
      <TicketDetailContent />
    </EmployeeLayout>
  );
}