import { NextResponse, type NextRequest } from "next/server";
import { getErrorResponse } from "@/lib/api-response";
import { requireHRAdmin } from "@/lib/auth-guard";
import { getCompanyById, serializeCompany, upsertCompanyGeneralSettings } from "@/lib/server/company";
import { companySettingPayloadSchema } from "@/lib/validations/company";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireHRAdmin(request);
    if ("response" in auth) {
      return auth.response;
    }

    const payload = companySettingPayloadSchema.parse(await request.json());
    await upsertCompanyGeneralSettings(auth.user.companyId, payload.generalSetting);
    const company = await getCompanyById(auth.user.companyId);

    return NextResponse.json({
      message: "General settings saved.",
      company: serializeCompany(company),
    });
  } catch (error) {
    console.error("Company settings error:", error);
    return getErrorResponse(error, "Could not save general settings.");
  }
}
