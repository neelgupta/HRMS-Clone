import { NextRequest } from "next/server";
import { requireHRAdmin } from "@/lib/auth-guard";
import { getErrorResponse } from "@/lib/api-response";
import { attendancePolicySchema } from "@/lib/validations/attendance";
import { getAttendancePolicy, saveAttendancePolicy } from "@/lib/server/attendance";

export async function GET() {
  const cookieStore = await import("next/headers").then(m => m.cookies());
  const authToken = cookieStore.get("auth_token")?.value;

  if (!authToken) {
    return Response.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const { verifyJWT } = await import("@/lib/jwt");
    const payload = await verifyJWT(authToken);

    if (!payload) {
      return Response.json({ message: "Unauthorized." }, { status: 401 });
    }

    const policy = await getAttendancePolicy(payload.companyId);
    return Response.json({ policy });
  } catch (error) {
    return getErrorResponse(error, "Failed to fetch attendance policy.");
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await requireHRAdmin(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { userId, companyId } = authResult;

  try {
    const body = await request.json();
    const parsed = attendancePolicySchema.parse(body);
    await saveAttendancePolicy(companyId, userId, parsed);
    return Response.json({ message: "Attendance policy saved successfully." });
  } catch (error) {
    return getErrorResponse(error, "Failed to save attendance policy.");
  }
}
