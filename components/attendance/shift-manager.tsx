"use client";

import { useState, useCallback, useEffect } from "react";
import { MdAdd, MdEdit, MdDelete, MdSearch, MdRefresh, MdAccessTime } from "react-icons/md";
import { Spinner } from "@/components/ui/loaders/spinner";
import { dismissToast, showError, showLoading, showSuccess } from "@/lib/toast";
import { fetchShifts, createShift, updateShift, deleteShift, type ShiftListItem } from "@/lib/client/attendance";

type ShiftFormData = {
  id?: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  gracePeriodMins: number;
  halfDayHours: number;
  minWorkingHours: number;
  isFlexible: boolean;
  isNightShift: boolean;
  isActive: boolean;
};

type ShiftManagerProps = {
  initialData?: {
    shifts: ShiftListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export function ShiftManager({ initialData }: ShiftManagerProps) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftListItem | null>(null);
  const [formData, setFormData] = useState<ShiftFormData>({
    name: "",
    code: "",
    startTime: "09:00",
    endTime: "18:00",
    gracePeriodMins: 0,
    halfDayHours: 4,
    minWorkingHours: 8,
    isFlexible: false,
    isNightShift: false,
    isActive: true,
  });

  const [data, setData] = useState<{
    shifts: ShiftListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(initialData || {
    shifts: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  useEffect(() => {
    if (initialData) {
      setData(initialData);
    }
  }, [initialData]);

  const loadShifts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchShifts({ page: 1, limit: 20 });
      if (result.error) {
        showError(result.error);
        return;
      }
      if (result.data) {
        setData(result.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpenModal = (shift?: ShiftListItem) => {
    if (shift) {
      setEditingShift(shift);
      setFormData({
        id: shift.id,
        name: shift.name,
        code: shift.code,
        startTime: shift.startTime,
        endTime: shift.endTime,
        gracePeriodMins: shift.gracePeriodMins,
        halfDayHours: shift.halfDayHours,
        minWorkingHours: shift.minWorkingHours,
        isFlexible: shift.isFlexible,
        isNightShift: shift.isNightShift,
        isActive: shift.isActive,
      });
    } else {
      setEditingShift(null);
      setFormData({
        name: "",
        code: "",
        startTime: "09:00",
        endTime: "18:00",
        gracePeriodMins: 0,
        halfDayHours: 4,
        minWorkingHours: 8,
        isFlexible: false,
        isNightShift: false,
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingShift(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = showLoading(editingShift ? "Updating shift..." : "Creating shift...");

    try {
      let result;
      if (editingShift) {
        result = await updateShift({ id: editingShift.id, ...formData });
      } else {
        result = await createShift(formData);
      }

      if (result.error) {
        dismissToast(toastId);
        showError(result.error);
        return;
      }

      dismissToast(toastId);
      showSuccess(editingShift ? "Shift updated successfully!" : "Shift created successfully!");
      handleCloseModal();
      loadShifts();
    } catch (error) {
      dismissToast(toastId);
      showError("Something went wrong");
    }
  };

  const handleDelete = async (shiftId: string) => {
    if (!confirm("Are you sure you want to delete this shift?")) return;

    const toastId = showLoading("Deleting shift...");
    try {
      const result = await deleteShift(shiftId);
      if (result.error) {
        dismissToast(toastId);
        showError(result.error);
        return;
      }
      dismissToast(toastId);
      showSuccess("Shift deleted successfully!");
      loadShifts();
    } catch {
      dismissToast(toastId);
      showError("Something went wrong");
    }
  };

  const updateField = (field: keyof ShiftFormData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
      <div className="p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Shifts</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadShifts()}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
              title="Refresh"
            >
              <MdRefresh className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              <MdAdd className="w-4 h-4" />
              Add Shift
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-slate-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Code</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Timing</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Grace Period</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Min Hours</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <Spinner />
                </td>
              </tr>
            ) : data.shifts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                  No shifts found. Create your first shift.
                </td>
              </tr>
            ) : (
              data.shifts.map((shift) => (
                <tr key={shift.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <MdAccessTime className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <span className="font-medium text-gray-900 dark:text-white">{shift.name}</span>
                    </div>
                    {shift.isNightShift && (
                      <span className="ml-7 text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 rounded">Night</span>
                    )}
                    {shift.isFlexible && (
                      <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded">Flexible</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{shift.code}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {shift.startTime} - {shift.endTime}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{shift.gracePeriodMins} mins</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{shift.minWorkingHours} hrs</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        shift.isActive ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400"
                      }`}
                    >
                      {shift.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleOpenModal(shift)}
                        className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                        title="Edit"
                      >
                        <MdEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(shift.id)}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                        title="Delete"
                      >
                        <MdDelete className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              {editingShift ? "Edit Shift" : "Add New Shift"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shift Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shift Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => updateField("code", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => updateField("startTime", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => updateField("endTime", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grace Period</label>
                  <input
                    type="number"
                    value={formData.gracePeriodMins}
                    onChange={(e) => updateField("gracePeriodMins", parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Half Day (hrs)</label>
                  <input
                    type="number"
                    value={formData.halfDayHours}
                    onChange={(e) => updateField("halfDayHours", parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                    step="0.5"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Hours</label>
                  <input
                    type="number"
                    value={formData.minWorkingHours}
                    onChange={(e) => updateField("minWorkingHours", parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                    step="0.5"
                    min="0"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isFlexible}
                    onChange={(e) => updateField("isFlexible", e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Flexible Shift</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isNightShift}
                    onChange={(e) => updateField("isNightShift", e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Night Shift</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => updateField("isActive", e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingShift ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
