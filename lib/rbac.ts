import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/jwt";

export type AuthenticatedUser = {
  userId: string;
  companyId: string;
  email: string;
  role: string;
  name: string;
};

export type RolePermissions = {
  [key: string]: {
    employees: { read: boolean; write: boolean; delete: boolean };
    documents: { read: boolean; write: boolean; delete: boolean };
    company: { read: boolean; write: boolean; delete: boolean };
    departments: { read: boolean; write: boolean; delete: boolean };
  };
};

const rolePermissions: RolePermissions = {
  SUPER_ADMIN: {
    employees: { read: true, write: true, delete: true },
    documents: { read: true, write: true, delete: true },
    company: { read: true, write: true, delete: true },
    departments: { read: true, write: true, delete: true },
  },
  HR_ADMIN: {
    employees: { read: true, write: true, delete: true },
    documents: { read: true, write: true, delete: true },
    company: { read: true, write: true, delete: true },
    departments: { read: true, write: true, delete: true },
  },
  DEPT_MANAGER: {
    employees: { read: true, write: true, delete: false },
    documents: { read: true, write: true, delete: false },
    company: { read: false, write: false, delete: false },
    departments: { read: true, write: false, delete: false },
  },
  EMPLOYEE: {
    employees: { read: false, write: false, delete: false },
    documents: { read: true, write: false, delete: false },
    company: { read: false, write: false, delete: false },
    departments: { read: false, write: false, delete: false },
  },
};

export async function requireAuth(request: NextRequest) {
  const authToken = request.cookies.get("auth_token")?.value;

  if (!authToken) {
    return { response: NextResponse.json({ message: "Unauthorized." }, { status: 401 }) };
  }

  const payload = await verifyJWT(authToken);
  if (!payload) {
    return { response: NextResponse.json({ message: "Unauthorized." }, { status: 401 }) };
  }

  const user = await prisma.user.findFirst({
    where: {
      id: payload.userId,
      companyId: payload.companyId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      companyId: true,
    },
  });

  if (!user) {
    return { response: NextResponse.json({ message: "Unauthorized." }, { status: 401 }) };
  }

  return {
    user: {
      userId: user.id,
      companyId: user.companyId,
      email: user.email,
      role: user.role,
      name: user.name,
    } satisfies AuthenticatedUser,
  };
}

export function requireRole(allowedRoles: string[]) {
  return function (user: AuthenticatedUser) {
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ message: "Forbidden. Insufficient permissions." }, { status: 403 });
    }
    return null;
  };
}

export function checkPermission(
  userRole: string,
  resource: "employees" | "documents" | "company" | "departments",
  action: "read" | "write" | "delete"
): boolean {
  const permissions = rolePermissions[userRole];
  if (!permissions) return false;
  return permissions[resource]?.[action] ?? false;
}

export function getUserPermissions(userRole: string) {
  return rolePermissions[userRole] || null;
}

export function requirePermission(
  user: AuthenticatedUser,
  resource: "employees" | "documents" | "company" | "departments",
  action: "read" | "write" | "delete"
) {
  if (!checkPermission(user.role, resource, action)) {
    return NextResponse.json({ message: "Forbidden. Insufficient permissions." }, { status: 403 });
  }
  return null;
}

export { rolePermissions };
