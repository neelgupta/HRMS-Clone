import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { user } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      await prisma.attendance.delete({
        where: { id },
      });
      return NextResponse.json({ message: "Attendance deleted" });
    }

    await prisma.attendance.deleteMany({
      where: { companyId: user.companyId },
    });

    return NextResponse.json({ message: "All attendance records deleted" });
  } catch (error) {
    console.error("Delete attendance error:", error);
    return NextResponse.json({ message: "Failed to delete attendance" }, { status: 500 });
  }
}
