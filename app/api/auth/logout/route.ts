import { NextResponse } from "next/server";
import { useSecureAuthCookie } from "@/lib/auth-cookie";

export async function POST(request: Request) {
  const response = NextResponse.json({ message: "Logged out successfully." });
  response.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: useSecureAuthCookie(request),
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
