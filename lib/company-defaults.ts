import type { CompanySetupInput } from "@/lib/validations/company";

export function getDefaultCompanySetupValues(companyName = ""): CompanySetupInput {
  return {
    companyName,
    logoUrl: "",
    iconUrl: "",
    industry: "Information Technology",
    registrationNumber: "",
    panNumber: "",
    tanNumber: "",
    gstNumber: "",
    companyStartDate: "",
    fiscalYearStart: "",
    fiscalYearEnd: "",
    primaryEmail: "",
    primaryPhone: "",
    website: "",
    addresses: [
      {
        type: "HEAD_OFFICE",
        label: "Head Office",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        country: "India",
        pincode: "",
      },
    ],
    branches: [],
    bankDetail: {
      bankName: "",
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
      branchName: "",
    },
    generalSetting: {
      currency: "INR",
      dateFormat: "DD/MM/YYYY",
      timeZone: "Asia/Kolkata",
      workweek: "MON_FRI",
      holidayList: [],
      emailNotifications: true,
    },
    employeeCustomFields: [],
    markSetupComplete: false,
  };
}
