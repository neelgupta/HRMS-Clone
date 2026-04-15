import { NextResponse, type NextRequest } from "next/server";
import { requireHRAdmin } from "@/lib/auth-guard";
import { requireAuth } from "@/lib/rbac";
import { getUserDataById, getEmployeesWithoutUser } from "@/lib/server/user";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const role = searchParams.get("role");

  // Special case: Fetch HR users for ticket assignment (accessible by all authenticated users)
  if (role === "HR") {
    const authResult = await requireAuth(request);
    if ("response" in authResult) return authResult.response;

    const { companyId } = authResult.user;

    try {
      const hrUsers = await prisma.user.findMany({
        where: {
          companyId,
          role: { in: ["HR_ADMIN", "SUPER_ADMIN", "PAYROLL_MANAGER", "DEPT_MANAGER"] },
        },
        select: { id: true, name: true, email: true },
      });
      return NextResponse.json({ users: hrUsers });
    } catch (error) {
      console.error("HR users fetch error:", error);
      return NextResponse.json({ message: "Failed to fetch HR users." }, { status: 500 });
    }
  }

  const authResult = await requireHRAdmin(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const userId = searchParams.get("userId");
  const unlinked = searchParams.get("unlinked");

  try {
    if (unlinked === "true") {
      const { companyId } = authResult;
      const employees = await getEmployeesWithoutUser(companyId);
      return NextResponse.json(employees);
    }

    if (userId) {
      const user = await getUserDataById(userId);
      if (!user) {
        return NextResponse.json({ message: "User not found." }, { status: 404 });
      }
      return NextResponse.json(user);
    }

    return NextResponse.json({ message: "User ID required." }, { status: 400 });
  } catch (error) {
    console.error("User fetch error:", error);
    return NextResponse.json({ message: "Failed to fetch user." }, { status: 500 });
  }
}
