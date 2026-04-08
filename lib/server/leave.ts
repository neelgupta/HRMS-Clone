import { prisma } from "@/lib/prisma";
import type { LeaveType, LeaveStatus } from "@prisma/client";

export type LeaveApplicationWithEmployee = {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string | null;
  status: LeaveStatus;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewRemarks: string | null;
  attachmentUrl: string | null;
  createdAt: Date;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    department: { name: string | null };
    designation: { name: string | null };
  };
};

function calculateBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export async function createLeaveApplication(
  companyId: string,
  employeeId: string,
  input: {
    leaveType: LeaveType;
    startDate: Date;
    endDate: Date;
    reason?: string;
    attachmentUrl?: string;
  }
): Promise<{ application: LeaveApplicationWithEmployee }> {
  const totalDays = calculateBusinessDays(input.startDate, input.endDate);

  const application = await prisma.leaveApplication.create({
    data: {
      employeeId,
      companyId,
      leaveType: input.leaveType,
      startDate: input.startDate,
      endDate: input.endDate,
      totalDays,
      reason: input.reason,
      attachmentUrl: input.attachmentUrl,
      status: "PENDING",
    },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          department: { select: { name: true } },
          designation: { select: { name: true } },
        },
      },
    },
  });

  // Update leave balance pending days (only if balance exists)
  await prisma.leaveBalance.updateMany({
    where: {
      employeeId,
      year: input.startDate.getFullYear(),
      leaveType: input.leaveType,
    },
    data: {
      pendingDays: { increment: totalDays },
      availableDays: { decrement: totalDays },
    },
  }).catch(() => {
    // Leave balance doesn't exist, skip update
  });

  return { application: application as unknown as LeaveApplicationWithEmployee };
}

export async function listLeaveApplications(
  companyId: string,
  filters: {
    employeeId?: string;
    status?: LeaveStatus;
    leaveType?: LeaveType;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }
) {
  const { employeeId, status, leaveType, startDate, endDate, page = 1, limit = 20 } = filters;

  const where: any = { companyId };
  if (employeeId) where.employeeId = employeeId;
  if (status) where.status = status;
  if (leaveType) where.leaveType = leaveType;
  if (startDate && endDate) {
    where.startDate = { gte: startDate };
    where.endDate = { lte: endDate };
  }

  const [applications, total] = await Promise.all([
    prisma.leaveApplication.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.leaveApplication.count({ where }),
  ]);

  return {
    applications: applications as unknown as LeaveApplicationWithEmployee[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateLeaveStatus(
  companyId: string,
  reviewerId: string,
  applicationId: string,
  input: {
    status: LeaveStatus;
    reviewRemarks?: string;
  }
): Promise<{ application: LeaveApplicationWithEmployee }> {
  const application = await prisma.leaveApplication.findFirst({
    where: { id: applicationId, companyId },
  });

  if (!application) {
    throw new Error("Leave application not found");
  }

  const updated = await prisma.leaveApplication.update({
    where: { id: applicationId },
    data: {
      status: input.status,
      reviewRemarks: input.reviewRemarks,
    } as any,
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          department: { select: { name: true } },
          designation: { select: { name: true } },
        },
      },
    },
  });

  // Update leave balance based on approval/rejection
  if (input.status === "APPROVED") {
    await prisma.leaveBalance.updateMany({
      where: {
        employeeId: application.employeeId,
        year: application.startDate.getFullYear(),
        leaveType: application.leaveType,
      },
      data: {
        usedDays: { increment: application.totalDays },
        pendingDays: { decrement: application.totalDays },
      },
    });
  } else if (input.status === "REJECTED" || input.status === "CANCELLED") {
    await prisma.leaveBalance.updateMany({
      where: {
        employeeId: application.employeeId,
        year: application.startDate.getFullYear(),
        leaveType: application.leaveType,
      },
      data: {
        pendingDays: { decrement: application.totalDays },
        availableDays: { increment: application.totalDays },
      },
    });
  }

  return { application: updated as unknown as LeaveApplicationWithEmployee };
}

export async function getEmployeeLeaveBalances(employeeId: string, year: number) {
  const balances = await prisma.leaveBalance.findMany({
    where: { employeeId, year },
    orderBy: { leaveType: "asc" },
  });

  return balances;
}

export async function initializeLeaveBalances(
  employeeId: string,
  companyId: string,
  year: number,
  policy: {
    casualLeaveDays: number;
    sickLeaveDays: number;
    privilegeLeaveDays: number;
  }
) {
  const leaveTypes = [
    { type: "CASUAL" as LeaveType, days: policy.casualLeaveDays },
    { type: "SICK" as LeaveType, days: policy.sickLeaveDays },
    { type: "PRIVILEGE" as LeaveType, days: policy.privilegeLeaveDays },
  ];

  await prisma.leaveBalance.createMany({
    data: leaveTypes.map((lt) => ({
      employeeId,
      companyId,
      year,
      leaveType: lt.type,
      totalDays: lt.days,
      usedDays: 0,
      pendingDays: 0,
      availableDays: lt.days,
      carriedForward: 0,
    })),
    skipDuplicates: true,
  });
}

export async function getLeavePolicy(companyId: string) {
  const policy = await prisma.leavePolicy.findUnique({
    where: { companyId },
  });

  if (!policy) {
    // Return default policy
    return {
      casualLeaveDays: 10,
      sickLeaveDays: 10,
      privilegeLeaveDays: 15,
      maxCarryForward: 5,
      allowEncashment: false,
      maternityLeaveDays: 90,
      paternityLeaveDays: 15,
    };
  }

  return policy;
}

export async function updateLeavePolicy(
  companyId: string,
  input: {
    casualLeaveDays?: number;
    sickLeaveDays?: number;
    privilegeLeaveDays?: number;
    maxCarryForward?: number;
    allowEncashment?: boolean;
    maxEncashDays?: number;
    maternityLeaveDays?: number;
    paternityLeaveDays?: number;
  }
) {
  const policy = await prisma.leavePolicy.upsert({
    where: { companyId },
    update: input as any,
    create: {
      companyId,
      casualLeaveDays: input.casualLeaveDays ?? 10,
      sickLeaveDays: input.sickLeaveDays ?? 10,
      privilegeLeaveDays: input.privilegeLeaveDays ?? 15,
      maxCarryForward: input.maxCarryForward ?? 5,
      allowEncashment: input.allowEncashment ?? false,
      maxEncashDays: input.maxEncashDays ?? 5,
      maternityLeaveDays: input.maternityLeaveDays ?? 90,
      paternityLeaveDays: input.paternityLeaveDays ?? 15,
    } as any,
  });

  return policy;
}