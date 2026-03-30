import { NextResponse, type NextRequest } from "next/server";
import { getErrorResponse } from "@/lib/api-response";
import { requireHRAdmin } from "@/lib/auth-guard";
import { getCompanyById, serializeCompany, upsertCompanyBankDetail } from "@/lib/server/company";
import { companyBankSchema } from "@/lib/validations/company";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireHRAdmin(request);
    if ("response" in auth) {
      return auth.response;
    }

    const payload = companyBankSchema.parse(await request.json());
    await upsertCompanyBankDetail(auth.user.companyId, payload.bankDetail);
    const company = await getCompanyById(auth.user.companyId);

    return NextResponse.json({
      message: "Bank details saved.",
      company: serializeCompany(company),
    });
  } catch (error) {
    console.error("Company bank error:", error);
    return getErrorResponse(error, "Could not save bank details.");
  }
}
