import { NextResponse, type NextRequest } from "next/server";
import { requireHRAdmin } from "@/lib/auth-guard";
import { getUserDataById, getEmployeesWithoutUser } from "@/lib/server/user";

export async function GET(request: NextRequest) {
  const authResult = await requireHRAdmin(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { searchParams } = request.nextUrl();
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
