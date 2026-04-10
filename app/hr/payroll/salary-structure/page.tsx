"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { 
  MdAccountTree, 
  MdAdd, 
  MdMoney, 
  MdChevronRight, 
  MdArrowBack,
  MdEdit,
  MdDelete,
  MdCheck,
} from "react-icons/md";

type SalaryStructure = {
  id: string;
  name: string;
  effectiveFrom: string;
  isActive: boolean;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
  items: {
    id: string;
    amount: number;
    component: {
      name: string;
      type: string;
    };
  }[];
};

type SalaryComponent = {
  id: string;
  name: string;
  type: string;
  category: string;
  isFixed: boolean;
  isTaxable: boolean;
};

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  department: { name: string } | null;
  designation: { name: string } | null;
};

type PayrollSettings = {
  defaultBasicPercent: number;
  defaultHraPercent: number;
  pfEnabled: boolean;
  pfRate: number;
  esiEnabled: boolean;
  esiRate: number;
};

export default function SalaryStructurePage() {
  const router = useRouter();
  const [settings, setSettings] = useState<PayrollSettings | null>(null);
  const [components, setComponents] = useState<SalaryComponent[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [salaryItems, setSalaryItems] = useState<{ componentId: string; amount: number }[]>([]);
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    Promise.all([
      fetch("/api/payroll/settings").then(r => r.json()),
      fetch("/api/payroll/components").then(r => r.json()),
      fetch("/api/employees?limit=100").then(r => r.json()),
      fetch("/api/payroll/salary-structure").then(r => r.json()),
    ]).then(([settingsData, componentsData, employeesData, structuresData]) => {
      if (settingsData.settings) setSettings(settingsData.settings);
      if (componentsData.components) setComponents(componentsData.components);
      if (employeesData.employees) setEmployees(employeesData.employees);
      if (structuresData.structures) setSalaryStructures(structuresData.structures);
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  function handleAddItem() {
    setSalaryItems([...salaryItems, { componentId: "", amount: 0 }]);
  }

  function handleRemoveItem(index: number) {
    setSalaryItems(salaryItems.filter((_, i) => i !== index));
  }

  function handleItemChange(index: number, field: string, value: any) {
    const newItems = [...salaryItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setSalaryItems(newItems);
  }

  async function handleSubmitStructure(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEmployee || salaryItems.length === 0) {
      toast.error("Please select employee and add salary items");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/payroll/salary-structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          name: "Salary Structure",
          effectiveFrom,
          items: salaryItems,
        }),
        credentials: "include",
      });

      if (res.ok) {
        toast.success("Salary structure assigned successfully");
        setShowAddModal(false);
        setSelectedEmployee("");
        setSalaryItems([]);
        // Refresh structures
        fetch("/api/payroll/salary-structure").then(r => r.json()).then(data => {
          if (data.structures) setSalaryStructures(data.structures);
        });
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to assign salary structure");
      }
    } catch {
      toast.error("Failed to assign salary structure");
    } finally {
      setSubmitting(false);
    }
  }

  // Calculate total gross
  const totalGross = salaryItems.reduce((sum, item) => sum + item.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

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
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Salary Structure
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Create and manage salary structures for your employees
          </p>
        </div>
      </div>

      {/* Default Structure */}
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
            <MdAccountTree className="text-2xl" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Default Structure</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Based on your payroll settings</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Basic Salary</p>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{settings?.defaultBasicPercent}%</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">of gross salary</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">House Rent Allowance</p>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{settings?.defaultHraPercent}%</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">of gross salary</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">PF Contribution</p>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{settings?.pfEnabled ? `${settings?.pfRate}%` : "Disabled"}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">employee share</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">ESI Contribution</p>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{settings?.esiEnabled ? `${settings?.esiRate}%` : "Disabled"}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">employee share</p>
          </div>
        </div>
      </div>

      {/* Salary Components */}
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <MdMoney className="text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Salary Components</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Available components for salary structure</p>
            </div>
          </div>
        </div>

        {components.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500 dark:text-slate-400">No salary components. Create them via API first.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {components.map((comp) => (
              <div key={comp.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900 dark:text-white">{comp.name}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    comp.type === "EARNING" 
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    {comp.type}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{comp.category}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Employee Structures */}
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              <MdAccountTree className="text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Employee Structures</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Assign salary structure to employees</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700"
          >
            <MdAdd className="text-lg" />
            Add Structure
          </button>
        </div>

        <div className="space-y-4">
          {salaryStructures.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <MdAccountTree className="text-3xl text-slate-400" />
              </div>
              <h3 className="font-medium text-slate-900 dark:text-white">No employee structures yet</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Add salary structure to employees to get started
              </p>
            </div>
          ) : (
            salaryStructures.map((structure) => (
              <div key={structure.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {structure.employee.firstName} {structure.employee.lastName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {structure.employee.employeeCode} • {structure.name}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    structure.isActive 
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    {structure.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {structure.items.map((item) => (
                    <span key={item.id} className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">
                      {item.component.name}: ₹{Number(item.amount).toLocaleString("en-IN")}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Effective from: {new Date(structure.effectiveFrom).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Structure Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Assign Salary Structure</h2>
            </div>

            <form onSubmit={handleSubmitStructure} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Select Employee
                </label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  required
                >
                  <option value="">Select employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Effective From
                </label>
                <input
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Salary Components
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    + Add Component
                  </button>
                </div>

                {salaryItems.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
                    Click "Add Component" to add salary items
                  </p>
                ) : (
                  <div className="space-y-3">
                    {salaryItems.map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <select
                          value={item.componentId}
                          onChange={(e) => handleItemChange(index, "componentId", e.target.value)}
                          className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                          required
                        >
                          <option value="">Select component...</option>
                          {components.filter(c => c.type === "EARNING").map((comp) => (
                            <option key={comp.id} value={comp.id}>{comp.name}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) => handleItemChange(index, "amount", parseFloat(e.target.value) || 0)}
                          placeholder="Amount"
                          className="w-32 rounded-xl border border-slate-300 bg-white px-4 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                        >
                          <MdDelete />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {totalGross > 0 && (
                  <div className="mt-4 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-900 dark:text-white">Total Gross</span>
                      <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">₹{totalGross.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedEmployee || salaryItems.length === 0}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Structure"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}