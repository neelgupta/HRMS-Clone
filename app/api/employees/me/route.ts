import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-guard";
import { getErrorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authResult = await requireUser();

  if ("response" in authResult) {
    return authResult.response;
  }

  const { userId, companyId, role } = authResult;

  try {
    const user = await prisma.user.findFirst({
      where: { id: userId },
      include: {
        employee: {
          include: {
            department: true,
            designation: true,
            branch: true,
            reportingManager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const profile = {
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      employee: user.employee
        ? {
            id: user.employee.id,
            employeeCode: user.employee.employeeCode,
            firstName: user.employee.firstName,
            lastName: user.employee.lastName,
            email: user.employee.email,
            phone: user.employee.phone,
            photoUrl: user.employee.photoUrl,
            dateOfBirth: user.employee.dateOfBirth,
            gender: user.employee.gender,
            maritalStatus: user.employee.maritalStatus,
            bloodGroup: user.employee.bloodGroup,
            dateOfJoining: user.employee.dateOfJoining,
            probationEndDate: user.employee.probationEndDate,
            employmentType: user.employee.employmentType,
            employmentStatus: user.employee.employmentStatus,
            department: user.employee.department?.name || null,
            designation: user.employee.designation?.name || null,
            branch: user.employee.branch?.name || null,
            reportingManager: user.employee.reportingManager
              ? `${user.employee.reportingManager.firstName} ${user.employee.reportingManager.lastName}`
              : null,
          }
        : null,
    };

    return NextResponse.json(profile);
  } catch (error) {
    return getErrorResponse(error, "Failed to fetch profile.");
  }
}
