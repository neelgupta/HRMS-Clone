import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  BankDetailInput,
  CompanyAddressInput,
  CompanyBranchInput,
  CompanyDetailsInput,
  CompanySetupInput,
  EmployeeCustomFieldInput,
  GeneralSettingInput,
} from "@/lib/validations/company";
import { getDefaultCompanySetupValues } from "@/lib/company-defaults";

const companyInclude = {
  addresses: {
    orderBy: [{ type: "asc" }, { createdAt: "asc" }],
  },
  branches: {
    orderBy: { createdAt: "asc" },
  },
  bankDetail: true,
  generalSetting: true,
  employeeCustomFields: {
    orderBy: { sortOrder: "asc" },
  },
} satisfies Prisma.CompanyInclude;

export type CompanyRecord = Prisma.CompanyGetPayload<{
  include: typeof companyInclude;
}>;

function toDate(value?: string) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function toDateString(value?: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

function toOptionalString(value?: string) {
  return value?.trim() ? value.trim() : null;
}

function mapCompanyDetails(input: CompanyDetailsInput) {
  return {
    name: input.companyName.trim(),
    logoUrl: toOptionalString(input.logoUrl),
    iconUrl: toOptionalString(input.iconUrl),
    industry: input.industry,
    registrationNumber: toOptionalString(input.registrationNumber),
    panNumber: toOptionalString(input.panNumber),
    tanNumber: toOptionalString(input.tanNumber),
    gstNumber: toOptionalString(input.gstNumber),
    startDate: toDate(input.companyStartDate),
    fiscalYearStart: toDate(input.fiscalYearStart),
    fiscalYearEnd: toDate(input.fiscalYearEnd),
    primaryEmail: toOptionalString(input.primaryEmail),
    primaryPhone: toOptionalString(input.primaryPhone),
    website: toOptionalString(input.website),
  };
}

export async function getCompanyById(companyId: string) {
  return prisma.company.findUnique({
    where: { id: companyId },
    include: companyInclude,
  });
}

export function serializeCompany(company: CompanyRecord | null) {
  if (!company) {
    return null;
  }

  const defaults = getDefaultCompanySetupValues(company.name);

  return {
    id: company.id,
    setupCompleted: company.setupCompleted,
    status: company.status,
    values: {
      ...defaults,
      companyName: company.name,
      logoUrl: company.logoUrl ?? "",
      iconUrl: company.iconUrl ?? "",
      industry: company.industry ?? defaults.industry,
      registrationNumber: company.registrationNumber ?? "",
      panNumber: company.panNumber ?? "",
      tanNumber: company.tanNumber ?? "",
      gstNumber: company.gstNumber ?? "",
      companyStartDate: toDateString(company.startDate),
      fiscalYearStart: toDateString(company.fiscalYearStart),
      fiscalYearEnd: toDateString(company.fiscalYearEnd),
      primaryEmail: company.primaryEmail ?? "",
      primaryPhone: company.primaryPhone ?? "",
      website: company.website ?? "",
      addresses:
        company.addresses.length > 0
          ? company.addresses.map((address) => ({
              type: address.type,
              label: address.label ?? "",
              addressLine1: address.addressLine1,
              addressLine2: address.addressLine2 ?? "",
              city: address.city,
              state: address.state,
              country: address.country,
              pincode: address.pincode,
            }))
          : defaults.addresses,
      branches: company.branches.map((branch) => ({
        id: branch.id,
        name: branch.name,
        contactEmail: branch.contactEmail ?? "",
        contactPhone: branch.contactPhone ?? "",
        addressLine1: branch.addressLine1,
        addressLine2: branch.addressLine2 ?? "",
        city: branch.city,
        state: branch.state,
        country: branch.country,
        pincode: branch.pincode,
      })),
      bankDetail: company.bankDetail
        ? {
            bankName: company.bankDetail.bankName,
            accountHolderName: company.bankDetail.accountHolderName,
            accountNumber: company.bankDetail.accountNumber,
            ifscCode: company.bankDetail.ifscCode,
            branchName: company.bankDetail.branchName,
          }
        : defaults.bankDetail,
      generalSetting: company.generalSetting
        ? {
            currency: company.generalSetting.currency,
            dateFormat: company.generalSetting.dateFormat,
            timeZone: company.generalSetting.timeZone,
            workweek: company.generalSetting.workweek,
            holidayList: company.generalSetting.holidayList.map(toDateString).filter(Boolean),
            emailNotifications: company.generalSetting.emailNotifications,
          }
        : defaults.generalSetting,
      employeeCustomFields: company.employeeCustomFields.map((field) => ({
        fieldName: field.fieldName,
        fieldType: field.fieldType,
        required: field.required,
        options: field.options,
      })),
      markSetupComplete: company.setupCompleted,
    },
  };
}

export async function upsertCompanyDetails(companyId: string, input: CompanyDetailsInput) {
  const details = mapCompanyDetails(input);

  await prisma.company.upsert({
    where: { id: companyId },
    update: {
      ...details,
      setupCompleted: input.markSetupComplete,
      status: input.markSetupComplete ? "ACTIVE" : "PENDING",
    },
    create: {
      id: companyId,
      ...details,
      setupCompleted: input.markSetupComplete,
      status: input.markSetupComplete ? "ACTIVE" : "PENDING",
    },
  });
}

export async function replaceCompanyAddresses(companyId: string, addresses: CompanyAddressInput[]) {
  await prisma.$transaction([
    prisma.companyAddress.deleteMany({
      where: { companyId },
    }),
    ...(addresses.length > 0
      ? [
          prisma.companyAddress.createMany({
            data: addresses.map((address) => ({
              companyId,
              type: address.type,
              label: toOptionalString(address.label),
              addressLine1: address.addressLine1.trim(),
              addressLine2: toOptionalString(address.addressLine2),
              city: address.city.trim(),
              state: address.state.trim(),
              country: address.country.trim(),
              pincode: address.pincode.trim(),
            })),
          }),
        ]
      : []),
  ]);
}

export async function replaceCompanyBranches(companyId: string, branches: CompanyBranchInput[]) {
  await prisma.$transaction([
    prisma.branch.deleteMany({
      where: { companyId },
    }),
    ...(branches.length > 0
      ? [
          prisma.branch.createMany({
            data: branches.map((branch) => ({
              companyId,
              name: branch.name.trim(),
              contactEmail: toOptionalString(branch.contactEmail),
              contactPhone: toOptionalString(branch.contactPhone),
              addressLine1: branch.addressLine1.trim(),
              addressLine2: toOptionalString(branch.addressLine2),
              city: branch.city.trim(),
              state: branch.state.trim(),
              country: branch.country.trim(),
              pincode: branch.pincode.trim(),
            })),
          }),
        ]
      : []),
  ]);
}

export async function upsertCompanyBankDetail(companyId: string, input: BankDetailInput) {
  await prisma.bankDetail.upsert({
    where: { companyId },
    update: {
      bankName: input.bankName.trim(),
      accountHolderName: input.accountHolderName.trim(),
      accountNumber: input.accountNumber.trim(),
      ifscCode: input.ifscCode.trim().toUpperCase(),
      branchName: input.branchName.trim(),
    },
    create: {
      companyId,
      bankName: input.bankName.trim(),
      accountHolderName: input.accountHolderName.trim(),
      accountNumber: input.accountNumber.trim(),
      ifscCode: input.ifscCode.trim().toUpperCase(),
      branchName: input.branchName.trim(),
    },
  });
}

export async function upsertCompanyGeneralSettings(companyId: string, input: GeneralSettingInput) {
  await prisma.generalSetting.upsert({
    where: { companyId },
    update: {
      currency: input.currency,
      dateFormat: input.dateFormat,
      timeZone: input.timeZone,
      workweek: input.workweek,
      holidayList: input.holidayList.map((value) => new Date(`${value}T00:00:00.000Z`)),
      emailNotifications: input.emailNotifications,
    },
    create: {
      companyId,
      currency: input.currency,
      dateFormat: input.dateFormat,
      timeZone: input.timeZone,
      workweek: input.workweek,
      holidayList: input.holidayList.map((value) => new Date(`${value}T00:00:00.000Z`)),
      emailNotifications: input.emailNotifications,
    },
  });
}

export async function replaceEmployeeCustomFields(companyId: string, fields: EmployeeCustomFieldInput[]) {
  await prisma.$transaction([
    prisma.employeeCustomField.deleteMany({
      where: { companyId },
    }),
    ...(fields.length > 0
      ? [
          prisma.employeeCustomField.createMany({
            data: fields.map((field, index) => ({
              companyId,
              fieldName: field.fieldName.trim(),
              fieldType: field.fieldType,
              required: field.required,
              options: field.options.map((option) => option.trim()),
              sortOrder: index,
            })),
          }),
        ]
      : []),
  ]);
}

export async function saveCompanySetup(companyId: string, input: CompanySetupInput) {
  await upsertCompanyDetails(companyId, input);
  await replaceCompanyAddresses(companyId, input.addresses);
  await replaceCompanyBranches(companyId, input.branches);
  await upsertCompanyBankDetail(companyId, input.bankDetail);
  await upsertCompanyGeneralSettings(companyId, input.generalSetting);
  await replaceEmployeeCustomFields(companyId, input.employeeCustomFields);

  return getCompanyById(companyId);
}
