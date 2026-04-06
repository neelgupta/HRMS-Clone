import { prisma } from "@/lib/prisma";

export type UserWithRelations = Awaited<ReturnType<typeof getUserDataByEmail>>;

export async function getUserDataByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      employee: {
        include: {
          branch: true,
          department: true,
          designation: true,
          documents: {
            where: {
              expiryDate: { gte: new Date() },
            },
            orderBy: { expiryDate: "asc" },
            take: 5,
          },
          education: {
            orderBy: { yearOfPassing: "desc" },
            take: 3,
          },
          workHistory: {
            orderBy: { startDate: "desc" },
            take: 3,
          },
        },
      },
      company: {
        select: {
          id: true,
          name: true,
          status: true,
          setupCompleted: true,
        },
      },
      branch: true,
    },
  });
}

export async function getUserDataById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      employee: {
        include: {
          branch: true,
          department: true,
          designation: true,
          documents: {
            where: {
              expiryDate: { gte: new Date() },
            },
            orderBy: { expiryDate: "asc" },
            take: 5,
          },
        },
      },
      company: {
        select: {
          id: true,
          name: true,
          status: true,
          setupCompleted: true,
        },
      },
      branch: true,
    },
  });
}

export async function getEmployeeWithUser(employeeId: string) {
  return prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
        },
      },
      branch: true,
      department: true,
      designation: true,
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      documents: {
        orderBy: { createdAt: "desc" },
      },
      education: {
        orderBy: { yearOfPassing: "desc" },
      },
      workHistory: {
        orderBy: { startDate: "desc" },
      },
      reports: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          designation: true,
          employeeCode: true,
        },
      },
      reportingManager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          designation: true,
          employeeCode: true,
        },
      },
    },
  });
}

export async function linkUserToEmployee(userId: string, employeeId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { employeeId },
    include: {
      employee: true,
      company: true,
    },
  });
}

export async function unlinkUserFromEmployee(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { employeeId: null },
  });
}

export async function getEmployeesWithoutUser(companyId: string) {
  return prisma.employee.findMany({
    where: {
      companyId,
      user: null,
      employmentStatus: { not: "TERMINATED" },
    },
    select: {
      id: true,
      employeeCode: true,
      firstName: true,
      lastName: true,
      email: true,
      designation: true,
      department: true,
    },
    orderBy: { firstName: "asc" },
  });
}
