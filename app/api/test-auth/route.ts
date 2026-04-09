import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth-guard";

export async function GET(request: Request) {
  try {
    const authResult = await requireAuthenticatedUser(request as any);
    
    if ("response" in authResult) {
      return authResult.response;
    }

    return NextResponse.json({ 
      message: "Authentication successful", 
      user: {
        userId: authResult.userId,
        companyId: authResult.companyId,
        email: authResult.email,
        role: authResult.role,
        name: authResult.name,
      }
    });
  } catch (error) {
    console.error("Test auth error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
