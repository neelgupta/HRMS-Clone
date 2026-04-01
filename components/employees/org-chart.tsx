"use client";

import { useState } from "react";
import { MdExpandMore, MdExpandLess, MdPerson, MdBusiness, MdDriveEta } from "react-icons/md";

type OrgChartNode = {
  id: string;
  name: string;
  designation: string | null;
  department: string | null;
  photoUrl: string | null;
  children: OrgChartNode[];
};

type OrgChartProps = {
  data: OrgChartNode[];
  viewMode: "tree" | "list";
  onEmployeeClick: (id: string) => void;
};

export function OrgChart({ data, viewMode, onEmployeeClick }: OrgChartProps) {
  if (viewMode === "list") {
    return <DepartmentView data={data} onEmployeeClick={onEmployeeClick} />;
  }
  return <TreeView data={data} onEmployeeClick={onEmployeeClick} />;
}

function TreeView({ data, onEmployeeClick }: { data: OrgChartNode[]; onEmployeeClick: (id: string) => void }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-max p-4">
        <div className="flex flex-col items-center">
          {data.map((root) => (
            <TreeNode key={root.id} node={root} onEmployeeClick={onEmployeeClick} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TreeNode({ node, onEmployeeClick }: { node: OrgChartNode; onEmployeeClick: (id: string) => void }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative z-10">
        <button
          type="button"
          onClick={() => onEmployeeClick(node.id)}
          className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-100"
        >
          <div className="mb-2 h-14 w-14 overflow-hidden rounded-full border-2 border-slate-100 bg-slate-50">
            {node.photoUrl ? (
              <img src={node.photoUrl} alt={node.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
                <MdPerson className="text-2xl text-indigo-400" />
              </div>
            )}
          </div>
          <p className="text-sm font-semibold text-slate-900">{node.name}</p>
          <p className="text-xs text-slate-500">{node.designation || "Employee"}</p>
          {node.department && (
            <span className="mt-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {node.department}
            </span>
          )}
        </button>
      </div>

      {hasChildren && (
        <>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="my-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
          >
            {expanded ? <MdExpandLess className="text-lg" /> : <MdExpandMore className="text-lg" />}
          </button>

          <div className="relative flex items-start">
            <div className="absolute left-1/2 top-0 h-4 w-0.5 -translate-x-1/2 bg-slate-200" />

            {expanded && (
              <div className="flex gap-4 pt-4">
                {node.children.map((child, index) => (
                  <div key={child.id} className="relative">
                    {node.children.length > 1 && (
                      <>
                        {index === 0 && (
                          <div className="absolute bottom-full left-1/2 h-4 w-[calc(50%+1rem)] -translate-x-full border-b border-r border-slate-200" />
                        )}
                        {index === node.children.length - 1 && (
                          <div className="absolute bottom-full right-1/2 h-4 w-[calc(50%+1rem)] translate-x-0 border-b border-l border-slate-200" />
                        )}
                        {index > 0 && index < node.children.length - 1 && (
                          <div className="absolute bottom-full left-0 h-4 w-full border-b border-slate-200" />
                        )}
                      </>
                    )}
                    <TreeNode node={child} onEmployeeClick={onEmployeeClick} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function DepartmentView({ data, onEmployeeClick }: { data: OrgChartNode[]; onEmployeeClick: (id: string) => void }) {
  const getAllDepartments = (nodes: OrgChartNode[]): Map<string, OrgChartNode[]> => {
    const deptMap = new Map<string, OrgChartNode[]>();
    
    const traverse = (nodeList: OrgChartNode[]) => {
      for (const node of nodeList) {
        const dept = node.department || "Other";
        if (!deptMap.has(dept)) {
          deptMap.set(dept, []);
        }
        deptMap.get(dept)!.push(node);
        if (node.children.length > 0) {
          traverse(node.children);
        }
      }
    };
    
    traverse(nodes);
    return deptMap;
  };

  const departments = getAllDepartments(data);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from(departments.entries()).map(([dept, employees]) => (
        <div key={dept} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
              <MdBusiness className="text-xl text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{dept}</h3>
              <p className="text-xs text-slate-500">{employees.length} members</p>
            </div>
          </div>

          <div className="divide-y divide-slate-50 p-3">
            {employees.map((emp) => (
              <button
                key={emp.id}
                type="button"
                onClick={() => onEmployeeClick(emp.id)}
                className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-slate-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
                  {emp.photoUrl ? (
                    <img src={emp.photoUrl} alt={emp.name} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <MdPerson className="text-lg text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{emp.name}</p>
                  <p className="truncate text-xs text-slate-500">{emp.designation || "Employee"}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}