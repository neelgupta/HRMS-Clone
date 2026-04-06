"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineCalendar, HiOutlineX } from "react-icons/hi";
import { TextInput } from "@/components/ui/text-input";
import { FormField } from "@/components/ui/form-field";
import { ToggleField } from "@/components/ui/toggle-field";
import { Skeleton } from "@/components/ui/loaders/skeleton";
import { Modal } from "@/components/ui/modal";
import type { Holiday, HolidayInput } from "@/lib/client/leave";

interface HolidayFormData {
  name: string;
  date: string;
  description: string;
  branchId: string | null;
  isOptional: boolean;
  isRecurring: boolean;
}

const defaultFormData: HolidayFormData = {
  name: "",
  date: "",
  description: "",
  branchId: null,
  isOptional: false,
  isRecurring: true,
};

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<HolidayFormData>(defaultFormData);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchHolidays();
  }, [year]);

  async function fetchBranches() {
    try {
      const res = await fetch("/api/branches", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setBranches(data.branches || []);
      }
    } catch {
      // Ignore branch fetch errors
    }
  }

  async function fetchHolidays() {
    setLoading(true);
    try {
      const res = await fetch(`/api/leave/holidays?year=${year}`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setHolidays(data.holidays || []);
      }
    } catch {
      toast.error("Failed to fetch holidays");
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setFormData(defaultFormData);
    setEditingId(null);
    setModalOpen(true);
  }

  function openEditModal(holiday: Holiday) {
    setFormData({
      name: holiday.name,
      date: holiday.date.split("T")[0],
      description: holiday.description || "",
      branchId: holiday.branchId,
      isOptional: holiday.isOptional,
      isRecurring: holiday.isRecurring,
    });
    setEditingId(holiday.id);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingId ? `/api/leave/holidays/${editingId}` : "/api/leave/holidays";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          date: formData.date,
          description: formData.description || undefined,
          branchId: formData.branchId || undefined,
          isOptional: formData.isOptional,
          isRecurring: formData.isRecurring,
        }),
        credentials: "include",
      });

      if (res.ok) {
        toast.success(editingId ? "Holiday updated" : "Holiday created");
        setModalOpen(false);
        fetchHolidays();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to save");
      }
    } catch {
      toast.error("Failed to save holiday");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/leave/holidays/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        toast.success("Holiday deleted");
        setDeleteConfirm(null);
        fetchHolidays();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete holiday");
    }
  }

  const sortedHolidays = [...holidays].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const upcomingHolidays = sortedHolidays.filter(h => new Date(h.date) >= new Date());
  const pastHolidays = sortedHolidays.filter(h => new Date(h.date) < new Date());

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function getDayName(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short" });
  }

  function isUpcoming(dateStr: string) {
    return new Date(dateStr) >= new Date();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Holiday Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage company holidays and calendar
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            {[year - 1, year, year + 1, year + 2].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <HiOutlinePlus className="text-lg" />
            Add Holiday
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : holidays.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
            <HiOutlineCalendar className="text-2xl text-slate-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-300 font-medium">No Holidays for {year}</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Add holidays to help employees plan their time off
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Holiday Count Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Holidays</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{holidays.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Mandatory</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {holidays.filter(h => !h.isOptional).length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Optional</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {holidays.filter(h => h.isOptional).length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Recurring</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {holidays.filter(h => h.isRecurring).length}
              </p>
            </div>
          </div>

          {/* Upcoming Holidays */}
          {upcomingHolidays.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
                Upcoming Holidays ({upcomingHolidays.length})
              </h2>
              <div className="space-y-3">
                {upcomingHolidays.map((holiday) => (
                  <div
                    key={holiday.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/30 dark:to-indigo-800/30 flex flex-col items-center justify-center">
                        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                          {getDayName(holiday.date)}
                        </span>
                        <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                          {new Date(holiday.date).getDate()}
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900 dark:text-white">{holiday.name}</h3>
                          {holiday.isOptional && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              Optional
                            </span>
                          )}
                          {holiday.isRecurring && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              Recurring
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                          {formatDate(holiday.date)}
                        </p>
                        {holiday.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                            {holiday.description}
                          </p>
                        )}
                        {holiday.branch && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            Branch: {holiday.branch.name}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(holiday)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                        >
                          <HiOutlinePencil className="text-lg" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(holiday.id)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                        >
                          <HiOutlineTrash className="text-lg" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past Holidays */}
          {pastHolidays.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
                Past Holidays ({pastHolidays.length})
              </h2>
              <div className="space-y-3">
                {pastHolidays.map((holiday) => (
                  <div
                    key={holiday.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 opacity-70"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700 flex flex-col items-center justify-center">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {getDayName(holiday.date)}
                        </span>
                        <span className="text-lg font-bold text-slate-500 dark:text-slate-400">
                          {new Date(holiday.date).getDate()}
                        </span>
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-600 dark:text-slate-300">{holiday.name}</h3>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
                          {new Date(holiday.date).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                        </p>
                      </div>

                      <button
                        onClick={() => setDeleteConfirm(holiday.id)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      >
                        <HiOutlineTrash className="text-lg" />
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
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Holiday" : "Add Holiday"} size="md">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <FormField label="Holiday Name" required>
            <TextInput
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Republic Day"
              required
            />
          </FormField>

          <FormField label="Date" required>
            <TextInput
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </FormField>

          <FormField label="Description" hint="Optional details about the holiday">
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Add any notes..."
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none transition focus:border-blue-400 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 placeholder:text-slate-400"
            />
          </FormField>

          {branches.length > 0 && (
            <FormField label="Branch" hint="Leave empty for all branches">
              <select
                value={formData.branchId || ""}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value || null })}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none transition focus:border-blue-400 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-700"
              >
                <option value="">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </FormField>
          )}

          <div className="space-y-4">
            <ToggleField
              checked={formData.isOptional}
              onChange={(checked) => setFormData({ ...formData, isOptional: checked })}
              label="Optional Holiday"
              description="Employees can choose to work on this day"
            />

            <ToggleField
              checked={formData.isRecurring}
              onChange={(checked) => setFormData({ ...formData, isRecurring: checked })}
              label="Recurring Holiday"
              description="This holiday repeats every year on the same date"
            />
          </div>

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
              disabled={submitting}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {submitting ? "Saving..." : editingId ? "Update Holiday" : "Add Holiday"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Holiday" size="sm">
        <div className="p-6">
          <div className="w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <HiOutlineTrash className="text-2xl text-red-600 dark:text-red-400" />
          </div>
          <p className="text-center text-slate-600 dark:text-slate-300">
            Are you sure you want to delete this holiday? This action cannot be undone.
          </p>
          <div className="flex gap-3 mt-6">
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
