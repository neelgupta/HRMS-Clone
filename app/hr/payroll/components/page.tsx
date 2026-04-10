"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { 
  MdAdd, 
  MdArrowBack, 
  MdEdit, 
  MdDelete, 
  MdMoney,
  MdCheck,
} from "react-icons/md";

type SalaryComponent = {
  id: string;
  name: string;
  type: string;
  category: string;
  isFixed: boolean;
  isTaxable: boolean;
  isActive: boolean;
};

const componentCategories = [
  { value: "BASIC", label: "Basic" },
  { value: "HRA", label: "HRA" },
  { value: "CONVEYANCE", label: "Conveyance" },
  { value: "SPECIAL_ALLOWANCE", label: "Special Allowance" },
  { value: "BONUS", label: "Bonus" },
  { value: "PF", label: "PF" },
  { value: "ESI", label: "ESI" },
  { value: "TDS", label: "TDS" },
  { value: "PROFESSIONAL_TAX", label: "Professional Tax" },
  { value: "LOAN", label: "Loan" },
  { value: "OTHER", label: "Other" },
];

export default function PayrollComponentsPage() {
  const router = useRouter();
  const [components, setComponents] = useState<SalaryComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "EARNING" as "EARNING" | "DEDUCTION",
    category: "BASIC",
    isFixed: true,
    isTaxable: false,
  });

  useEffect(() => {
    fetchComponents();
  }, []);

  function fetchComponents() {
    fetch("/api/payroll/components")
      .then(r => r.json())
      .then(data => {
        if (data.components) setComponents(data.components);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/payroll/components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, isActive: true }),
        credentials: "include",
      });

      if (res.ok) {
        toast.success("Component created successfully");
        setShowAddModal(false);
        setFormData({ name: "", type: "EARNING", category: "BASIC", isFixed: true, isTaxable: false });
        fetchComponents();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to create component");
      }
    } catch {
      toast.error("Failed to create component");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this component?")) return;
    
    try {
      const res = await fetch(`/api/payroll/components/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Component deleted");
        fetchComponents();
      }
    } catch {
      toast.error("Failed to delete");
    }
  }

  const earningComponents = components.filter(c => c.type === "EARNING");
  const deductionComponents = components.filter(c => c.type === "DEDUCTION");

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          <MdArrowBack className="text-xl" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Salary Components
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Manage salary components for your organization
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-semibold"
        >
          <MdAdd className="text-lg" />
          Add Component
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Earnings */}
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <MdCheck className="text-xl" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Earnings</h2>
            </div>

            {earningComponents.length === 0 ? (
              <p className="text-center text-slate-500 dark:text-slate-400 py-8">No earnings components yet</p>
            ) : (
              <div className="space-y-3">
                {earningComponents.map(comp => (
                  <div key={comp.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{comp.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{comp.category}</p>
                    </div>
                    <div className="flex gap-2">
                      {comp.isFixed && (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Fixed</span>
                      )}
                      {comp.isTaxable && (
                        <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Taxable</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deductions */}
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <MdMoney className="text-xl" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Deductions</h2>
            </div>

            {deductionComponents.length === 0 ? (
              <p className="text-center text-slate-500 dark:text-slate-400 py-8">No deductions components yet</p>
            ) : (
              <div className="space-y-3">
                {deductionComponents.map(comp => (
                  <div key={comp.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{comp.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{comp.category}</p>
                    </div>
                    <div className="flex gap-2">
                      {comp.isFixed && (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Fixed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Salary Component</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Component Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                >
                  <option value="EARNING">Earning</option>
                  <option value="DEDUCTION">Deduction</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                >
                  {componentCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isFixed}
                    onChange={(e) => setFormData({ ...formData, isFixed: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Fixed Amount</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isTaxable}
                    onChange={(e) => setFormData({ ...formData, isTaxable: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Taxable</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Add Component"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}