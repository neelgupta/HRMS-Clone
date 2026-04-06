import { NextResponse, type NextRequest } from "next/server";
import { getErrorResponse } from "@/lib/api-response";
import { requireHRAdmin, type AuthenticatedHRUser } from "@/lib/auth-guard";
import { getCompanyById, replaceCompanyBranches, serializeCompany } from "@/lib/server/company";
import { companyBranchListSchema } from "@/lib/validations/company";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireHRAdmin(request);
    if ("response" in auth) {
      return auth.response;
    }

    const { companyId } = auth as AuthenticatedHRUser;
    const payload = companyBranchListSchema.parse(await request.json());
    await replaceCompanyBranches(companyId, payload.branches);
    const company = await getCompanyById(companyId);

    return NextResponse.json({
      message: "Branches saved.",
      company: serializeCompany(company),
    });
  } catch (error) {
    console.error("Company branch error:", error);
    return getErrorResponse(error, "Could not save branches.");
  }
}
