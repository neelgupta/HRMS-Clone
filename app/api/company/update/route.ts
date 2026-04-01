import { NextResponse, type NextRequest } from "next/server";
import { getErrorResponse } from "@/lib/api-response";
import { requireHRAdmin, type AuthenticatedHRUser } from "@/lib/auth-guard";
import { saveCompanySetup, serializeCompany } from "@/lib/server/company";
import { companySetupSchema } from "@/lib/validations/company";

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireHRAdmin(request);
    if ("response" in auth) {
      return auth.response;
    }

    const { companyId } = auth as AuthenticatedHRUser;
    const payload = companySetupSchema.parse(await request.json());
    const company = await saveCompanySetup(companyId, payload);

    return NextResponse.json({
      message: payload.markSetupComplete ? "Company settings updated." : "Draft updated.",
      company: serializeCompany(company),
    });
  } catch (error) {
    console.error("Company update error:", error);
    return getErrorResponse(error, "Could not update company settings.");
  }
}
