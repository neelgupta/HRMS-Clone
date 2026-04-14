"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { MdSearch, MdAdd, MdFilterList } from "react-icons/md";
import { HiOutlineExclamation } from "react-icons/hi";
import { getTickets, updateTicket, type Ticket, type TicketStats } from "@/lib/client/ticket";

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

type FilterStatus = "" | "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export default function HRTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats>({ total: 0, OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("");
  const [filterCategory, setFilterCategory] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const filters: Record<string, string> = {};
      if (filterStatus) filters.status = filterStatus;
      if (filterCategory) filters.category = filterCategory;
      if (search) filters.search = search;

      const data = await getTickets(filters as { status?: string; category?: string; search?: string });
      setTickets(data.tickets);
      setStats(data.stats);
    } catch (error) {
      toast.error("Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      setUpdating(true);
      await updateTicket(ticketId, { status: newStatus });
      toast.success("Ticket status updated");
      fetchTickets();
    } catch (error) {
      toast.error("Failed to update ticket");
    } finally {
      setUpdating(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Ticket Management</h1>
              <form onSubmit={handleSearch} className="relative">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                />
              </form>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value as FilterStatus);
                  fetchTickets();
                }}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Status</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  fetchTickets();
                }}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Categories</option>
                <option value="GENERAL">General Inquiry</option>
                <option value="IT_SUPPORT">IT Support</option>
                <option value="HR_RELATED">HR Related</option>
                <option value="PAYROLL">Payroll</option>
                <option value="LEAVE_MANAGEMENT">Leave Management</option>
                <option value="ATTENDANCE">Attendance</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
              <p className="text-sm font-medium opacity-90">Total</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
              <p className="text-sm font-medium opacity-90">Open</p>
              <p className="text-2xl font-bold mt-1">{stats.OPEN}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white">
              <p className="text-sm font-medium opacity-90">In Progress</p>
              <p className="text-2xl font-bold mt-1">{stats.IN_PROGRESS}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
              <p className="text-sm font-medium opacity-90">Resolved</p>
              <p className="text-2xl font-bold mt-1">{stats.RESOLVED}</p>
            </div>
            <div className="bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl p-4 text-white">
              <p className="text-sm font-medium opacity-90">Closed</p>
              <p className="text-2xl font-bold mt-1">{stats.CLOSED}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">No tickets found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Ticket</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Employee</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Subject</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Assignee</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Category</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Priority</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Created</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="py-3 px-4 text-sm text-slate-900 dark:text-white font-medium">
                        #{ticket.ticketNumber}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                        {ticket.employee ? `${ticket.employee.firstName} ${ticket.employee.lastName}` : "-"}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-900 dark:text-white max-w-xs truncate">
                        {ticket.title}
                      </td>
                      <td className="py-3 px-4">
                        {ticket.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                              <span className="text-xs font-medium text-indigo-600 dark:text-indigo-300">
                                {ticket.assignedTo.name?.charAt(0) || "?"}
                              </span>
                            </div>
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              {ticket.assignedTo.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 dark:text-slate-500">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                        {categoryLabels[ticket.category] || ticket.category}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[ticket.priority]}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[ticket.status]}`}>
                          {ticket.status === "IN_PROGRESS" ? "In Progress" : ticket.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/dashboard/hr/tickets/${ticket.id}`}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}