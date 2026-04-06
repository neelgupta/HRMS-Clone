import "server-only";

import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/jwt";

export type AuthenticatedHRUser = {
  userId: string;
  companyId: string;
  email: string;
  role: string;
  name: string;
};

export async function requireUser(): Promise<AuthenticatedHRUser | { response: NextResponse }> {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token")?.value;

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
    userId: user.id,
    companyId: user.companyId,
    email: user.email,
    role: user.role,
    name: user.name,
  };
}

export async function requireHRAdmin(request: NextRequest) {
  const authToken = request.cookies.get("auth_token")?.value;
  console.log("Auth token present:", !!authToken);

  if (!authToken) {
    return { response: NextResponse.json({ message: "Unauthorized." }, { status: 401 }) };
  }

  const payload = await verifyJWT(authToken);
  console.log("JWT payload:", payload);
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
  console.log("User found:", user);

  if (!user) {
    return { response: NextResponse.json({ message: "Unauthorized." }, { status: 401 }) };
  }

  if (user.role !== "HR_ADMIN" && user.role !== "SUPER_ADMIN") {
    console.log("User role not HR_ADMIN or SUPER_ADMIN:", user.role);
    return { response: NextResponse.json({ message: "Forbidden." }, { status: 403 }) };
  }

  return {
    userId: user.id,
    companyId: user.companyId,
    email: user.email,
    role: user.role,
    name: user.name,
  };
}
