import { prisma } from "@/lib/prisma";
import type {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  EmployeeSearchInput,
  DocumentUploadInput,
} from "@/lib/validations/employee";
import { Prisma } from "@prisma/client";
import { hashPassword } from "@/lib/password";

export type EmployeeListItem = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  photoUrl: string | null;
  department: string | null;
  designation: string | null;
  employmentType: string;
  employmentStatus: string;
  dateOfJoining: Date | null;
  branch: { id: string; name: string } | null;
};

export type EmployeeDetail = EmployeeListItem & {
  dateOfBirth: Date | null;
  gender: string | null;
  maritalStatus: string | null;
  bloodGroup: string | null;
  dateOfLeaving: Date | null;
  reportingManagerId: string | null;

  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;

  presentAddressLine1: string | null;
  presentAddressLine2: string | null;
  presentCity: string | null;
  presentState: string | null;
  presentCountry: string | null;
  presentPincode: string | null;

  permanentAddressLine1: string | null;
  permanentAddressLine2: string | null;
  permanentCity: string | null;
  permanentState: string | null;
  permanentCountry: string | null;
  permanentPincode: string | null;

  bankAccountHolderName: string | null;
  bankAccountNumber: string | null;
  bankName: string | null;
  bankBranchName: string | null;
  bankIfscCode: string | null;

  panNumber: string | null;
  aadharNumber: string | null;
  pfNumber: string | null;
  pfUAN: string | null;
  esiNumber: string | null;
  
  companyEmail: string | null;

  education: Array<{
    id: string;
    degree: string;
    institution: string;
    yearOfPassing: number | null;
    percentage: number | null;
  }>;
  workHistory: Array<{
    id: string;
    companyName: string;
    designation: string;
    startDate: Date;
    endDate: Date | null;
    isCurrent: boolean;
    reasonForLeaving: string | null;
  }>;
  documents: Array<{
    id: string;
    type: string;
    name: string;
    fileUrl: string;
    fileSize: number | null;
    expiryDate: Date | null;
    version: number;
    isExpired: boolean;
    createdAt: Date;
  }>;
  user: {
    id: string;
    email: string;
    status: string;
  } | null;
};

type CreateEmployeeResult = {
  employee: EmployeeDetail;
  loginCredentials?: {
    email: string;
    tempPassword: string;
    userId: string;
  };
};

type UpdateEmployeeResult = {
  employee: EmployeeDetail;
};

type ListEmployeesResult = {
  employees: EmployeeListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

async function generateEmployeeCode(companyId: string): Promise<string> {
  const prefix = "EMP";
  const maxRetries = 5;

  for (let i = 0; i < maxRetries; i++) {
    const count = await prisma.employee.count({ where: { companyId } });
    const paddedNumber = String(count + 1).padStart(5, "0");
    const code = `${prefix}-${paddedNumber}`;

    const existing = await prisma.employee.findUnique({
      where: { employeeCode: code },
      select: { id: true },
    });

    if (!existing) {
      return code;
    }
  }

  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function createAuditLog(params: {
  companyId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string;
  userAgent?: string;
}) {
  await prisma.auditLog.create({
    data: {
      companyId: params.companyId,
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      oldValues: params.oldValues ?? undefined,
      newValues: params.newValues ?? undefined,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });
}

export async function createEmployee(
  companyId: string,
  userId: string,
  input: CreateEmployeeInput,
): Promise<CreateEmployeeResult> {
  const employeeCode = await generateEmployeeCode(companyId);

  let departmentId: string | undefined;
  let designationId: string | undefined;
  let reportingManagerId: string | undefined;

  if (input.department && input.department.trim()) {
    try {
      const dept = await prisma.department.upsert({
        where: { companyId_code: { companyId, code: input.department.toLowerCase().replace(/\s+/g, "-") } },
        update: {},
        create: { companyId, name: input.department, code: input.department.toLowerCase().replace(/\s+/g, "-") },
      });
      departmentId = dept.id;
    } catch (deptError) {
      console.error("Department upsert error:", deptError);
    }
  }

  if (input.designation && input.designation.trim()) {
    try {
      const desig = await prisma.designation.upsert({
        where: { companyId_code: { companyId, code: input.designation.toLowerCase().replace(/\s+/g, "-") } },
        update: {},
        create: { companyId, name: input.designation, code: input.designation.toLowerCase().replace(/\s+/g, "-") },
      });
      designationId = desig.id;
    } catch (desigError) {
      console.error("Designation upsert error:", desigError);
    }
  }

  if (input.reportingManagerId) {
    reportingManagerId = input.reportingManagerId;
  }

  try {
    const employee = await prisma.employee.create({
      data: {
        companyId,
        employeeCode,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email.toLowerCase(),
        phone: input.phone,
        photoUrl: input.photoUrl || null,
        branchId: input.branchId,
        departmentId,
        designationId,
        reportingManagerId,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
        gender: input.gender,
        maritalStatus: input.maritalStatus,
        bloodGroup: input.bloodGroup,
        dateOfJoining: input.dateOfJoining ? new Date(input.dateOfJoining) : null,
        probationEndDate: input.probationEndDate ? new Date(input.probationEndDate) : null,
      employmentType: input.employmentType,
      employmentStatus: input.employmentStatus,
      emergencyContactName: input.emergencyContactName,
      emergencyContactPhone: input.emergencyContactPhone,
      emergencyContactRelation: input.emergencyContactRelation,
      presentAddressLine1: input.presentAddressLine1,
      presentAddressLine2: input.presentAddressLine2,
      presentCity: input.presentCity,
      presentState: input.presentState,
      presentCountry: input.presentCountry,
      presentPincode: input.presentPincode,
      permanentAddressLine1: input.permanentAddressLine1,
      permanentAddressLine2: input.permanentAddressLine2,
      permanentCity: input.permanentCity,
      permanentState: input.permanentState,
      permanentCountry: input.permanentCountry,
      permanentPincode: input.permanentPincode,
      bankAccountHolderName: input.bankAccountHolderName,
      bankAccountNumber: input.bankAccountNumber,
      bankName: input.bankName,
      bankBranchName: input.bankBranchName,
      bankIfscCode: input.bankIfscCode,
      panNumber: input.panNumber,
      aadharNumber: input.aadharNumber,
      pfNumber: input.pfNumber,
      pfUAN: input.pfUAN,
      esiNumber: input.esiNumber,
      education: input.education
        ? {
            create: input.education.map((edu) => ({
              degree: edu.degree,
              institution: edu.institution,
              yearOfPassing: edu.yearOfPassing,
              percentage: edu.percentage,
            })),
          }
        : undefined,
      workHistory: input.workHistory
        ? {
            create: input.workHistory.map((wh) => ({
              companyName: wh.companyName,
              designation: wh.designation,
              startDate: new Date(wh.startDate),
              endDate: wh.endDate ? new Date(wh.endDate) : null,
              isCurrent: wh.isCurrent,
              reasonForLeaving: wh.reasonForLeaving,
            })),
          }
        : undefined,
    },
    include: {
      branch: { select: { id: true, name: true } },
      department: { select: { id: true, name: true, code: true } },
      designation: { select: { id: true, name: true, code: true, level: true } },
      education: true,
      workHistory: true,
      documents: true,
    },
  });

  await createAuditLog({
    companyId,
    userId,
    action: "CREATE",
    entityType: "Employee",
    entityId: employee.id,
    newValues: employee,
  });

  // Use companyEmail for login if provided, otherwise fallback to userEmail or employee email
  const loginEmail = input.companyEmail || input.userEmail || employee.email;
  const tempPassword = input.userPassword || generateTempPassword();
  const hashedPassword = await hashPassword(tempPassword);

  const user = await prisma.user.create({
    data: {
      name: `${employee.firstName} ${employee.lastName}`,
      email: loginEmail.toLowerCase(),
      phone: employee.phone || "",
      password: hashedPassword,
      role: "EMPLOYEE",
      status: "ACTIVE",
      companyId,
      employeeId: employee.id,
    },
  });

  await createAuditLog({
    companyId,
    userId,
    action: "CREATE",
    entityType: "User",
    entityId: user.id,
    newValues: { role: "EMPLOYEE", email: user.email },
  });

  const flattened = {
    ...employee,
    department: employee.department?.name || null,
    designation: employee.designation?.name || null,
  };

   return { 
     employee: flattened as unknown as EmployeeDetail,
     loginCredentials: {
       email: loginEmail,
       tempPassword: tempPassword,
       userId: user.id,
     }
   };
  } catch (createError) {
    console.error("Create employee error:", createError);
    throw createError;
  }
}

export async function updateEmployee(
  companyId: string,
  userId: string,
  input: UpdateEmployeeInput,
): Promise<UpdateEmployeeResult> {
  const { id, education, workHistory, ...updateData } = input;

  const existing = await prisma.employee.findFirst({
    where: { id, companyId },
    include: { education: true, workHistory: true },
  });

  if (!existing) {
    throw new Error("Employee not found.");
  }

  let departmentId: string | null | undefined;
  let designationId: string | null | undefined;

  if (updateData.department !== undefined) {
    if (!updateData.department) {
      departmentId = null;
    } else {
      const dept = await prisma.department.upsert({
        where: { companyId_code: { companyId, code: updateData.department.toLowerCase().replace(/\s+/g, "-") } },
        update: {},
        create: { companyId, name: updateData.department, code: updateData.department.toLowerCase().replace(/\s+/g, "-") },
      });
      departmentId = dept.id;
    }
  }

  if (updateData.designation !== undefined) {
    if (!updateData.designation) {
      designationId = null;
    } else {
      const desig = await prisma.designation.upsert({
        where: { companyId_code: { companyId, code: updateData.designation.toLowerCase().replace(/\s+/g, "-") } },
        update: {},
        create: { companyId, name: updateData.designation, code: updateData.designation.toLowerCase().replace(/\s+/g, "-") },
      });
      designationId = desig.id;
    }
  }

  const employee = await prisma.employee.update({
    where: { id },
    data: {
      firstName: updateData.firstName,
      lastName: updateData.lastName,
      email: updateData.email?.toLowerCase(),
      phone: updateData.phone,
      branchId: updateData.branchId,
      departmentId,
      designationId,
      dateOfBirth: updateData.dateOfBirth ? new Date(updateData.dateOfBirth) : undefined,
      gender: updateData.gender,
      maritalStatus: updateData.maritalStatus,
      bloodGroup: updateData.bloodGroup,
      dateOfJoining: updateData.dateOfJoining ? new Date(updateData.dateOfJoining) : undefined,
      employmentType: updateData.employmentType,
      employmentStatus: updateData.employmentStatus,
      dateOfLeaving: updateData.dateOfLeaving ? new Date(updateData.dateOfLeaving) : undefined,
      emergencyContactName: updateData.emergencyContactName,
      emergencyContactPhone: updateData.emergencyContactPhone,
      emergencyContactRelation: updateData.emergencyContactRelation,
      presentAddressLine1: updateData.presentAddressLine1,
      presentAddressLine2: updateData.presentAddressLine2,
      presentCity: updateData.presentCity,
      presentState: updateData.presentState,
      presentCountry: updateData.presentCountry,
      presentPincode: updateData.presentPincode,
      permanentAddressLine1: updateData.permanentAddressLine1,
      permanentAddressLine2: updateData.permanentAddressLine2,
      permanentCity: updateData.permanentCity,
      permanentState: updateData.permanentState,
      permanentCountry: updateData.permanentCountry,
      permanentPincode: updateData.permanentPincode,
      bankAccountHolderName: updateData.bankAccountHolderName,
      bankAccountNumber: updateData.bankAccountNumber,
      bankName: updateData.bankName,
      bankBranchName: updateData.bankBranchName,
      bankIfscCode: updateData.bankIfscCode,
      panNumber: updateData.panNumber,
      aadharNumber: updateData.aadharNumber,
      pfNumber: updateData.pfNumber,
      pfUAN: updateData.pfUAN,
      esiNumber: updateData.esiNumber,
    },
    include: {
      branch: { select: { id: true, name: true } },
      department: { select: { id: true, name: true, code: true } },
      designation: { select: { id: true, name: true, code: true, level: true } },
      education: true,
      workHistory: true,
      documents: true,
    },
  });

  if (education) {
    await prisma.employeeEducation.deleteMany({ where: { employeeId: id } });
    if (education.length > 0) {
      await prisma.employeeEducation.createMany({
        data: education.map((edu) => ({
          employeeId: id,
          degree: edu.degree,
          institution: edu.institution,
          yearOfPassing: edu.yearOfPassing,
          percentage: edu.percentage,
        })),
      });
    }
  }

  if (workHistory) {
    await prisma.employeeWorkHistory.deleteMany({ where: { employeeId: id } });
    if (workHistory.length > 0) {
      await prisma.employeeWorkHistory.createMany({
        data: workHistory.map((wh) => ({
          employeeId: id,
          companyName: wh.companyName,
          designation: wh.designation,
          startDate: new Date(wh.startDate),
          endDate: wh.endDate ? new Date(wh.endDate) : null,
          isCurrent: wh.isCurrent,
          reasonForLeaving: wh.reasonForLeaving,
        })),
      });
    }
  }

  await createAuditLog({
    companyId,
    userId,
    action: "UPDATE",
    entityType: "Employee",
    entityId: id,
    oldValues: existing,
    newValues: employee,
  });

  const flattened = {
    ...employee,
    department: employee.department?.name || null,
    designation: employee.designation?.name || null,
  };

  return { employee: flattened as unknown as EmployeeDetail };
}

export async function getEmployeeById(companyId: string, employeeId: string): Promise<EmployeeDetail | null> {
  console.log("getEmployeeById called:", { companyId, employeeId });
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId },
    include: {
      branch: { select: { id: true, name: true } },
      department: { select: { id: true, name: true, code: true } },
      designation: { select: { id: true, name: true, code: true, level: true } },
      education: {
        orderBy: { yearOfPassing: "desc" },
      },
      workHistory: {
        orderBy: { startDate: "desc" },
      },
      documents: {
        orderBy: { createdAt: "desc" },
      },
      user: {
        select: { id: true, email: true, status: true },
      },
    },
  });

  if (!employee) return null;

  const flattened = {
    ...employee,
    department: employee.department?.name || null,
    designation: employee.designation?.name || null,
  };

  return flattened as unknown as EmployeeDetail | null;
}

export async function listEmployees(
  companyId: string,
  input: EmployeeSearchInput,
): Promise<ListEmployeesResult> {
  const { search, department, designation, employmentType, employmentStatus, branchId, page, limit } = input;

  const where: Prisma.EmployeeWhereInput = {
    companyId,
    isDeleted: false,
    ...(department && { department: { name: { contains: department, mode: "insensitive" } } }),
    ...(designation && { designation: { name: { contains: designation, mode: "insensitive" } } }),
    ...(employmentType && { employmentType }),
    ...(employmentStatus && { employmentStatus }),
    ...(branchId && { branchId }),
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { employeeCode: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { department: { name: { contains: search, mode: "insensitive" } } },
        { designation: { name: { contains: search, mode: "insensitive" } } },
      ],
    }),
  };

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
        department: { select: { name: true } },
        designation: { select: { name: true } },
        employmentType: true,
        employmentStatus: true,
        dateOfJoining: true,
        branch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.employee.count({ where }),
  ]);

  const flattenedEmployees = employees.map((emp) => ({
    ...emp,
    department: emp.department?.name || null,
    designation: emp.designation?.name || null,
    dateOfJoining: emp.dateOfJoining ? emp.dateOfJoining.toISOString() : null,
  }));

  return {
    employees: flattenedEmployees as unknown as EmployeeListItem[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function deleteEmployee(companyId: string, userId: string, employeeId: string): Promise<void> {
  const existing = await prisma.employee.findFirst({
    where: { id: employeeId, companyId, isDeleted: false },
  });

  if (!existing) {
    throw new Error("Employee not found.");
  }

  await prisma.employee.update({
    where: { id: employeeId },
    data: { isDeleted: true },
  });

  const linkedUser = await prisma.user.findFirst({
    where: { employeeId },
  });

  if (linkedUser) {
    await prisma.user.update({
      where: { id: linkedUser.id },
      data: { status: "INACTIVE" },
    });
  }

  await createAuditLog({
    companyId,
    userId,
    action: "DELETE",
    entityType: "Employee",
    entityId: employeeId,
    oldValues: existing,
  });
}

export async function uploadDocument(
  companyId: string,
  userId: string,
  input: DocumentUploadInput & { fileUrl: string; fileSize?: number; mimeType?: string },
): Promise<{ document: unknown }> {
  const document = await prisma.document.create({
    data: {
      employeeId: input.employeeId,
      type: input.type,
      name: input.name,
      fileUrl: input.fileUrl,
      fileSize: input.fileSize,
      mimeType: input.mimeType,
      expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
      isExpired: input.expiryDate ? new Date(input.expiryDate) < new Date() : false,
    },
  });

  await createAuditLog({
    companyId,
    userId,
    action: "UPLOAD",
    entityType: "Document",
    entityId: document.id,
    newValues: document,
  });

  return { document };
}

export async function deleteDocument(
  companyId: string,
  userId: string,
  documentId: string,
): Promise<void> {
  const document = await prisma.document.findFirst({
    where: { id: documentId },
    include: { employee: { select: { companyId: true } } },
  });

  if (!document || document.employee.companyId !== companyId) {
    throw new Error("Document not found.");
  }

  await prisma.document.delete({ where: { id: documentId } });

  await createAuditLog({
    companyId,
    userId,
    action: "DELETE",
    entityType: "Document",
    entityId: documentId,
    oldValues: document,
  });
}

export async function getEmployeeStats(companyId: string) {
  const [total, byDepartment, byStatus, byEmploymentType, expiringDocuments] = await Promise.all([
    prisma.employee.count({ where: { companyId } }),
    prisma.employee.groupBy({
      by: ["departmentId"],
      where: { companyId, departmentId: { not: null } },
      _count: { id: true },
    }),
    prisma.employee.groupBy({
      by: ["employmentStatus"],
      where: { companyId },
      _count: { id: true },
    }),
    prisma.employee.groupBy({
      by: ["employmentType"],
      where: { companyId },
      _count: { id: true },
    }),
    prisma.document.findMany({
      where: {
        employee: { companyId },
        expiryDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        isExpired: false,
      },
      select: {
        id: true,
        name: true,
        type: true,
        expiryDate: true,
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
      take: 10,
      orderBy: { expiryDate: "asc" },
    }),
  ]);

  const departmentIds = byDepartment.map((d) => d.departmentId).filter(Boolean) as string[];
  const departments = await prisma.department.findMany({
    where: { id: { in: departmentIds } },
    select: { id: true, name: true },
  });
  const deptMap = new Map(departments.map((d) => [d.id, d.name]));

  return {
    total,
    byDepartment: byDepartment.map((d) => ({ department: d.departmentId ? (deptMap.get(d.departmentId) ?? "Unknown") : "Unknown", count: d._count.id })),
    byStatus: byStatus.map((s) => ({ status: s.employmentStatus, count: s._count.id })),
    byEmploymentType: byEmploymentType.map((t) => ({ type: t.employmentType, count: t._count.id })),
    expiringDocuments,
  };
}

export async function exportEmployeesToCSV(companyId: string): Promise<string> {
  const employees = await prisma.employee.findMany({
    where: { companyId },
    select: {
      employeeCode: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      department: { select: { name: true } },
      designation: { select: { name: true } },
      employmentType: true,
      employmentStatus: true,
      dateOfJoining: true,
      dateOfLeaving: true,
      branch: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const headers = [
    "Employee Code",
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Department",
    "Designation",
    "Employment Type",
    "Status",
    "Branch",
    "Date of Joining",
    "Date of Leaving",
  ];

  const rows = employees.map((emp) => [
    emp.employeeCode,
    emp.firstName,
    emp.lastName,
    emp.email,
    emp.phone || "",
    emp.department?.name || "",
    emp.designation?.name || "",
    emp.employmentType,
    emp.employmentStatus,
    emp.branch?.name || "",
    emp.dateOfJoining ? emp.dateOfJoining.toISOString().split("T")[0] : "",
    emp.dateOfLeaving ? emp.dateOfLeaving!.toISOString().split("T")[0] : "",
  ]);

  const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n");

  return csvContent;
}

export type OrgChartNode = {
  id: string;
  name: string;
  designation: string | null;
  department: string | null;
  photoUrl: string | null;
  children: OrgChartNode[];
};

export async function getOrganizationChart(companyId: string): Promise<OrgChartNode[]> {
  const employees = await prisma.employee.findMany({
    where: {
      companyId,
      employmentStatus: { notIn: ["TERMINATED", "RESIGNED"] },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      designation: { select: { name: true } },
      department: { select: { name: true } },
      photoUrl: true,
      reportingManagerId: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const employeeMap = new Map<string, OrgChartNode>();

  employees.forEach((emp) => {
    employeeMap.set(emp.id, {
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      designation: emp.designation?.name || null,
      department: emp.department?.name || null,
      photoUrl: emp.photoUrl,
      children: [],
    });
  });

  const rootNodes: OrgChartNode[] = [];

  employees.forEach((emp) => {
    const node = employeeMap.get(emp.id)!;
    if (emp.reportingManagerId && employeeMap.has(emp.reportingManagerId)) {
      const manager = employeeMap.get(emp.reportingManagerId)!;
      manager.children.push(node);
    } else {
      rootNodes.push(node);
    }
  });

  return rootNodes;
}

export async function getEmployeesByDepartment(companyId: string) {
  const employees = await prisma.employee.findMany({
    where: { companyId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      department: { select: { name: true } },
      designation: { select: { name: true } },
      photoUrl: true,
      reportingManagerId: true,
    },
    orderBy: [
      { department: { name: "asc" } },
      { createdAt: "asc" },
    ],
  });

  const grouped: Record<string, typeof employees> = {};

  employees.forEach((emp) => {
    const dept = emp.department?.name || "Unassigned";
    if (!grouped[dept]) {
      grouped[dept] = [];
    }
    grouped[dept].push(emp);
  });

  const flattened: Record<string, Array<{
    id: string;
    firstName: string;
    lastName: string;
    department: string | null;
    designation: string | null;
    photoUrl: string | null;
  }>> = {};

  Object.entries(grouped).forEach(([dept, emps]) => {
    flattened[dept] = emps.map((emp) => ({
      id: emp.id,
      firstName: emp.firstName,
      lastName: emp.lastName,
      department: emp.department?.name || null,
      designation: emp.designation?.name || null,
      photoUrl: emp.photoUrl,
    }));
  });

  return flattened;
}

export async function updateEmployeeCredentials(
  companyId: string,
  userId: string,
  employeeId: string,
  input: { email?: string; password?: string },
): Promise<{ email: string; message: string }> {
  console.log("updateEmployeeCredentials called:", { companyId, userId, employeeId, input });

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId, isDeleted: false },
    include: { user: true },
  });

  console.log("Employee found:", employee ? { id: employee.id, hasUser: !!employee.user } : null);

  if (!employee) {
    throw new Error("Employee not found.");
  }

  if (!employee.user) {
    throw new Error("No user account linked to this employee.");
  }

  const existing = await prisma.user.findUnique({
    where: { id: employee.user.id },
    select: { email: true },
  });

  if (!existing) {
    throw new Error("User account not found.");
  }

  const updateData: { email?: string; password?: string } = {};

  // Check if we're updating email and it's different from current user email
  if (input.email && input.email !== existing.email) {
    const emailExists = await prisma.user.findFirst({
      where: { email: input.email.toLowerCase(), id: { not: employee.user.id } },
    });
    if (emailExists) {
      throw new Error("This email is already in use by another user.");
    }
    updateData.email = input.email.toLowerCase();
  }

  if (input.password) {
    updateData.password = await hashPassword(input.password);
  }

  if (Object.keys(updateData).length === 0) {
    return { email: existing.email, message: "No changes made." };
  }

  console.log("Updating user with:", { userId: employee.user.id, updateData });

  await prisma.user.update({
    where: { id: employee.user.id },
    data: updateData,
  });

  await createAuditLog({
    companyId,
    userId,
    action: "UPDATE",
    entityType: "UserCredentials",
    entityId: employee.user.id,
    oldValues: { email: existing.email },
    newValues: { email: updateData.email || existing.email, passwordChanged: !!updateData.password },
  });

  return { email: updateData.email || existing.email, message: "Credentials updated successfully." };
}
