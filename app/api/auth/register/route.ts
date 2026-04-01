import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { generateTempPassword } from "@/lib/generate-temp-password";
import { buildResetEmailPreview, sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, companyName, phone, email } = body as {
      name?: string;
      companyName?: string;
      phone?: string;
      email?: string;
    };

    if (!name || !companyName || !phone || !email) {
      return NextResponse.json(
        { message: "Missing required fields." },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Invalid email format." },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "This email is already registered." },
        { status: 409 },
      );
    }

    const tempPassword = generateTempPassword();
    const hashedTempPassword = await hashPassword(tempPassword);

    const company = await prisma.company.create({
      data: {
        name: companyName.trim(),
        status: "PENDING",
      },
    });

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        password: hashedTempPassword,
        role: "HR_ADMIN",
        status: "INACTIVE",
        companyId: company.id,
      },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/set-password?token=${token}`;
    await sendPasswordResetEmail(user.email, user.name, token);

    return NextResponse.json(
      {
        message:
          "Registration successful. Check the response for your temporary reset link.",
        resetLink,
        resetEmailPreview: buildResetEmailPreview(user.name, token),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Register error:", error);
    const message =
      error instanceof Error && error.message.includes("does not exist")
        ? "Database is not ready yet. Start PostgreSQL or create the target database, then try again."
        : "Something went wrong. Please try again.";

    return NextResponse.json({ message }, { status: 500 });
  }
}
