import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  const authResult = await requireUser();

  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    return NextResponse.json({
      announcements: [
        {
          id: "1",
          title: "Welcome to the Self-Service Portal",
          content: "We are excited to announce the launch of our new Self-Service Portal. You can now access your payslips, documents, and more from here.",
          priority: "MEDIUM",
          category: "GENERAL",
          isActive: true,
          startDate: new Date().toISOString(),
          endDate: null,
          createdBy: "HR Team",
          createdAt: new Date().toISOString(),
        },
      ],
    });
  } catch (error) {
    console.error("Announcements fetch error:", error);
    return NextResponse.json({ message: "Failed to fetch announcements." }, { status: 500 });
  }
}
