import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/password";
import { signJWT } from "@/lib/jwt";
import { ROUTES } from "@/lib/constants";

function getRedirectPath(role: string): string {
  switch (role) {
    case "HR_ADMIN":
    case "SUPER_ADMIN":
      return ROUTES.HR.DASHBOARD;
    case "PAYROLL_MANAGER":
      return ROUTES.HR.DASHBOARD;
    case "DEPT_MANAGER":
      return ROUTES.HR.DASHBOARD;
    case "EMPLOYEE":
      return ROUTES.EMPLOYEE.DASHBOARD;
    default:
      return ROUTES.HR.DASHBOARD;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { company: true },
    });

    if (!user) {
      return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
    }

    if (user.status === "INACTIVE") {
      return NextResponse.json(
        { message: "Your account has been deactivated. Please contact HR." },
        { status: 403 },
      );
    }

    const validPassword = await comparePassword(password, user.password);
    if (!validPassword) {
      return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
    }

    const token = await signJWT({
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
      email: user.email,
    });

    const redirectTo = getRedirectPath(user.role);

    const response = NextResponse.json({ 
      redirectTo,
      role: user.role,
      name: user.name 
    });
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
