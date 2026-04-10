import { z } from "zod";

const INDUSTRIES = [
  "Information Technology",
  "Manufacturing",
  "Healthcare",
  "Education",
  "Finance",
  "Retail",
  "Consulting",
  "Logistics",
  "Real Estate",
  "Hospitality",
] as const;

const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"] as const;
const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD"] as const;
const TIME_ZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Europe/London",
  "America/New_York",
  "Asia/Singapore",
] as const;

const optionalTrimmedString = z
  .string()
  .trim()
  .max(255)
  .optional()
  .transform((val) => (val === "" ? undefined : val));

const dateStringSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format.")
  .optional()
  .transform((val) => (val === "" ? undefined : val));

const dateStringSchemaNoFuture = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format.")
  .refine((val) => {
    if (!val) return true;
    return new Date(val) <= new Date(new Date().toDateString());
  }, "Date cannot be in the future.")
  .optional()
  .transform((val) => (val === "" ? undefined : val));

const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .refine((val) => !val || !val.includes(" "), "Email must not contain spaces.")
  .optional()
  .transform((val) => (val === "" ? undefined : val));

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{10,15}$/, "Enter 10-15 digits.")
  .optional()
  .transform((val) => (val === "" ? undefined : val));

const websiteSchema = z
  .string()
  .trim()
  .refine(
    (val) => val === "" || /^https?:\/\/.+/i.test(val),
    "Website must start with http:// or https://",
  )
  .optional()
  .transform((val) => (val === "" ? undefined : val));

const panNumberSchema = z
  .string()
  .trim()
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Enter valid PAN (e.g., ABCDE1234F).")
  .optional()
  .transform((val) => (val === "" ? undefined : val));

const tanNumberSchema = z
  .string()
  .trim()
  .regex(/^[A-Z]{4}[0-9]{5}[A-Z]{1}$/, "Enter valid TAN (e.g., BLRA12345B).")
  .optional()
  .transform((val) => (val === "" ? undefined : val));

const gstNumberSchema = z
  .string()
  .trim()
  .regex(
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    "Enter valid GST number (e.g., 29ABCDE1234F1Z5).",
  )
  .optional()
  .transform((val) => (val === "" ? undefined : val));

export const addressSchema = z.object({
  type: z.enum(["HEAD_OFFICE", "BRANCH"]),
  label: optionalTrimmedString,
  addressLine1: z.string().trim().min(2, "Address line 1 is required."),
  addressLine2: optionalTrimmedString,
  city: z.string().trim().min(2, "City is required."),
  state: z.string().trim().min(2, "State is required."),
  country: z.string().trim().min(2, "Country is required."),
  pincode: z
    .string()
    .trim()
    .regex(/^[0-9]{6}$/, "Enter 6-digit pincode.")
    .min(6, "Pincode is required."),
});

export const branchSchema = z.object({
  name: z.string().trim().min(2, "Branch name is required."),
  contactEmail: emailSchema,
  contactPhone: phoneSchema,
  addressLine1: z.string().trim().min(2, "Address line 1 is required."),
  addressLine2: optionalTrimmedString,
  city: z.string().trim().min(2, "City is required."),
  state: z.string().trim().min(2, "State is required."),
  country: z.string().trim().min(2, "Country is required."),
  pincode: z
    .string()
    .trim()
    .regex(/^[0-9]+$/, "Enter valid pincode (digits only).")
    .min(4, "Pincode is required."),
});

export const bankDetailSchema = z.object({
  bankName: z.string().trim().min(2, "Bank name is required."),
  accountHolderName: z
    .string()
    .trim()
    .min(2, "Account holder name is required."),
  accountNumber: z.string().trim().min(6, "Account number is required."),
  ifscCode: z.string().trim().min(4, "IFSC code is required."),
  branchName: z.string().trim().min(2, "Branch name is required."),
});

export const generalSettingSchema = z.object({
  currency: z.enum(CURRENCIES),
  dateFormat: z.enum(DATE_FORMATS),
  timeZone: z.enum(TIME_ZONES),
  workweek: z.enum(["MON_FRI", "MON_SAT"]),
  holidayList: z.array(
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format."),
  ),
  emailNotifications: z.boolean(),
});

export const employeeCustomFieldSchema = z
  .object({
    fieldName: z.string().trim().min(2, "Field name is required."),
    fieldType: z.enum(["TEXT", "NUMBER", "DATE", "DROPDOWN", "CHECKBOX"]),
    required: z.boolean(),
    options: z
      .array(z.string().trim().min(1, "Option cannot be empty."))
      .default([]),
  })
  .superRefine((value, context) => {
    if (value.fieldType === "DROPDOWN" && value.options.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add at least one option for dropdown fields.",
        path: ["options"],
      });
    }
  });

export const companySetupSchema = z.object({
  companyName: z.string().trim().min(2, "Company name is required."),
  logoUrl: z.string().trim().max(255).default(""),
  iconUrl: z.string().trim().max(255).default(""),
  industry: z.enum(INDUSTRIES),
  registrationNumber: optionalTrimmedString,
  panNumber: panNumberSchema,
  tanNumber: tanNumberSchema,
  gstNumber: gstNumberSchema,
  companyStartDate: dateStringSchemaNoFuture,
  fiscalYearStart: dateStringSchema,
  fiscalYearEnd: dateStringSchema,
  primaryEmail: emailSchema,
  primaryPhone: phoneSchema,
  website: websiteSchema,
  addresses: z.array(addressSchema).min(1, "Add at least one address."),
  branches: z.array(branchSchema).default([]),
  bankDetail: bankDetailSchema,
  generalSetting: generalSettingSchema,
  employeeCustomFields: z.array(employeeCustomFieldSchema).default([]),
  markSetupComplete: z.boolean().default(false),
});

export const companyDetailsSchema = companySetupSchema.pick({
  companyName: true,
  logoUrl: true,
  iconUrl: true,
  industry: true,
  registrationNumber: true,
  panNumber: true,
  tanNumber: true,
  gstNumber: true,
  companyStartDate: true,
  fiscalYearStart: true,
  fiscalYearEnd: true,
  primaryEmail: true,
  primaryPhone: true,
  website: true,
  markSetupComplete: true,
});

export const companyAddressListSchema = z.object({
  addresses: z.array(addressSchema).min(1, "Add at least one address."),
});

export const companyBranchListSchema = z.object({
  branches: z.array(branchSchema),
});

export const companyBankSchema = z.object({
  bankDetail: bankDetailSchema,
});

export const companySettingPayloadSchema = z.object({
  generalSetting: generalSettingSchema,
});

export const companyCustomFieldPayloadSchema = z.object({
  employeeCustomFields: z.array(employeeCustomFieldSchema),
});

export type CompanySetupInput = z.infer<typeof companySetupSchema>;
export type CompanyDetailsInput = z.infer<typeof companyDetailsSchema>;
export type CompanyAddressInput = z.infer<typeof addressSchema>;
export type CompanyBranchInput = z.infer<typeof branchSchema>;
export type BankDetailInput = z.infer<typeof bankDetailSchema>;
export type GeneralSettingInput = z.infer<typeof generalSettingSchema>;
export type EmployeeCustomFieldInput = z.infer<
  typeof employeeCustomFieldSchema
>;

export const COMPANY_INDUSTRY_OPTIONS = [...INDUSTRIES];
export const COMPANY_DATE_FORMAT_OPTIONS = [...DATE_FORMATS];
export const COMPANY_CURRENCY_OPTIONS = [...CURRENCIES];
export const COMPANY_TIME_ZONE_OPTIONS = [...TIME_ZONES];
