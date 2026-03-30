import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { getErrorResponse } from "@/lib/api-response";
import { requireHRAdmin } from "@/lib/auth-guard";

const uploadDirectory = path.join(process.cwd(), "public", "uploads", "company-assets");

export async function POST(request: NextRequest) {
  try {
    const auth = await requireHRAdmin(request);
    if ("response" in auth) {
      return auth.response;
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Image file is required." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ message: "Only image uploads are supported." }, { status: 400 });
    }

    await mkdir(uploadDirectory, { recursive: true });

    const extension = file.name.includes(".") ? file.name.split(".").pop() : "png";
    const fileName = `${auth.user.companyId}-${crypto.randomUUID()}.${extension}`;
    const filePath = path.join(uploadDirectory, fileName);
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    await writeFile(filePath, fileBuffer);

    return NextResponse.json({
      message: "Upload successful.",
      url: `/uploads/company-assets/${fileName}`,
    });
  } catch (error) {
    console.error("Company upload error:", error);
    return getErrorResponse(error, "Could not upload asset.");
  }
}
