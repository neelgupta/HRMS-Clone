import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body as { email?: string };

    if (!email) {
      return NextResponse.json(
        { message: "Email is required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json(
        { message: "No account found with this email. Please contact HR." },
        { status: 404 }
      );
    }

    if (user.status === "INACTIVE") {
      return NextResponse.json({
        message: "Account found. Please set your password.",
        email: user.email,
        needsPasswordSetup: true,
      });
    }

    return NextResponse.json({
      message: "Account is already active. Please use login page.",
      email: user.email,
      needsPasswordSetup: false,
    });
  } catch (error) {
    console.error("Reset password init error:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
