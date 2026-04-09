import { z } from "zod";

export const genderEnum = z.enum(["MALE", "FEMALE", "OTHER"]);
export const maritalStatusEnum = z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]);
export const employmentTypeEnum = z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "PROBATION"]);
export const employmentStatusEnum = z.enum(["PROBATION", "CONFIRMED", "TERMINATED", "RESIGNED", "RETIRED"]);
export const documentTypeEnum = z.enum([
  "AADHAR_CARD",
  "PAN_CARD",
  "PASSPORT",
  "DRIVING_LICENSE",
  "VOTER_ID",
  "BANK_PASSBOOK",
  "EDUCATION_CERTIFICATE",
  "EXPERIENCE_LETTER",
  "OFFER_LETTER",
  "APPOINTMENT_LETTER",
  "SALARY_SLIP",
  "FORM_16",
  "PF_DOCUMENT",
  "ESI_DOCUMENT",
  "PHOTO",
  "SIGNATURE",
  "OTHER",
]);

export const educationSchema = z.object({
  id: z.string().optional(),
  degree: z.string().min(1, "Degree is required"),
  institution: z.string().min(1, "Institution is required"),
  yearOfPassing: z.number().int().positive().optional(),
  percentage: z.number().positive().max(100).optional(),
});

export const workHistorySchema = z.object({
  id: z.string().optional(),
  companyName: z.string().min(1, "Company name is required"),
  designation: z.string().min(1, "Designation is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().nullable(),
  isCurrent: z.boolean().default(false),
  reasonForLeaving: z.string().optional(),
});

export const createEmployeeSchema = z.object({
  branchId: z.string().optional().nullable(),

  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  photoUrl: z.string().optional().nullable(),

  dateOfBirth: z.string().optional().nullable(),
  gender: genderEnum.optional(),
  maritalStatus: maritalStatusEnum.optional(),
  bloodGroup: z.string().optional(),

  department: z.string().optional(),
  designation: z.string().optional(),
  reportingManagerId: z.string().optional().nullable(),
  dateOfJoining: z.string().optional().nullable(),
  dateOfLeaving: z.string().optional().nullable(),
  probationEndDate: z.string().optional().nullable(),
  employmentType: employmentTypeEnum.default("FULL_TIME"),
  employmentStatus: employmentStatusEnum.default("PROBATION"),

  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),

  presentAddressLine1: z.string().optional(),
  presentAddressLine2: z.string().optional(),
  presentCity: z.string().optional(),
  presentState: z.string().optional(),
  presentCountry: z.string().optional().default("India"),
  presentPincode: z.string().optional(),

  permanentAddressLine1: z.string().optional(),
  permanentAddressLine2: z.string().optional(),
  permanentCity: z.string().optional(),
  permanentState: z.string().optional(),
  permanentCountry: z.string().optional().default("India"),
  permanentPincode: z.string().optional(),

  bankAccountHolderName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankName: z.string().optional(),
  bankBranchName: z.string().optional(),
  bankIfscCode: z.string().optional(),

  panNumber: z.string().optional(),
  aadharNumber: z.string().optional(),

  pfNumber: z.string().optional(),
  pfUAN: z.string().optional(),
  esiNumber: z.string().optional(),

  companyEmail: z.string().email("Invalid email address").optional(),
  userEmail: z.string().email("Invalid email address").optional(),
  userPassword: z.string().min(6, "Password must be at least 6 characters").optional(),

  education: z.array(educationSchema).optional(),
  workHistory: z.array(workHistorySchema).optional(),

  customFieldValues: z.record(z.string(), z.string()).optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  id: z.string().min(1, "Employee ID is required"),
});

export const employeeSearchSchema = z.object({
  search: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  employmentType: employmentTypeEnum.optional(),
  employmentStatus: employmentStatusEnum.optional(),
  branchId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(1000).default(20),
});

export const documentUploadSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  type: documentTypeEnum,
  name: z.string().min(1, "Document name is required"),
  expiryDate: z.string().optional().nullable(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type EmployeeSearchInput = z.infer<typeof employeeSearchSchema>;
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;
export type EducationInput = z.infer<typeof educationSchema>;
export type WorkHistoryInput = z.infer<typeof workHistorySchema>;
