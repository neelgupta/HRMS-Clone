"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MdAccountTree, MdPerson, MdWork, MdExpandMore, MdExpandLess, MdGridView, MdViewList } from "react-icons/md";
import { Spinner } from "@/components/ui/loaders/spinner";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

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
        className={`relative flex min-w-[180px] flex-col items-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md ${level === 0 ? "border-indigo-300 bg-indigo-50" : ""
          }`}
      >
        {node.photoUrl ? (
          <img
            src={node.photoUrl}
            alt={node.name}
            className="h-16 w-16 rounded-full object-cover border-2 border-indigo-200"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <MdPerson className="text-2xl" />
          </div>
        )}
        <p className="mt-2 text-sm font-semibold text-slate-900">{node.name}</p>
        {node.designation && <p className="text-xs text-slate-500">{node.designation}</p>}
        {node.department && <p className="text-xs text-indigo-600">{node.department}</p>}

        {hasChildren && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="absolute -bottom-3 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
          >
            {expanded ? <MdExpandLess className="text-lg" /> : <MdExpandMore className="text-lg" />}
          </button>
        )}
      </div>

      {hasChildren && expanded && (
        <div className="mt-6 flex flex-wrap justify-center gap-8">
          <div className="relative flex flex-col items-center">
            <div className="absolute -top-3 h-3 w-0.5 bg-slate-300" />
            {node.children.map((child, idx) => (
              <div key={child.id} className="relative">
                {idx > 0 && <div className="absolute -top-3 left-1/2 h-0.5 w-full bg-slate-300" />}
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
        <div key={dept.department} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <MdWork className="text-indigo-600" />
            {dept.department}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {dept && console.log(dept) && dept?.employees && dept?.employees?.map((emp) => (
              <div
                key={emp.id}
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"
              >
                {emp.photoUrl ? (
                  <img
                    src={emp.photoUrl}
                    alt={emp.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-sm font-medium">
                    {getInitials(emp.name)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-slate-900">{emp.name}</p>
                  {emp.designation && <p className="text-xs text-slate-500">{emp.designation}</p>}
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
        const response = await fetch(`/api/employees/org-chart?type=${viewMode}`);
        if (!response.ok) throw new Error("Failed to fetch");

        const result = await response.json();

        if (viewMode === "tree") {
          setOrgData(result.data || []);
        } else {
          setDeptData(result.data || []);
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
      <DashboardLayout title="Organization" subtitle="View your organization structure">
        <div className="flex items-center justify-center py-20">
          <Spinner className="text-indigo-600" label="Loading" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Organization" subtitle="View your organization structure">
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-slate-600">{error}</p>
          <button
            type="button"
            onClick={() => router.push("/dashboard/hr/employees")}
            className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Back to Employees
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Organization" subtitle="View your organization structure">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/dashboard/hr/employees")}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Back to Employees
        </button>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => handleViewModeChange("tree")}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${viewMode === "tree"
              ? "bg-indigo-100 text-indigo-600"
              : "text-slate-600 hover:bg-slate-50"
              }`}
          >
            <MdAccountTree className="text-lg" />
            Tree View
          </button>
          <button
            type="button"
            onClick={() => handleViewModeChange("department")}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${viewMode === "department"
              ? "bg-indigo-100 text-indigo-600"
              : "text-slate-600 hover:bg-slate-50"
              }`}
          >
            <MdGridView className="text-lg" />
            By Department
          </button>
        </div>
      </div>

      {viewMode === "tree" ? (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          {orgData.length === 0 ? (
            <div className="py-12 text-center">
              <MdAccountTree className="mx-auto text-4xl text-slate-300" />
              <p className="mt-4 text-slate-500">No organization data available.</p>
              <p className="mt-1 text-sm text-slate-400">Add employees with reporting managers to see the org chart.</p>
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
    </DashboardLayout>
  );
}