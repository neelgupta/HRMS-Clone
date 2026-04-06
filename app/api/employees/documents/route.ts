import { NextResponse, type NextRequest } from "next/server";
import { requireHRAdmin } from "@/lib/auth-guard";
import { uploadDocument } from "@/lib/server/employee";
import { documentUploadSchema } from "@/lib/validations/employee";

export async function POST(request: NextRequest) {
  const authResult = await requireHRAdmin(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { userId, companyId } = authResult;

  try {
    const formData = await request.formData();
    const employeeId = formData.get("employeeId") as string;
    const type = formData.get("type") as string;
    const name = formData.get("name") as string;
    const expiryDate = formData.get("expiryDate") as string | null;
    const file = formData.get("file") as File | null;

    if (!employeeId || !type || !name) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ message: "File is required." }, { status: 400 });
    }

    const validTypes = [
      "AADHAR_CARD", "PAN_CARD", "PASSPORT", "DRIVING_LICENSE", "VOTER_ID",
      "BANK_PASSBOOK", "EDUCATION_CERTIFICATE", "EXPERIENCE_LETTER", "OFFER_LETTER",
      "APPOINTMENT_LETTER", "SALARY_SLIP", "FORM_16", "PF_DOCUMENT", "ESI_DOCUMENT",
      "PHOTO", "SIGNATURE", "OTHER"
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json({ message: "Invalid document type." }, { status: 400 });
    }

    const parsed = documentUploadSchema.parse({
      employeeId,
      type,
      name,
      expiryDate,
    });

    const { prisma } = await import("@/lib/prisma");
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
    });

    if (!employee) {
      return NextResponse.json({ message: "Employee not found." }, { status: 404 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const fileUrl = `data:${file.type};base64,${base64}`;

    const result = await uploadDocument(companyId, userId, {
      ...parsed,
      fileUrl,
      fileSize: file.size,
      mimeType: file.type,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json({ message: "Failed to upload document." }, { status: 500 });
  }
}
