import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/jwt";

export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get("auth_token")?.value;

    if (!authToken) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const payload = await verifyJWT(authToken);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: {
        id: payload.userId,
        companyId: payload.companyId,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            status: true,
            setupCompleted: true,
          },
        },
        employee: {
          include: {
            branch: {
              select: { id: true, name: true, city: true },
            },
            department: {
              select: { id: true, name: true },
            },
            designation: {
              select: { id: true, name: true },
            },
          },
        },
        branch: {
          select: { id: true, name: true, city: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    return NextResponse.json({
      id: user.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      companyId: user.companyId,
      branchId: user.branchId,
      employeeId: user.employeeId,
      company: user.company,
      branch: user.branch,
      employee: user.employee,
    });
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json({ message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
