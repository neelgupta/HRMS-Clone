import { prisma } from "@/lib/prisma";

export type LeaveApplicationWithDetails = any;
export type LeaveBalanceWithType = any;

// ========================================
// NOTIFICATION HELPER (Inline - until schema is added)
// ========================================

async function createNotification(
  companyId: string,
  employeeId: string,
  input: {
    type: string;
    title: string;
    message: string;
    relatedType?: string;
    relatedId?: string;
  }
) {
  // Placeholder - will work when LeaveNotification model is added
  console.log("Notification:", { companyId, employeeId, ...input });
  return { id: "placeholder" };
}

// ========================================
// EMAIL HELPER (Inline)
// ========================================

async function sendEmail(input: { to: string; subject: string; html: string }) {
  // Placeholder - will work when email module is properly configured
  console.log("Email:", input);
  return true;
}

// ========================================
// LEAVE TYPE CONFIGURATION
// ========================================

export async function createLeaveTypeConfig(
  companyId: string,
  input: {
    name: string;
    code: string;
    type: string;
    annualDays?: number;
    accrualType?: string;
    accrualRate?: number;
    maxConsecutive?: number;
    minNoticeDays?: number;
    canApplyHalfDay?: boolean;
    genderSpecific?: string;
    allowCarryForward?: boolean;
    maxCarryForward?: number;
    allowEncashment?: boolean;
    maxEncashDays?: number;
    expiryDays?: number;
  }
) {
  return prisma.leaveTypeConfig.create({
    data: {
      companyId,
      name: input.name,
      code: input.code.toUpperCase(),
      type: input.type as any,
      annualDays: input.annualDays ?? 0,
      accrualType: (input.accrualType ?? "YEARLY") as any,
      accrualRate: input.accrualRate ?? 0,
      maxConsecutive: input.maxConsecutive ?? 0,
      minNoticeDays: input.minNoticeDays ?? 0,
      canApplyHalfDay: input.canApplyHalfDay ?? true,
      genderSpecific: input.genderSpecific as any,
      allowCarryForward: input.allowCarryForward ?? false,
      maxCarryForward: input.maxCarryForward ?? 0,
      allowEncashment: input.allowEncashment ?? false,
      maxEncashDays: input.maxEncashDays ?? 0,
      expiryDays: input.expiryDays ?? 0,
    },
  });
}

export async function listLeaveTypeConfigs(companyId: string) {
  return prisma.leaveTypeConfig.findMany({
    where: { companyId, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function updateLeaveTypeConfig(
  id: string,
  companyId: string,
  input: Partial<{
    name: string;
    annualDays: number;
    accrualType: string;
    accrualRate: number;
    maxConsecutive: number;
    minNoticeDays: number;
    canApplyHalfDay: boolean;
    isActive: boolean;
    sortOrder: number;
  }>
) {
  return prisma.leaveTypeConfig.update({
    where: { id, companyId },
    data: input as any,
  });
}

// ========================================
// LEAVE APPLICATION (Enhanced with half-day & workflow)
// ========================================

function calculateLeaveDays(
  startDate: Date,
  endDate: Date,
  startSession: string,
  endSession: string
): number {
  let totalDays = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    
    // Skip weekends
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Check for half-day
      if (current.getTime() === startDate.getTime()) {
        if (startSession === "FULL_DAY") totalDays += 1;
        else totalDays += 0.5;
      } else if (current.getTime() === endDate.getTime()) {
        if (endSession === "FULL_DAY") totalDays += 1;
        else totalDays += 0.5;
      } else {
        totalDays += 1;
      }
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return totalDays;
}

export async function createLeaveApplication(
  companyId: string,
  employeeId: string,
  input: {
    leaveTypeId: string;
    startDate: Date;
    endDate: Date;
    startSession?: string;
    endSession?: string;
    reason?: string;
    attachmentUrl?: string;
  }
) {
  // Get leave type config
  const leaveTypeConfig = await prisma.leaveTypeConfig.findFirst({
    where: { id: input.leaveTypeId, companyId },
  });
  
  if (!leaveTypeConfig) {
    throw new Error("Invalid leave type");
  }
  
  // Calculate leave days
  const totalDays = calculateLeaveDays(
    input.startDate,
    input.endDate,
    input.startSession ?? "FULL_DAY",
    input.endSession ?? "FULL_DAY"
  );
  
  // Check minimum notice period
  const daysBeforeStart = Math.floor(
    (input.startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (leaveTypeConfig.minNoticeDays > 0 && daysBeforeStart < leaveTypeConfig.minNoticeDays) {
    throw new Error(`Minimum ${leaveTypeConfig.minNoticeDays} days notice required for this leave type`);
  }
  
  // Check maximum consecutive days
  if (leaveTypeConfig.maxConsecutive > 0 && totalDays > leaveTypeConfig.maxConsecutive) {
    throw new Error(`Maximum ${leaveTypeConfig.maxConsecutive} days allowed for this leave type`);
  }
  
  // Check leave balance
  const year = input.startDate.getFullYear();
  const balance = await prisma.leaveBalance.findFirst({
    where: {
      employeeId,
      leaveTypeId: input.leaveTypeId,
      year,
    },
  });
  
  if (balance && balance.availableDays < totalDays) {
    throw new Error(`Insufficient leave balance. Available: ${balance.availableDays}, Requested: ${totalDays}`);
  }
  
  // Create application
  const application = await prisma.leaveApplication.create({
    data: {
      employeeId,
      companyId,
      leaveTypeId: input.leaveTypeId,
      startDate: input.startDate,
      endDate: input.endDate,
      startSession: (input.startSession ?? "FULL_DAY") as any,
      endSession: (input.endSession ?? "FULL_DAY") as any,
      totalDays,
      reason: input.reason,
      attachmentUrl: input.attachmentUrl,
      status: "PENDING",
      level1Status: "PENDING",
    },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, email: true, reportingManagerId: true },
      },
      leaveTypeConfig: true,
    },
  });
  
  // Update pending balance
  if (balance) {
    await prisma.leaveBalance.update({
      where: { id: balance.id },
      data: {
        pendingDays: { increment: totalDays },
        availableDays: { decrement: totalDays },
      },
    });
  }
  
  // Get approver (reporting manager)
  const managerId = application.employee.reportingManagerId;
  if (managerId) {
    const manager = await prisma.user.findUnique({
      where: { id: managerId },
      select: { id: true, employeeId: true },
    });
    
    if (manager?.employeeId) {
      // Create notification for manager
      await createNotification(companyId, manager.employeeId, {
        type: "LEAVE_APPLIED",
        title: "New Leave Application",
        message: `${application.employee.firstName} ${application.employee.lastName} has applied for ${leaveTypeConfig.name}`,
        relatedType: "LeaveApplication",
        relatedId: application.id,
      });
      
      // Send email to manager
      const managerUser = await prisma.user.findUnique({
        where: { id: managerId },
        select: { email: true, name: true },
      });
      
      if (managerUser?.email) {
        await sendEmail({
          to: managerUser.email,
          subject: `Leave Application from ${application.employee.firstName}`,
          html: `<p>A new leave application requires your approval.</p>
                 <p><strong>Employee:</strong> ${application.employee.firstName} ${application.employee.lastName}</p>
                 <p><strong>Type:</strong> ${leaveTypeConfig.name}</p>
                 <p><strong>Duration:</strong> ${totalDays} days</p>
                 <p><strong>Dates:</strong> ${input.startDate.toDateString()} - ${input.endDate.toDateString()}</p>`,
        });
      }
    }
  }
  
  return { application };
}

export async function listLeaveApplications(
  companyId: string,
  filters: {
    employeeId?: string;
    status?: string;
    leaveTypeId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }
) {
  const { employeeId, status, leaveTypeId, startDate, endDate, page = 1, limit = 20 } = filters;
  
  const where: any = { companyId };
  if (employeeId) where.employeeId = employeeId;
  if (status) where.status = status;
  if (leaveTypeId) where.leaveTypeId = leaveTypeId;
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
            reportingManagerId: true,
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

// ========================================
// LEAVE APPROVAL WORKFLOW (Multi-level)
// ========================================

export async function approveLeave(
  companyId: string,
  approverId: string,
  applicationId: string,
  input: {
    level: number; // 1 or 2
    action: "APPROVED" | "REJECTED" | "MODIFICATION_REQUESTED";
    remarks?: string;
  }
) {
  const application = await prisma.leaveApplication.findFirst({
    where: { id: applicationId, companyId },
    include: {
      employee: true,
      leaveTypeConfig: true,
    },
  });
  
  if (!application) {
    throw new Error("Leave application not found");
  }
  
  // Verify approver has permission
  if (input.level === 1) {
    // Manager approval
    const managerEmployee = await prisma.employee.findFirst({
      where: {
        user: { id: approverId },
        companyId,
      },
      select: { id: true },
    });
    
    if (managerEmployee?.id !== application.employee.reportingManagerId) {
      throw new Error("You are not authorized to approve this application");
    }
  }
  
  // Update application status
  const updateData: any = {};
  
  if (input.level === 1) {
    updateData.level1Status = input.action;
    updateData.level1ReviewedBy = approverId;
    updateData.level1ReviewedAt = new Date();
    updateData.level1Remarks = input.remarks;
    
    // Check if level 2 is required
    const policy = await prisma.leavePolicy.findUnique({ where: { companyId } });
    
    if (policy?.approvalLevel2 && input.action === "APPROVED") {
      updateData.currentApproverLevel = 2;
    } else if (input.action === "APPROVED") {
      updateData.status = "APPROVED";
    }
  } else {
    updateData.level2Status = input.action;
    updateData.level2ReviewedBy = approverId;
    updateData.level2ReviewedAt = new Date();
    updateData.level2Remarks = input.remarks;
    
    if (input.action === "APPROVED") {
      updateData.status = "APPROVED";
    }
  }
  
  const updated = await prisma.leaveApplication.update({
    where: { id: applicationId },
    data: updateData,
    include: {
      employee: true,
      leaveTypeConfig: true,
    },
  });
  
  // Record approval history
  await prisma.leaveApprovalHistory.create({
    data: {
      applicationId,
      approverId,
      level: input.level,
      action: input.action,
      comments: input.remarks,
    },
  });
  
  // Update leave balance if approved
  if (input.action === "APPROVED" && (input.level === 2 || !updated.currentApproverLevel)) {
    const balance = await prisma.leaveBalance.findFirst({
      where: {
        employeeId: application.employeeId,
        leaveTypeId: application.leaveTypeId,
        year: application.startDate.getFullYear(),
      },
    });
    
    if (balance) {
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          usedDays: { increment: application.totalDays },
          pendingDays: { decrement: application.totalDays },
        },
      });
    }
    
    // Notify employee
    await createNotification(companyId, application.employeeId, {
      type: "LEAVE_APPROVED",
      title: "Leave Approved",
      message: `Your ${application.leaveTypeConfig?.name || "leave"} application has been approved`,
      relatedType: "LeaveApplication",
      relatedId: application.id,
    });
    
    // Send email
    const employeeUser = await prisma.user.findFirst({
      where: { employeeId: application.employeeId },
    });
    
    if (employeeUser?.email) {
      await sendEmail({
        to: employeeUser.email,
        subject: "Leave Application Approved",
        html: `<p>Your leave application has been approved.</p>
               <p><strong>Type:</strong> ${application.leaveTypeConfig?.name || "Leave"}</p>
               <p><strong>Duration:</strong> ${application.totalDays} days</p>
               <p><strong>Dates:</strong> ${application.startDate.toDateString()} - ${application.endDate.toDateString()}</p>`,
      });
    }
  } else if (input.action === "REJECTED" || input.action === "MODIFICATION_REQUESTED") {
    // Restore pending balance
    const balance = await prisma.leaveBalance.findFirst({
      where: {
        employeeId: application.employeeId,
        leaveTypeId: application.leaveTypeId,
        year: application.startDate.getFullYear(),
      },
    });
    
    if (balance) {
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          pendingDays: { decrement: application.totalDays },
          availableDays: { increment: application.totalDays },
        },
      });
    }
    
    // Notify employee
    const notifType = input.action === "REJECTED" ? "LEAVE_REJECTED" : "LEAVE_MODIFICATION_REQUESTED";
    await createNotification(companyId, application.employeeId, {
      type: notifType as any,
      title: input.action === "REJECTED" ? "Leave Rejected" : "Modification Requested",
      message: input.remarks || `Your ${application.leaveTypeConfig?.name || "leave"} application was ${input.action.toLowerCase()}`,
      relatedType: "LeaveApplication",
      relatedId: application.id,
    });
  }
  
  return { application: updated };
}

// ========================================
// LEAVE BALANCE (Enhanced)
// ========================================

export async function getEmployeeLeaveBalances(employeeId: string, year: number) {
  return prisma.leaveBalance.findMany({
    where: { employeeId, year },
    include: { leaveTypeConfig: true },
    orderBy: { leaveTypeConfig: { sortOrder: "asc" } },
  });
}

export async function initializeEmployeeBalances(
  employeeId: string,
  companyId: string,
  year: number
) {
  const leaveTypes = await prisma.leaveTypeConfig.findMany({
    where: { companyId, isActive: true, annualDays: { gt: 0 } },
  });
  
  const balances = await Promise.all(
    leaveTypes.map((lt) =>
      prisma.leaveBalance.upsert({
        where: {
          employeeId_year_leaveTypeId: {
            employeeId,
            year,
            leaveTypeId: lt.id,
          },
        },
        create: {
          employeeId,
          companyId,
          leaveTypeId: lt.id,
          year,
          allocatedDays: lt.annualDays,
          accruedDays: lt.accrualType === "MONTHLY" ? lt.accrualRate : lt.annualDays,
          carriedForward: 0,
          usedDays: 0,
          pendingDays: 0,
          availableDays: lt.annualDays,
        },
        update: {},
      })
    )
  );
  
  return balances;
}

// Monthly accrual - called by cron job
export async function processMonthlyAccrual(companyId: string, month: number, year: number) {
  const leaveTypes = await prisma.leaveTypeConfig.findMany({
    where: { companyId, isActive: true, accrualType: "MONTHLY" },
  });
  
  const employees = await prisma.employee.findMany({
    where: { companyId, employmentStatus: { in: ["PROBATION", "CONFIRMED"] } },
  });
  
  for (const employee of employees) {
    for (const lt of leaveTypes) {
      const balance = await prisma.leaveBalance.findFirst({
        where: {
          employeeId: employee.id,
          leaveTypeId: lt.id,
          year,
          month,
        },
      });
      
      if (balance) {
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: {
            accruedDays: { increment: lt.accrualRate },
            availableDays: { increment: lt.accrualRate },
            lastAccruedAt: new Date(),
          },
        });
      }
    }
  }
}

// ========================================
// COMP-OFF MANAGEMENT
// ========================================

export async function createCompOffRequest(
  companyId: string,
  employeeId: string,
  input: {
    workDate: Date;
    workSession?: string;
    reason?: string;
    attachmentUrl?: string;
  }
) {
  const compOff = await prisma.compOffRequest.create({
    data: {
      companyId,
      employeeId,
      workDate: input.workDate,
      workSession: (input.workSession ?? "FULL_DAY") as any,
      reason: input.reason,
      attachmentUrl: input.attachmentUrl,
      status: "PENDING",
      // Expiry: 3 months from work date
      expiryDate: new Date(input.workDate.getTime() + 90 * 24 * 60 * 60 * 1000),
    },
    include: { employee: true },
  });
  
  return { compOff };
}

export async function approveCompOff(
  companyId: string,
  approverId: string,
  compOffId: string,
  action: "APPROVED" | "REJECTED"
) {
  const compOff = await prisma.compOffRequest.update({
    where: { id: compOffId, companyId },
    data: {
      status: action,
      approvedBy: approverId,
      approvedAt: new Date(),
    },
  });
  
  // If approved, add to comp-off balance
  if (action === "APPROVED") {
    await prisma.compOffBalance.upsert({
      where: { employeeId: compOff.employeeId },
      create: {
        employeeId: compOff.employeeId,
        companyId,
        earnedDays: 1,
        availableDays: 1,
      },
      update: {
        earnedDays: { increment: 1 },
        availableDays: { increment: 1 },
      },
    });
  }
  
  return { compOff };
}

export async function getCompOffBalance(employeeId: string) {
  let balance = await prisma.compOffBalance.findUnique({
    where: { employeeId },
  });
  
  if (!balance) {
    balance = await prisma.compOffBalance.create({
      data: { employeeId, companyId: "", earnedDays: 0, usedDays: 0, availableDays: 0 },
    });
  }
  
  return balance;
}

export async function useCompOff(
  employeeId: string,
  compOffId: string,
  leaveDate: Date
) {
  const compOff = await prisma.compOffRequest.update({
    where: { id: compOffId, employeeId, status: "APPROVED" },
    data: { isUsed: true, usedOnDate: leaveDate },
  });
  
  const balance = await prisma.compOffBalance.findUnique({
    where: { employeeId },
  });
  
  if (balance) {
    await prisma.compOffBalance.update({
      where: { id: balance.id },
      data: { usedDays: { increment: 1 }, availableDays: { decrement: 1 } },
    });
  }
  
  return { compOff };
}

// ========================================
// HOLIDAYS MANAGEMENT
// ========================================

export async function createHoliday(
  companyId: string,
  input: {
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
      name: input.name,
      date: input.date,
      description: input.description,
      branchId: input.branchId,
      isOptional: input.isOptional ?? false,
      isRecurring: input.isRecurring ?? true,
    },
  });
}

export async function listHolidays(companyId: string, year: number, branchId?: string) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  
  return prisma.holiday.findMany({
    where: {
      companyId,
      branchId: branchId ?? null,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: "asc" },
  });
}

export async function deleteHoliday(companyId: string, holidayId: string) {
  return prisma.holiday.delete({
    where: { id: holidayId, companyId },
  });
}

// ========================================
// LEAVE COMMENTS
// ========================================

export async function addLeaveComment(
  applicationId: string,
  userId: string,
  input: { comment: string; isInternal?: boolean }
) {
  return prisma.leaveComment.create({
    data: {
      applicationId,
      userId,
      comment: input.comment,
      isInternal: input.isInternal ?? false,
    },
    include: { user: { select: { name: true } } },
  });
}

export async function getLeaveComments(applicationId: string) {
  return prisma.leaveComment.findMany({
    where: { applicationId },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
}

// ========================================
// LEAVE POLICY
// ========================================

export async function getLeavePolicy(companyId: string) {
  let policy = await prisma.leavePolicy.findUnique({ where: { companyId } });
  
  if (!policy) {
    policy = await prisma.leavePolicy.create({
      data: {
        companyId,
        approvalLevel1: "MANAGER",
        managerApprovalDays: 2,
        hrApprovalDays: 3,
      },
    });
  }
  
  return policy;
}

export async function updateLeavePolicy(
  companyId: string,
  input: {
    approvalLevel1?: string;
    approvalLevel2?: string;
    managerApprovalDays?: number;
    hrApprovalDays?: number;
    allowAutoApproval?: boolean;
    autoApprovalDaysThreshold?: number;
  }
) {
  return prisma.leavePolicy.upsert({
    where: { companyId },
    update: input as any,
    create: {
      companyId,
      approvalLevel1: (input.approvalLevel1 ?? "MANAGER") as any,
      approvalLevel2: input.approvalLevel2 as any,
      managerApprovalDays: input.managerApprovalDays ?? 2,
      hrApprovalDays: input.hrApprovalDays ?? 3,
      allowAutoApproval: input.allowAutoApproval ?? false,
      autoApprovalDaysThreshold: input.autoApprovalDaysThreshold ?? 0,
    },
  });
}