import { prisma } from "@/lib/prisma";
import type { 
  LeaveTypeConfig, 
  LeaveApplication, 
  LeaveBalance, 
  LeavePolicy,
  Holiday,
  CompOffRequest,
  CompOffBalance,
  LeaveComment,
  LeaveNotification,
  LeaveApprovalHistory,
  LeaveCategory,
  SessionType,
  LeaveStatus,
  ApprovalStatus,
  CompOffStatus,
  NotificationType
} from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

export type LeaveApplicationWithRelations = LeaveApplication & {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: { name: string | null };
    designation?: { name: string | null };
  };
  leaveTypeConfig?: LeaveTypeConfig | null;
};

export type LeaveBalanceWithType = LeaveBalance & {
  leaveTypeConfig?: LeaveTypeConfig | null;
};

// ========================================
// LEAVE TYPE CONFIGURATION
// ========================================

export async function getLeaveTypeConfigs(companyId: string) {
  return prisma.leaveTypeConfig.findMany({
    where: { companyId, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createLeaveTypeConfig(
  companyId: string,
  data: {
    name: string;
    code: string;
    type: LeaveCategory;
    annualDays?: number;
    accrualType?: "MONTHLY" | "YEARLY";
    accrualRate?: number;
    maxConsecutive?: number;
    minNoticeDays?: number;
    canApplyHalfDay?: boolean;
    maxHalfDaysPerYear?: number;
    genderSpecific?: "MALE" | "FEMALE" | null;
    allowCarryForward?: boolean;
    maxCarryForward?: number;
    allowEncashment?: boolean;
    maxEncashDays?: number;
    expiryDays?: number;
  }
) {
  const config = await prisma.leaveTypeConfig.create({
    data: {
      companyId,
      name: data.name,
      code: data.code.toUpperCase(),
      type: data.type,
      annualDays: data.annualDays ?? 0,
      accrualType: data.accrualType ?? "YEARLY",
      accrualRate: data.accrualRate ?? 0,
      maxConsecutive: data.maxConsecutive ?? 0,
      minNoticeDays: data.minNoticeDays ?? 0,
      canApplyHalfDay: data.canApplyHalfDay ?? true,
      maxHalfDaysPerYear: data.maxHalfDaysPerYear ?? 0,
      genderSpecific: data.genderSpecific ?? null,
      allowCarryForward: data.allowCarryForward ?? false,
      maxCarryForward: data.maxCarryForward ?? 0,
      allowEncashment: data.allowEncashment ?? false,
      maxEncashDays: data.maxEncashDays ?? 0,
      expiryDays: data.expiryDays ?? 0,
    },
  });
  return config;
}

export async function updateLeaveTypeConfig(
  id: string,
  data: Partial<{
    name: string;
    annualDays: number;
    accrualType: "MONTHLY" | "YEARLY";
    accrualRate: number;
    maxConsecutive: number;
    minNoticeDays: number;
    canApplyHalfDay: boolean;
    maxHalfDaysPerYear: number;
    genderSpecific: "MALE" | "FEMALE" | null;
    allowCarryForward: boolean;
    maxCarryForward: number;
    allowEncashment: boolean;
    maxEncashDays: number;
    expiryDays: number;
    isActive: boolean;
    sortOrder: number;
  }>
) {
  return prisma.leaveTypeConfig.update({
    where: { id },
    data,
  });
}

export async function deleteLeaveTypeConfig(id: string) {
  return prisma.leaveTypeConfig.update({
    where: { id },
    data: { isActive: false },
  });
}

// ========================================
// LEAVE POLICY
// ========================================

export async function getLeavePolicy(companyId: string) {
  return prisma.leavePolicy.findUnique({
    where: { companyId },
  });
}

export async function updateLeavePolicy(
  companyId: string,
  data: {
    approvalLevel1?: "MANAGER" | "HR" | "BOTH";
    approvalLevel2?: "MANAGER" | "HR" | "BOTH" | null;
    managerApprovalDays?: number;
    hrApprovalDays?: number;
    encashmentStartMonth?: number;
    encashmentEndMonth?: number;
    processCarryForward?: boolean;
    carryForwardDeadline?: Date | null;
    allowAutoApproval?: boolean;
    autoApprovalDaysThreshold?: number;
  }
) {
  return prisma.leavePolicy.upsert({
    where: { companyId },
    update: data,
    create: {
      companyId,
      ...data,
    },
  });
}

// ========================================
// LEAVE BALANCE
// ========================================

export async function getEmployeeLeaveBalances(employeeId: string, year: number) {
  return prisma.leaveBalance.findMany({
    where: { employeeId, year },
    include: { leaveTypeConfig: true },
    orderBy: { leaveType: "asc" },
  });
}

export async function initializeEmployeeLeaveBalances(
  employeeId: string,
  companyId: string,
  year: number
) {
  const configs = await prisma.leaveTypeConfig.findMany({
    where: { companyId, isActive: true, annualDays: { gt: 0 } },
  });

  const balances = configs.map((config) => ({
    employeeId,
    companyId,
    leaveTypeId: config.id,
    year,
    allocatedDays: config.annualDays,
    accruedDays: config.accrualType === "YEARLY" ? config.annualDays : 0,
    carriedForward: 0,
    usedDays: 0,
    pendingDays: 0,
    availableDays: config.annualDays,
    encashedDays: 0,
    expiredDays: 0,
  }));

  await prisma.leaveBalance.createMany({
    data: balances,
    skipDuplicates: true,
  });
}

export async function updateLeaveBalance(
  employeeId: string,
  year: number,
  leaveTypeId: string,
  data: {
    usedDays?: number;
    pendingDays?: number;
    carriedForward?: number;
    encashedDays?: number;
    accruedDays?: number;
  }
) {
  const balance = await prisma.leaveBalance.findFirst({
    where: { employeeId, year, leaveTypeId },
  });

  if (!balance) return null;

  const updates: any = {};
  if (data.usedDays !== undefined) updates.usedDays = { increment: data.usedDays };
  if (data.pendingDays !== undefined) updates.pendingDays = { increment: data.pendingDays };
  if (data.carriedForward !== undefined) updates.carriedForward = data.carriedForward;
  if (data.encashedDays !== undefined) updates.encashedDays = { increment: data.encashedDays };
  if (data.accruedDays !== undefined) updates.accruedDays = { increment: data.accruedDays };

  const newUsedDays = balance.usedDays + (data.usedDays ?? 0);
  const newPendingDays = balance.pendingDays + (data.pendingDays ?? 0);
  const newAccruedDays = balance.accruedDays + (data.accruedDays ?? 0);
  const newAvailableDays = balance.allocatedDays + newAccruedDays + balance.carriedForward - newUsedDays - newPendingDays;

  return prisma.leaveBalance.update({
    where: { id: balance.id },
    data: {
      ...updates,
      availableDays: newAvailableDays,
    },
  });
}

export async function processMonthlyAccrual(companyId: string, month: number, year: number) {
  const configs = await prisma.leaveTypeConfig.findMany({
    where: { companyId, isActive: true, accrualType: "MONTHLY", accrualRate: { gt: 0 } },
  });

  const employees = await prisma.employee.findMany({
    where: { companyId, employmentStatus: { not: "TERMINATED" } },
    select: { id: true },
  });

  for (const employee of employees) {
    for (const config of configs) {
      const existing = await prisma.leaveBalance.findFirst({
        where: { employeeId: employee.id, year, leaveTypeId: config.id, month },
      });

      if (!existing) {
        const yearStartBalance = await prisma.leaveBalance.findFirst({
          where: { employeeId: employee.id, year, leaveTypeId: config.id, month: null },
        });

        const allocatedDays = yearStartBalance?.allocatedDays ?? config.annualDays;
        const accruedDays = (yearStartBalance?.accruedDays ?? 0) + config.accrualRate;
        const availableDays = allocatedDays + accruedDays - (yearStartBalance?.usedDays ?? 0) - (yearStartBalance?.pendingDays ?? 0);

        await prisma.leaveBalance.upsert({
          where: { id: yearStartBalance?.id ?? uuidv4() },
          create: {
            employeeId: employee.id,
            companyId,
            leaveTypeId: config.id,
            year,
            month,
            allocatedDays,
            accruedDays,
            carriedForward: yearStartBalance?.carriedForward ?? 0,
            usedDays: yearStartBalance?.usedDays ?? 0,
            pendingDays: yearStartBalance?.pendingDays ?? 0,
            availableDays,
            lastAccruedAt: new Date(),
          },
          update: {
            accruedDays,
            availableDays,
            lastAccruedAt: new Date(),
          },
        });
      }
    }
  }
}

// ========================================
// LEAVE APPLICATION
// ========================================

function calculateLeaveDays(
  startDate: Date,
  endDate: Date,
  startSession: SessionType,
  endSession: SessionType,
  companyId: string
): number {
  let businessDays = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++;
    }
    current.setDate(current.getDate() + 1);
  }

  if (startDate.getTime() === endDate.getTime()) {
    if (startSession === "FULL_DAY") return businessDays;
    return 0.5;
  }

  if (startSession === "FIRST_HALF") businessDays -= 0.5;
  if (endSession === "SECOND_HALF") businessDays -= 0.5;

  return Math.max(0.5, businessDays);
}

export async function createLeaveApplication(
  companyId: string,
  employeeId: string,
  data: {
    leaveTypeId: string;
    startDate: Date;
    endDate: Date;
    startSession?: SessionType;
    endSession?: SessionType;
    reason?: string;
    attachmentUrl?: string;
  }
) {
  const totalDays = calculateLeaveDays(
    data.startDate,
    data.endDate,
    data.startSession ?? "FULL_DAY",
    data.endSession ?? "FULL_DAY",
    companyId
  );

  const leaveType = await prisma.leaveTypeConfig.findUnique({
    where: { id: data.leaveTypeId },
  });

  if (!leaveType) {
    throw new Error("Invalid leave type");
  }

  const existingApplication = await prisma.leaveApplication.findFirst({
    where: {
      employeeId,
      status: { notIn: ["REJECTED", "CANCELLED"] },
      OR: [
        { startDate: { lte: data.endDate }, endDate: { gte: data.startDate } },
      ],
    },
  });

  if (existingApplication) {
    throw new Error("Leave application already exists for these dates");
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { reportingManagerId: true },
  });

  const policy = await prisma.leavePolicy.findUnique({
    where: { companyId },
  });

  const application = await prisma.leaveApplication.create({
    data: {
      employeeId,
      companyId,
      leaveTypeId: data.leaveTypeId,
      startDate: data.startDate,
      endDate: data.endDate,
      startSession: data.startSession ?? "FULL_DAY",
      endSession: data.endSession ?? "FULL_DAY",
      totalDays,
      reason: data.reason,
      attachmentUrl: data.attachmentUrl,
      status: "PENDING",
      level1Status: "PENDING",
      currentApproverLevel: 1,
      approverId: employee?.reportingManagerId ?? null,
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
      leaveTypeConfig: true,
    },
  });

  await updateLeaveBalance(
    employeeId,
    data.startDate.getFullYear(),
    data.leaveTypeId,
    { pendingDays: totalDays }
  );

  // Send HR notification for new leave application
  const employeeFullName = `${application.employee.firstName} ${application.employee.lastName}`;
  await createHRNotification(
    companyId,
    "LEAVE_APPLIED",
    "New Leave Application",
    `${employeeFullName} has applied for ${totalDays} day(s) of ${leaveType.name} leave (${data.startDate.toLocaleDateString()} - ${data.endDate.toLocaleDateString()})`,
    "LeaveApplication",
    application.id
  );

  if (policy?.allowAutoApproval && policy.autoApprovalDaysThreshold > 0) {
    const balance = await prisma.leaveBalance.findFirst({
      where: { employeeId, year: data.startDate.getFullYear(), leaveTypeId: data.leaveTypeId },
    });
    if (balance && balance.availableDays > policy.autoApprovalDaysThreshold) {
      await prisma.leaveApplication.update({
        where: { id: application.id },
        data: {
          status: "APPROVED",
          level1Status: "APPROVED",
          level1ReviewedAt: new Date(),
          level1Remarks: "Auto-approved based on policy",
        },
      });
      await updateLeaveBalance(
        employeeId,
        data.startDate.getFullYear(),
        data.leaveTypeId,
        { pendingDays: -totalDays, usedDays: totalDays }
      );
    }
  }

  return application;
}

export async function listLeaveApplications(
  companyId: string,
  filters: {
    employeeId?: string;
    status?: LeaveStatus;
    leaveTypeId?: string;
    startDate?: Date;
    endDate?: Date;
    approverId?: string;
    page?: number;
    limit?: number;
  }
) {
  const { employeeId, status, leaveTypeId, startDate, endDate, approverId, page = 1, limit = 20 } = filters;

  const where: any = { companyId };
  if (employeeId) where.employeeId = employeeId;
  if (status) where.status = status;
  if (leaveTypeId) where.leaveTypeId = leaveTypeId;
  if (startDate && endDate) {
    where.startDate = { gte: startDate };
    where.endDate = { lte: endDate };
  }
  if (approverId) {
    where.OR = [
      { approverId, currentApproverLevel: 1, level1Status: "PENDING" },
      { approverId, currentApproverLevel: 2, level2Status: "PENDING" },
    ];
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
        leaveTypeConfig: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.leaveApplication.count({ where }),
  ]);

  return {
    applications,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getLeaveApplication(id: string) {
  return prisma.leaveApplication.findUnique({
    where: { id },
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
      leaveTypeConfig: true,
      comments: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
      approvalHistory: {
        include: { approver: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function approveLeaveApplication(
  applicationId: string,
  approverId: string,
  action: "APPROVED" | "REJECTED" | "MODIFICATION_REQUESTED",
  comments?: string
) {
  const application = await prisma.leaveApplication.findUnique({
    where: { id: applicationId },
    include: { leaveTypeConfig: true },
  });

  if (!application) throw new Error("Application not found");

  const policy = await prisma.leavePolicy.findUnique({
    where: { companyId: application.companyId },
  });

  const isLevel1 = application.currentApproverLevel === 1;
  const isApproved = action === "APPROVED";

  const updateData: any = {};
  if (isLevel1) {
    updateData.level1Status = isApproved ? "APPROVED" : action === "REJECTED" ? "REJECTED" : "MODIFICATION_REQUESTED";
    updateData.level1ReviewedBy = approverId;
    updateData.level1ReviewedAt = new Date();
    updateData.level1Remarks = comments;
  } else {
    updateData.level2Status = isApproved ? "APPROVED" : action === "REJECTED" ? "REJECTED" : "MODIFICATION_REQUESTED";
    updateData.level2ReviewedBy = approverId;
    updateData.level2ReviewedAt = new Date();
    updateData.level2Remarks = comments;
  }

  if (isApproved) {
    if (isLevel1 && policy?.approvalLevel2) {
      updateData.currentApproverLevel = 2;
      updateData.status = "PENDING";
    } else {
      updateData.status = "APPROVED";
      updateData.approverId = approverId;
      
      await updateLeaveBalance(
        application.employeeId,
        application.startDate.getFullYear(),
        application.leaveTypeId!,
        { pendingDays: -application.totalDays, usedDays: application.totalDays }
      );
    }
  } else {
    updateData.status = action === "REJECTED" ? "REJECTED" : "PENDING";
    if (action === "REJECTED") {
      await updateLeaveBalance(
        application.employeeId,
        application.startDate.getFullYear(),
        application.leaveTypeId!,
        { pendingDays: -application.totalDays }
      );
    }
  }

  const updated = await prisma.leaveApplication.update({
    where: { id: applicationId },
    data: updateData,
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  await prisma.leaveApprovalHistory.create({
    data: {
      applicationId,
      approverId,
      level: application.currentApproverLevel,
      action,
      comments,
    },
  });

  const notificationType: NotificationType = isApproved
    ? (application.currentApproverLevel === 2 || !policy?.approvalLevel2 ? "LEAVE_APPROVED" : "LEAVE_APPLIED")
    : "LEAVE_REJECTED";

  await createLeaveNotification(
    application.companyId,
    application.employeeId,
    notificationType,
    isApproved ? "Leave Approved" : "Leave Rejected",
    `Your leave application for ${application.startDate.toLocaleDateString()} - ${application.endDate.toLocaleDateString()} has been ${isApproved ? "approved" : "rejected"}.`,
    "LeaveApplication",
    applicationId
  );

  return updated;
}

export async function cancelLeaveApplication(applicationId: string, userId: string) {
  const application = await prisma.leaveApplication.findUnique({
    where: { id: applicationId },
    include: {
      employee: {
        select: { firstName: true, lastName: true },
      },
      leaveTypeConfig: {
        select: { name: true },
      },
    },
  });

  if (!application) throw new Error("Application not found");
  if (application.status === "APPROVED") {
    await updateLeaveBalance(
      application.employeeId,
      application.startDate.getFullYear(),
      application.leaveTypeId!,
      { usedDays: -application.totalDays }
    );
  } else if (application.status === "PENDING") {
    await updateLeaveBalance(
      application.employeeId,
      application.startDate.getFullYear(),
      application.leaveTypeId!,
      { pendingDays: -application.totalDays }
    );
  }

  const updated = await prisma.leaveApplication.update({
    where: { id: applicationId },
    data: {
      isCancelled: true,
      cancelledAt: new Date(),
      cancelledBy: userId,
      status: "CANCELLED",
    },
  });

  // Send HR notification for leave cancellation
  const employeeFullName = `${application.employee.firstName} ${application.employee.lastName}`;
  await createHRNotification(
    application.companyId,
    "LEAVE_CANCELLED",
    "Leave Application Cancelled",
    `${employeeFullName} has cancelled their ${application.leaveTypeConfig?.name || "leave"} application for ${application.startDate.toLocaleDateString()} - ${application.endDate.toLocaleDateString()}`,
    "LeaveApplication",
    applicationId
  );

  return updated;
}

// ========================================
// LEAVE COMMENTS
// ========================================

export async function addLeaveComment(
  applicationId: string,
  userId: string,
  comment: string,
  isInternal: boolean = false
) {
  return prisma.leaveComment.create({
    data: {
      applicationId,
      userId,
      comment,
      isInternal,
    },
    include: { user: { select: { id: true, name: true } } },
  });
}

// ========================================
// LEAVE NOTIFICATIONS
// ========================================

export async function createLeaveNotification(
  companyId: string,
  employeeId: string,
  type: NotificationType,
  title: string,
  message: string,
  relatedType?: string,
  relatedId?: string
) {
  return prisma.leaveNotification.create({
    data: {
      companyId,
      employeeId,
      type,
      title,
      message,
      relatedType,
      relatedId,
    },
  });
}

export async function getEmployeeNotifications(employeeId: string, unreadOnly: boolean = false) {
  return prisma.leaveNotification.findMany({
    where: { employeeId, ...(unreadOnly ? { isRead: false } : {}) },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function markNotificationAsRead(id: string) {
  return prisma.leaveNotification.update({
    where: { id },
    data: { isRead: true, readAt: new Date() },
  });
}

// HR Admin Notification Functions
export async function createHRNotification(
  companyId: string,
  type: NotificationType,
  title: string,
  message: string,
  relatedType?: string,
  relatedId?: string
) {
  const hrAdmin = await prisma.user.findFirst({
    where: { companyId, role: "HR_ADMIN" },
    select: { employeeId: true },
  });

  if (hrAdmin?.employeeId) {
    return prisma.leaveNotification.create({
      data: {
        companyId,
        employeeId: hrAdmin.employeeId,
        type,
        title,
        message,
        relatedType,
        relatedId,
      },
    });
  }
  return null;
}

export async function getHRNotifications(companyId: string, unreadOnly: boolean = false) {
  const hrAdmin = await prisma.user.findFirst({
    where: { companyId, role: "HR_ADMIN" },
    select: { employeeId: true },
  });

  if (!hrAdmin?.employeeId) {
    return [];
  }

  return prisma.leaveNotification.findMany({
    where: { 
      employeeId: hrAdmin.employeeId,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getUnreadNotificationCount(companyId: string) {
  const hrAdmin = await prisma.user.findFirst({
    where: { companyId, role: "HR_ADMIN" },
    select: { employeeId: true },
  });

  if (!hrAdmin?.employeeId) {
    return 0;
  }

  return prisma.leaveNotification.count({
    where: { employeeId: hrAdmin.employeeId, isRead: false },
  });
}

export async function markAllNotificationsAsRead(companyId: string) {
  const hrAdmin = await prisma.user.findFirst({
    where: { companyId, role: "HR_ADMIN" },
    select: { employeeId: true },
  });

  if (!hrAdmin?.employeeId) {
    return { count: 0 };
  }

  return prisma.leaveNotification.updateMany({
    where: { employeeId: hrAdmin.employeeId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

// ========================================
// HOLIDAYS MANAGEMENT
// ========================================

export async function getHolidays(companyId: string, year?: number, branchId?: string) {
  const where: any = { companyId };
  if (year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    where.date = { gte: startDate, lte: endDate };
  }
  if (branchId) {
    where.OR = [{ branchId }, { branchId: null }];
  }

  return prisma.holiday.findMany({
    where,
    include: { branch: { select: { id: true, name: true } } },
    orderBy: { date: "asc" },
  });
}

export async function createHoliday(
  companyId: string,
  data: {
    name: string;
    date: Date;
    description?: string;
    branchId?: string;
    isOptional?: boolean;
    isRecurring?: boolean;
  }
) {
  return prisma.holiday.create({
    data: {
      companyId,
      name: data.name,
      date: data.date,
      description: data.description,
      branchId: data.branchId ?? null,
      isOptional: data.isOptional ?? false,
      isRecurring: data.isRecurring ?? true,
    },
  });
}

export async function updateHoliday(id: string, data: {
  name?: string;
  date?: Date;
  description?: string;
  branchId?: string | null;
  isOptional?: boolean;
  isRecurring?: boolean;
}) {
  return prisma.holiday.update({
    where: { id },
    data: {
      ...data,
      branchId: data.branchId ?? null,
    },
  });
}

export async function deleteHoliday(id: string) {
  return prisma.holiday.delete({ where: { id } });
}

export async function bulkCreateHolidays(companyId: string, holidays: Array<{
  name: string;
  date: Date;
  description?: string;
  isOptional?: boolean;
}>) {
  return prisma.holiday.createMany({
    data: holidays.map((h) => ({
      companyId,
      name: h.name,
      date: h.date,
      description: h.description,
      isOptional: h.isOptional ?? false,
      isRecurring: true,
    })),
    skipDuplicates: true,
  });
}

// ========================================
// COMP-OFF MANAGEMENT
// ========================================

export async function createCompOffRequest(
  companyId: string,
  employeeId: string,
  data: {
    workDate: Date;
    workSession?: SessionType;
    reason?: string;
    attachmentUrl?: string;
  }
) {
  const existing = await prisma.compOffRequest.findFirst({
    where: { employeeId, workDate: data.workDate },
  });

  if (existing) {
    throw new Error("Comp-off request already exists for this date");
  }

  const request = await prisma.compOffRequest.create({
    data: {
      companyId,
      employeeId,
      workDate: data.workDate,
      workSession: data.workSession ?? "FULL_DAY",
      reason: data.reason,
      attachmentUrl: data.attachmentUrl,
      status: "PENDING",
      expiryDate: new Date(data.workDate.getTime() + 365 * 24 * 60 * 60 * 1000),
    },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });

  await createHRNotification(
    companyId,
    "COMP_OFF_APPLIED",
    "New Comp-Off Request",
    `${request.employee.firstName} ${request.employee.lastName} has requested Comp-Off for ${data.workDate.toLocaleDateString()}`,
    "CompOffRequest",
    request.id
  );

  return request;
}

export async function listCompOffRequests(
  companyId: string,
  filters: {
    employeeId?: string;
    status?: CompOffStatus;
    page?: number;
    limit?: number;
  }
) {
  const { employeeId, status, page = 1, limit = 20 } = filters;
  const where: any = { companyId };
  if (employeeId) where.employeeId = employeeId;
  if (status) where.status = status;

  const [requests, total] = await Promise.all([
    prisma.compOffRequest.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.compOffRequest.count({ where }),
  ]);

  return { requests, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function approveCompOffRequest(
  requestId: string,
  approverId: string,
  approved: boolean,
  comments?: string
) {
  const request = await prisma.compOffRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) throw new Error("Comp-off request not found");

  await prisma.compOffRequest.update({
    where: { id: requestId },
    data: {
      status: approved ? "APPROVED" : "REJECTED",
      approvedBy: approverId,
      approvedAt: new Date(),
    },
  });

  if (approved) {
    const balance = await prisma.compOffBalance.findUnique({
      where: { employeeId: request.employeeId },
    });

    const days = request.workSession === "FULL_DAY" ? 1 : 0.5;

    if (balance) {
      await prisma.compOffBalance.update({
        where: { id: balance.id },
        data: {
          earnedDays: { increment: days },
          availableDays: { increment: days },
        },
      });
    } else {
      await prisma.compOffBalance.create({
        data: {
          employeeId: request.employeeId,
          companyId: request.companyId,
          earnedDays: days,
          usedDays: 0,
          availableDays: days,
        },
      });
    }

    await createLeaveNotification(
      request.companyId,
      request.employeeId,
      "COMP_OFF_APPROVED",
      "Comp-Off Request Approved",
      `Your comp-off request for ${request.workDate.toLocaleDateString()} has been approved. You have earned ${days} day(s).`,
      "CompOffRequest",
      requestId
    );
  } else {
    await createLeaveNotification(
      request.companyId,
      request.employeeId,
      "COMP_OFF_REJECTED",
      "Comp-Off Request Rejected",
      `Your comp-off request for ${request.workDate.toLocaleDateString()} has been rejected.${comments ? ` Reason: ${comments}` : ""}`,
      "CompOffRequest",
      requestId
    );
  }

  return { success: true };
}

export async function getCompOffBalance(employeeId: string) {
  return prisma.compOffBalance.findUnique({
    where: { employeeId },
  });
}

export async function useCompOff(
  employeeId: string,
  companyId: string,
  leaveApplicationId: string
) {
  const balance = await prisma.compOffBalance.findUnique({
    where: { employeeId },
  });

  if (!balance || balance.availableDays <= 0) {
    throw new Error("No comp-off balance available");
  }

  await prisma.compOffBalance.update({
    where: { id: balance.id },
    data: {
      usedDays: { increment: 1 },
      availableDays: { decrement: 1 },
    },
  });

  const activeCompOffs = await prisma.compOffRequest.findMany({
    where: { employeeId, status: "APPROVED", isUsed: false },
    orderBy: { expiryDate: "asc" },
    take: 1,
  });

  if (activeCompOffs.length > 0) {
    await prisma.compOffRequest.update({
      where: { id: activeCompOffs[0].id },
      data: { isUsed: true, usedOnDate: new Date() },
    });
  }

  return { success: true };
}

export async function processExpiredCompOffs(companyId: string) {
  const now = new Date();
  await prisma.compOffRequest.updateMany({
    where: {
      companyId,
      status: "APPROVED",
      isUsed: false,
      expiryDate: { lt: now },
    },
    data: { status: "EXPIRED" },
  });

  const expiredRequests = await prisma.compOffRequest.findMany({
    where: {
      companyId,
      status: "EXPIRED",
      isUsed: false,
    },
  });

  for (const request of expiredRequests) {
    await createLeaveNotification(
      companyId,
      request.employeeId,
      "COMP_OFF_EXPIRING",
      "Comp-Off Expired",
      `Your comp-off from ${request.workDate.toLocaleDateString()} has expired.`,
      "CompOffRequest",
      request.id
    );
  }
}