import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { getOrganizationChart, getEmployeesByDepartment } from "@/lib/server/employee";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { companyId } = authResult.user;
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type") || "tree";

  try {
    if (type === "by-department") {
      const data = await getEmployeesByDepartment(companyId);
      return NextResponse.json({ type: "by-department", data });
    }

    const orgChart = await getOrganizationChart(companyId);
    return NextResponse.json({ type: "tree", data: orgChart });
  } catch (error) {
    console.error("Organization chart error:", error);
    return NextResponse.json({ message: "Failed to fetch organization chart." }, { status: 500 });
  }
}
