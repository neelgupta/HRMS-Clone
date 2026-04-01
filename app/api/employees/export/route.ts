import { NextResponse, type NextRequest } from "next/server";
import { requireHRAdmin } from "@/lib/auth-guard";
import { exportEmployeesToCSV } from "@/lib/server/employee";

export async function GET(request: NextRequest) {
  const authResult = await requireHRAdmin(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { companyId } = authResult;

  try {
    const csv = await exportEmployeesToCSV(companyId);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="employees-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ message: "Failed to export employees." }, { status: 500 });
  }
}
