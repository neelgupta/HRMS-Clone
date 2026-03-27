import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { signJWT } from "@/lib/jwt";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password, confirmPassword } = body as {
      token?: string;
      password?: string;
      confirmPassword?: string;
    };

    if (!token || !password || !confirmPassword) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ message: "Passwords do not match." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ message: "Password must be at least 8 characters." }, { status: 400 });
    }

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        used: false,
      },
      include: {
        user: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!resetToken) {
      return NextResponse.json({ message: "Invalid password setup link." }, { status: 400 });
    }

    if (resetToken.expiresAt <= new Date()) {
      return NextResponse.json({ message: "This link has expired. Please register again." }, { status: 400 });
    }

    const hashedNewPassword = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          password: hashedNewPassword,
          status: "ACTIVE",
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
      prisma.company.update({
        where: { id: resetToken.user.companyId },
        data: { status: "ACTIVE" },
      }),
    ]);

    const jwt = await signJWT({
      userId: resetToken.user.id,
      companyId: resetToken.user.companyId,
      role: "HR_ADMIN",
      email: resetToken.user.email,
    });

    const response = NextResponse.json({
      message: "Password set successfully",
      redirectTo: "/dashboard/hr",
    });

    response.cookies.set("auth_token", jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Set password error:", error);
    return NextResponse.json({ message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
