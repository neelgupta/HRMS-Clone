import { NextResponse, type NextRequest } from "next/server";
import { getErrorResponse } from "@/lib/api-response";
import { requireHRAdmin } from "@/lib/auth-guard";
import { getCompanyById, replaceEmployeeCustomFields, serializeCompany } from "@/lib/server/company";
import { companyCustomFieldPayloadSchema } from "@/lib/validations/company";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireHRAdmin(request);
    if ("response" in auth) {
      return auth.response;
    }

    const payload = companyCustomFieldPayloadSchema.parse(await request.json());
    await replaceEmployeeCustomFields(auth.user.companyId, payload.employeeCustomFields);
    const company = await getCompanyById(auth.user.companyId);

    return NextResponse.json({
      message: "Employee custom fields saved.",
      company: serializeCompany(company),
    });
  } catch (error) {
    console.error("Company custom fields error:", error);
    return getErrorResponse(error, "Could not save custom fields.");
  }
}
