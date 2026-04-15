import { NextResponse, type NextRequest } from "next/server";
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
            bankName: user.employee.bankName ?? null,
            bankAccountNumber: user.employee.bankAccountNumber ?? null,
            pfNumber: user.employee.pfNumber ?? null,
            pfUAN: user.employee.pfUAN ?? null,
            esiNumber: user.employee.esiNumber ?? null,
            panNumber: user.employee.panNumber ?? null,
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

export async function PUT(request: NextRequest) {
  const authResult = await requireUser();

  if ("response" in authResult) {
    return authResult.response;
  }

  const { userId } = authResult;

  try {
    const body = await request.json();
    
    const user = await prisma.user.findFirst({
      where: { id: userId },
      select: { employeeId: true },
    });

    if (!user?.employeeId) {
      return NextResponse.json({ message: "Employee not found." }, { status: 404 });
    }

    const updateData: any = {};

    if (body.firstName) updateData.firstName = body.firstName;
    if (body.lastName) updateData.lastName = body.lastName;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.dateOfBirth) updateData.dateOfBirth = new Date(body.dateOfBirth);
    if (body.gender) updateData.gender = body.gender;
    if (body.maritalStatus) updateData.maritalStatus = body.maritalStatus;
    if (body.bloodGroup) updateData.bloodGroup = body.bloodGroup;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.emergencyContactName !== undefined) updateData.emergencyContactName = body.emergencyContactName;
    if (body.emergencyContactPhone !== undefined) updateData.emergencyContactPhone = body.emergencyContactPhone;
    if (body.emergencyContactRelation !== undefined) updateData.emergencyContactRelation = body.emergencyContactRelation;

    if (body.email || body.name) {
      const userUpdate: any = {};
      if (body.email) userUpdate.email = body.email;
      if (body.name) userUpdate.name = body.name;
      
      await prisma.user.update({
        where: { id: userId },
        data: userUpdate,
      });
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.employee.update({
        where: { id: user.employeeId },
        data: updateData,
      });
    }

    return NextResponse.json({ message: "Profile updated successfully." });
  } catch (error) {
    console.error("Profile update error:", error);
    return getErrorResponse(error, "Failed to update profile.");
  }
}
