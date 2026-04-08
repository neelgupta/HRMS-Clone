"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MdAccountTree, MdPerson, MdWork, MdExpandMore, MdExpandLess, MdGridView, MdViewList } from "react-icons/md";
import { Spinner } from "@/components/ui/loaders/spinner";
import { ROUTES } from "@/lib/constants";

type OrgChartNode = {
  id: string;
  name: string;
  designation: string | null;
  department: string | null;
  photoUrl: string | null;
  children: OrgChartNode[];
};

type DepartmentGroup = {
  department: string;
  employees: Array<{
    id: string;
    name: string;
    designation: string | null;
    photoUrl: string | null;
  }>;
};

type ViewMode = "tree" | "department";

function TreeNode({ node, level = 0 }: { node: OrgChartNode; level?: number }) {
  const [expanded, setExpanded] = useState(level < 2);
  const hasChildren = node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative flex min-w-[180px] flex-col items-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800 ${level === 0 ? "border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/30" : ""
          }`}
      >
        {node.photoUrl ? (
          <img
            src={node.photoUrl}
            alt={node.name}
            className="h-16 w-16 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-700"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
            <MdPerson className="text-2xl" />
          </div>
        )}
        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{node.name}</p>
        {node.designation && <p className="text-xs text-slate-500 dark:text-slate-400">{node.designation}</p>}
        {node.department && <p className="text-xs text-indigo-600 dark:text-indigo-400">{node.department}</p>}

        {hasChildren && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="absolute -bottom-3 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            {expanded ? <MdExpandLess className="text-lg" /> : <MdExpandMore className="text-lg" />}
          </button>
        )}
      </div>

      {hasChildren && expanded && (
        <div className="mt-6 flex flex-wrap justify-center gap-8">
          <div className="relative flex flex-col items-center">
            <div className="absolute -top-3 h-3 w-0.5 bg-slate-300 dark:bg-slate-600" />
            {node.children.map((child, idx) => (
              <div key={child.id} className="relative">
                {idx > 0 && <div className="absolute -top-3 left-1/2 h-0.5 w-full bg-slate-300 dark:bg-slate-600" />}
                <TreeNode node={child} level={level + 1} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DepartmentView({ departments }: { departments: DepartmentGroup[] }) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {departments.map((dept) => (
        <div key={dept.department} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
            <MdWork className="text-indigo-600 dark:text-indigo-400" />
            {dept.department}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {dept.employees && dept.employees.map((emp) => (
              <div
                key={emp.id}
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-700/50"
              >
                {emp.photoUrl ? (
                  <img
                    src={emp.photoUrl}
                    alt={emp.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-sm font-medium dark:bg-indigo-900/30 dark:text-indigo-400">
                    {getInitials(emp.name)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{emp.name}</p>
                  {emp.designation && <p className="text-xs text-slate-500 dark:text-slate-400">{emp.designation}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OrganizationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orgData, setOrgData] = useState<OrgChartNode[]>([]);
  const [deptData, setDeptData] = useState<DepartmentGroup[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("tree");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const typeParam = viewMode === "department" ? "by-department" : "tree";
        const response = await fetch(`/api/employees/org-chart?type=${typeParam}`);
        if (!response.ok) throw new Error("Failed to fetch");

        const result = await response.json();

        if (viewMode === "tree") {
          setOrgData(result.data || []);
        } else {
          const deptDataRaw = result.data || {};
          const transformed: DepartmentGroup[] = Object.entries(deptDataRaw).map(([department, employees]) => ({
            department,
            employees: (employees as Array<{ id: string; firstName: string; lastName: string; designation: string | null; photoUrl: string | null }>).map((emp) => ({
              id: emp.id,
              name: `${emp.firstName} ${emp.lastName}`,
              designation: emp.designation,
              photoUrl: emp.photoUrl,
            })),
          }));
          setDeptData(transformed);
        }
      } catch {
        setError("Failed to load organization data.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [viewMode]);

  const handleViewModeChange = (mode: ViewMode) => {
    setLoading(true);
    setViewMode(mode);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="text-indigo-600" label="Loading" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-slate-600 dark:text-slate-400">{error}</p>
        <button
          type="button"
          onClick={() => router.push(ROUTES.DASHBOARD.HR.EMPLOYEES.LIST)}
          className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          Back to Employees
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push(ROUTES.DASHBOARD.HR.EMPLOYEES.LIST)}
          className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          ← Back to Employees
        </button>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => handleViewModeChange("tree")}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${viewMode === "tree"
              ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
              : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
          >
            <MdAccountTree className="text-lg" />
            Tree View
          </button>
          <button
            type="button"
            onClick={() => handleViewModeChange("department")}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${viewMode === "department"
              ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
              : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
          >
            <MdGridView className="text-lg" />
            By Department
          </button>
        </div>
      </div>

      {viewMode === "tree" ? (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          {orgData.length === 0 ? (
            <div className="py-12 text-center">
              <MdAccountTree className="mx-auto text-4xl text-slate-300 dark:text-slate-600" />
              <p className="mt-4 text-slate-500 dark:text-slate-400">No organization data available.</p>
              <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Add employees with reporting managers to see the org chart.</p>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-8">
              {orgData.map((node) => (
                <TreeNode key={node.id} node={node} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <DepartmentView departments={deptData} />
      )}
    </>
  );
}