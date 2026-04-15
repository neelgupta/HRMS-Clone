import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ("response" in authResult) return authResult.response;

  const { companyId } = authResult.user;
  const { searchParams } = request.nextUrl;

  const search = searchParams.get("search") || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  try {
    const where: any = {
      companyId,
      isDeleted: false,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { employeeCode: { contains: search, mode: "insensitive" } },
      ];
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          photoUrl: true,
          designation: { select: { name: true } },
          department: { select: { name: true } },
          employmentType: true,
          employmentStatus: true,
          dateOfJoining: true,
          branch: { select: { id: true, name: true } },
        },
        orderBy: { firstName: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.employee.count({ where }),
    ]);

    return NextResponse.json({
      employees: employees.map((emp: any) => ({
        ...emp,
        designation: emp.designation?.name || null,
        department: emp.department?.name || null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("List company employees error:", error);
    return NextResponse.json(
      { message: "Failed to fetch employees." },
      { status: 500 }
    );
  }
}
