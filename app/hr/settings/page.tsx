"use client";

import { useState, useEffect, useCallback } from "react";
import { MdAdd, MdEdit, MdDelete, MdBusiness, MdWork } from "react-icons/md";
import { Spinner } from "@/components/ui/loaders/spinner";
import { dismissToast, showError, showLoading, showSuccess } from "@/lib/toast";

type Department = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  headId: string | null;
  _count: { employees: number };
};

type Designation = {
  id: string;
  name: string;
  code: string;
  level: number;
  description: string | null;
};

type Tab = "departments" | "designations";

function DepartmentModal({
  department,
  onSave,
  onClose,
}: {
  department?: Department | null;
  onSave: (data: { name: string; code: string; description?: string }) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: department?.name || "",
    code: department?.code || "",
    description: department?.description || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      showError("Name and code are required.");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-800">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          {department ? "Edit Department" : "Add Department"}
        </h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900"
              placeholder="Human Resources"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Code</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900"
              placeholder="hr"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900"
              rows={3}
              placeholder="Department description..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:hover:bg-indigo-500"
            >
              {department ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DesignationModal({
  designation,
  onSave,
  onClose,
}: {
  designation?: Designation | null;
  onSave: (data: { name: string; code: string; level: number; description?: string }) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: designation?.name || "",
    code: designation?.code || "",
    level: designation?.level || 1,
    description: designation?.description || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      showError("Name and code are required.");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-800">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          {designation ? "Edit Designation" : "Add Designation"}
        </h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900"
              placeholder="Software Developer"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Code</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900"
              placeholder="software-developer"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Level</label>
            <input
              type="number"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 1 })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900"
              min={1}
              max={20}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900"
              rows={3}
              placeholder="Job role description..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:hover:bg-indigo-500"
            >
              {designation ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DepartmentCard({ department, onEdit, onDelete }: { department: Department; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-base font-semibold text-slate-900 dark:text-white">{department.name}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Code: {department.code}</p>
        </div>
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
          {department._count.employees} employees
        </span>
      </div>
      {department.description && (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{department.description}</p>
      )}
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
        >
          <MdEdit className="text-lg" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-rose-400"
        >
          <MdDelete className="text-lg" />
        </button>
      </div>
    </div>
  );
}

function DesignationCard({ designation, onEdit, onDelete }: { designation: Designation; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-base font-semibold text-slate-900 dark:text-white">{designation.name}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Code: {designation.code}</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
          Level {designation.level}
        </span>
      </div>
      {designation.description && (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{designation.description}</p>
      )}
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
        >
          <MdEdit className="text-lg" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-rose-400"
        >
          <MdDelete className="text-lg" />
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("departments");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Department | Designation | null>(null);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch("/api/departments");
      const data = await res.json();
      setDepartments(data.departments || []);
    } catch (error) {
      console.error("Failed to fetch departments:", error);
    }
  }, []);

  const fetchDesignations = useCallback(async () => {
    try {
      const res = await fetch("/api/designations");
      const data = await res.json();
      setDesignations(data.designations || []);
    } catch (error) {
      console.error("Failed to fetch designations:", error);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      await Promise.all([fetchDepartments(), fetchDesignations()]);
      setLoading(false);
    }
    loadData();
  }, [fetchDepartments, fetchDesignations]);

  const handleCreateDepartment = async (data: { name: string; code: string; description?: string }) => {
    const toastId = showLoading("Creating department...");
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      
      dismissToast(toastId);
      showSuccess("Department created successfully.");
      setShowModal(false);
      fetchDepartments();
    } catch (error) {
      dismissToast(toastId);
      showError(error instanceof Error ? error.message : "Failed to create department.");
    }
  };

  const handleUpdateDepartment = async (data: { name: string; code: string; description?: string }) => {
    if (!editingItem) return;
    const toastId = showLoading("Updating department...");
    try {
      const res = await fetch(`/api/departments/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      
      dismissToast(toastId);
      showSuccess("Department updated successfully.");
      setEditingItem(null);
      setShowModal(false);
      fetchDepartments();
    } catch (error) {
      dismissToast(toastId);
      showError(error instanceof Error ? error.message : "Failed to update department.");
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    const toastId = showLoading("Deleting department...");
    try {
      const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      dismissToast(toastId);
      showSuccess("Department deleted.");
      fetchDepartments();
    } catch (error) {
      dismissToast(toastId);
      showError(error instanceof Error ? error.message : "Failed to delete department.");
    }
  };

  const handleCreateDesignation = async (data: { name: string; code: string; level: number; description?: string }) => {
    const toastId = showLoading("Creating designation...");
    try {
      const res = await fetch("/api/designations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      
      dismissToast(toastId);
      showSuccess("Designation created successfully.");
      setShowModal(false);
      fetchDesignations();
    } catch (error) {
      dismissToast(toastId);
      showError(error instanceof Error ? error.message : "Failed to create designation.");
    }
  };

  const handleUpdateDesignation = async (data: { name: string; code: string; level: number; description?: string }) => {
    if (!editingItem) return;
    const toastId = showLoading("Updating designation...");
    try {
      const res = await fetch(`/api/designations/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      
      dismissToast(toastId);
      showSuccess("Designation updated successfully.");
      setEditingItem(null);
      setShowModal(false);
      fetchDesignations();
    } catch (error) {
      dismissToast(toastId);
      showError(error instanceof Error ? error.message : "Failed to update designation.");
    }
  };

  const handleDeleteDesignation = async (id: string) => {
    if (!confirm("Are you sure you want to delete this designation?")) return;
    const toastId = showLoading("Deleting designation...");
    try {
      const res = await fetch(`/api/designations/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      dismissToast(toastId);
      showSuccess("Designation deleted.");
      fetchDesignations();
    } catch (error) {
      dismissToast(toastId);
      showError(error instanceof Error ? error.message : "Failed to delete designation.");
    }
  };

  const handleSave = (data: any) => {
    if (activeTab === "departments") {
      if (editingItem) {
        handleUpdateDepartment(data);
      } else {
        handleCreateDepartment(data);
      }
    } else {
      if (editingItem) {
        handleUpdateDesignation(data);
      } else {
        handleCreateDesignation(data);
      }
    }
  };

  const openModal = (item?: Department | Designation) => {
    setEditingItem(item || null);
    setShowModal(true);
  };

  return (
    <>
      <div className="mb-6 flex items-center gap-4 border-b border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setActiveTab("departments")}
          className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition ${
            activeTab === "departments"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <MdBusiness className="text-lg" />
          Departments
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("designations")}
          className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition ${
            activeTab === "designations"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <MdWork className="text-lg" />
          Designations
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="text-indigo-600" label="Loading" />
        </div>
      ) : (
        <>
          {activeTab === "departments" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => openModal()}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 dark:hover:bg-indigo-500"
                >
                  <MdAdd className="text-lg" />
                  Add Department
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {departments.length === 0 ? (
                  <p className="col-span-full py-8 text-center text-slate-500 dark:text-slate-400">No departments found.</p>
                ) : (
                  departments.map((dept) => (
                    <DepartmentCard
                      key={dept.id}
                      department={dept}
                      onEdit={() => openModal(dept)}
                      onDelete={() => handleDeleteDepartment(dept.id)}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "designations" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => openModal()}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 dark:hover:bg-indigo-500"
                >
                  <MdAdd className="text-lg" />
                  Add Designation
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {designations.length === 0 ? (
                  <p className="col-span-full py-8 text-center text-slate-500 dark:text-slate-400">No designations found.</p>
                ) : (
                  designations.map((desig) => (
                    <DesignationCard
                      key={desig.id}
                      designation={desig}
                      onEdit={() => openModal(desig)}
                      onDelete={() => handleDeleteDesignation(desig.id)}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}

      {showModal && (
        activeTab === "departments" ? (
          <DepartmentModal
            department={editingItem as Department | null}
            onSave={handleSave}
            onClose={() => {
              setShowModal(false);
              setEditingItem(null);
            }}
          />
        ) : (
          <DesignationModal
            designation={editingItem as Designation | null}
            onSave={handleSave}
            onClose={() => {
              setShowModal(false);
              setEditingItem(null);
            }}
          />
        )
      )}
    </>
  );
}