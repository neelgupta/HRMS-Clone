import { NextResponse, type NextRequest } from "next/server";
import { getErrorResponse } from "@/lib/api-response";
import { requireHRAdmin, type AuthenticatedHRUser } from "@/lib/auth-guard";
import { getCompanyById, replaceCompanyAddresses, serializeCompany } from "@/lib/server/company";
import { companyAddressListSchema } from "@/lib/validations/company";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireHRAdmin(request);
    if ("response" in auth) {
      return auth.response;
    }

    const { companyId } = auth as AuthenticatedHRUser;
    const payload = companyAddressListSchema.parse(await request.json());
    await replaceCompanyAddresses(companyId, payload.addresses);
    const company = await getCompanyById(companyId);

    return NextResponse.json({
      message: "Addresses saved.",
      company: serializeCompany(company),
    });
  } catch (error) {
    console.error("Company address error:", error);
    return getErrorResponse(error, "Could not save addresses.");
  }
}
