import { NextResponse, type NextRequest } from "next/server";
import { getErrorResponse } from "@/lib/api-response";
import { requireHRAdmin, type AuthenticatedHRUser } from "@/lib/auth-guard";
import { getCompanyById, serializeCompany } from "@/lib/server/company";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireHRAdmin(request);
    if ("response" in auth) {
      return auth.response;
    }

    const { companyId } = auth as AuthenticatedHRUser;
    const company = await getCompanyById(companyId);
    return NextResponse.json({ company: serializeCompany(company) });
  } catch (error) {
    console.error("Company me error:", error);
    return getErrorResponse(error, "Could not load company settings.");
  }
}
