"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as Yup from "yup";
import {
  MdAdd,
  MdArrowBack,
  MdArrowForward,
  MdCheckCircle,
} from "react-icons/md";
import {
  COMPANY_CURRENCY_OPTIONS,
  COMPANY_DATE_FORMAT_OPTIONS,
  COMPANY_INDUSTRY_OPTIONS,
  COMPANY_TIME_ZONE_OPTIONS,
  type CompanySetupInput,
  type CompanyAddressInput,
  type CompanyBranchInput,
  type EmployeeCustomFieldInput,
} from "@/lib/validations/company";
import { getDefaultCompanySetupValues } from "@/lib/company-defaults";
import {
  fetchCompanySetup,
  fetchCurrentUser,
  saveCompanySetup as saveCompanySetupRequest,
  type CurrentUser,
} from "@/lib/client/company";
import { Skeleton } from "@/components/ui/loaders/skeleton";
import { Spinner } from "@/components/ui/loaders/spinner";
import { FormField } from "@/components/ui/form-field";
import { SelectInput } from "@/components/ui/select-input";
import { TextInput } from "@/components/ui/text-input";
import { ToggleField } from "@/components/ui/toggle-field";
import { UploadField } from "@/components/company-setup/upload-field";
import { dismissToast, showError, showLoading, showSuccess } from "@/lib/toast";

const steps = [
  "Company Info",
  "Addresses",
  "Branches",
  "Bank Details",
  "Settings",
  "Custom Fields",
] as const;

const addressSchema = Yup.object().shape({
  type: Yup.string().oneOf(["HEAD_OFFICE", "BRANCH"]).required(),
  label: Yup.string().max(255),
  addressLine1: Yup.string().min(2, "Address line 1 is required.").required(),
  addressLine2: Yup.string().max(255),
  city: Yup.string().min(2, "City is required.").required(),
  state: Yup.string().min(2, "State is required.").required(),
  country: Yup.string().min(2, "Country is required.").required(),
  pincode: Yup.string().min(4, "Pincode is required.").required(),
});

const branchSchema = Yup.object().shape({
  name: Yup.string().min(2, "Branch name is required.").required(),
  contactEmail: Yup.string().email("Enter a valid email address."),
  contactPhone: Yup.string().max(255),
  addressLine1: Yup.string().min(2, "Address line 1 is required.").required(),
  addressLine2: Yup.string().max(255),
  city: Yup.string().min(2, "City is required.").required(),
  state: Yup.string().min(2, "State is required.").required(),
  country: Yup.string().min(2, "Country is required.").required(),
  pincode: Yup.string().min(4, "Pincode is required.").required(),
});

const bankDetailSchema = Yup.object().shape({
  bankName: Yup.string().min(2, "Bank name is required.").required(),
  accountHolderName: Yup.string()
    .min(2, "Account holder name is required.")
    .required(),
  accountNumber: Yup.string()
    .min(6, "Account number is required.")
    .required(),
  ifscCode: Yup.string().min(4, "IFSC code is required.").required(),
  branchName: Yup.string().min(2, "Branch name is required.").required(),
});

const employeeCustomFieldSchema = Yup.object().shape({
  fieldName: Yup.string().min(2, "Field name is required.").required(),
  fieldType: Yup.string()
    .oneOf(["TEXT", "NUMBER", "DATE", "DROPDOWN", "CHECKBOX"])
    .required(),
  required: Yup.boolean(),
  options: Yup.array().of(Yup.string().required()),
});

const generalSettingSchema = Yup.object().shape({
  currency: Yup.string()
    .oneOf(["INR", "USD", "EUR", "GBP", "AED", "SGD"])
    .required(),
  dateFormat: Yup.string()
    .oneOf(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"])
    .required(),
  timeZone: Yup.string()
    .oneOf([
      "Asia/Kolkata",
      "Asia/Dubai",
      "Europe/London",
      "America/New_York",
      "Asia/Singapore",
    ])
    .required(),
  workweek: Yup.string().oneOf(["MON_FRI", "MON_SAT"]).required(),
  holidayList: Yup.array().of(
    Yup.string().matches(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format."),
  ),
  emailNotifications: Yup.boolean().required(),
});

const validationSchema = Yup.object().shape({
  companyName: Yup.string().min(2, "Company name is required.").required(),
  logoUrl: Yup.string().max(255).default(""),
  iconUrl: Yup.string().max(255).default(""),
  industry: Yup.string()
    .oneOf([
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
    ])
    .required(),
  registrationNumber: Yup.string().max(255),
  panNumber: Yup.string().max(255),
  tanNumber: Yup.string().max(255),
  gstNumber: Yup.string().max(255),
  companyStartDate: Yup.string().matches(
    /^\d{4}-\d{2}-\d{2}$/,
    "Use YYYY-MM-DD format.",
  ),
  fiscalYearStart: Yup.string().matches(
    /^\d{4}-\d{2}-\d{2}$/,
    "Use YYYY-MM-DD format.",
  ),
  fiscalYearEnd: Yup.string().matches(
    /^\d{4}-\d{2}-\d{2}$/,
    "Use YYYY-MM-DD format.",
  ),
  primaryEmail: Yup.string().email("Enter a valid email address."),
  primaryPhone: Yup.string().max(255),
  website: Yup.string().matches(/^https?:\/\/.+/i, "Must start with http:// or https://"),
  addresses: Yup.array().of(addressSchema).min(1, "Add at least one address."),
  branches: Yup.array().of(branchSchema).default([]),
  bankDetail: bankDetailSchema,
  generalSetting: generalSettingSchema,
  employeeCustomFields: Yup.array().of(employeeCustomFieldSchema).default([]),
});

export function CompanySetupForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [companyExists, setCompanyExists] = useState(false);
  const [holidayInput, setHolidayInput] = useState("");

  const [formValues, setFormValues] = useState<CompanySetupInput>(() =>
    getDefaultCompanySetupValues(),
  );

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formik = {
    values: formValues,
    errors: formErrors,
    touched,
    isSubmitting,
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormValues((prev) => ({ ...prev, [name]: value }));
      setTouched((prev) => ({ ...prev, [name]: true }));
    },
    handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setTouched((prev) => ({ ...prev, [e.target.name]: true }));
    },
    setFieldValue: (name: string, value: unknown) => {
      setFormValues((prev) => ({ ...prev, [name]: value }));
    },
    setFieldTouched: (name: string, isTouched: boolean = true) => {
      setTouched((prev) => ({ ...prev, [name]: isTouched }));
    },
    resetForm: (values?: CompanySetupInput) => {
      if (values) {
        setFormValues(values);
      } else {
        setFormValues(getDefaultCompanySetupValues());
      }
      setFormErrors({});
      setTouched({});
    },
    validateForm: async () => {
      try {
        await validationSchema.validate(formValues, { abortEarly: false });
        setFormErrors({});
        return {};
      } catch (err) {
        if (err instanceof Yup.ValidationError) {
          const errors: Record<string, string> = {};
          err.inner.forEach((e) => {
            if (e.path) {
              errors[e.path] = e.message;
            }
          });
          setFormErrors(errors);
          return errors;
        }
        return {};
      }
    },
    submitForm: async () => {
      const errors = await formik.validateForm();
      if (Object.keys(errors).length === 0) {
        return formValues;
      }
      return null;
    },
  };

  const handleArrayFieldChange = (
    index: number,
    field: "addresses" | "branches" | "employeeCustomFields",
    prop: string,
    value: unknown,
  ) => {
    const path = `${field}.${index}.${prop}`;
    setFormValues((prev) => {
      const currentArray = prev[field];
      if (!Array.isArray(currentArray)) return prev;
      const updated = [...currentArray];
      updated[index] = { ...updated[index], [prop]: value };
      return { ...prev, [field]: updated as never };
    });
    setTouched((prev) => ({ ...prev, [path]: true }));
  };

  const addresses = {
    fields: formValues.addresses as CompanyAddressInput[],
    append: (value: CompanyAddressInput) => {
      setFormValues((prev) => ({
        ...prev,
        addresses: [...prev.addresses, value],
      }));
    },
    remove: (index: number) => {
      setFormValues((prev) => ({
        ...prev,
        addresses: prev.addresses.filter((_, i) => i !== index),
      }));
    },
  };

  const branches = {
    fields: formValues.branches as CompanyBranchInput[],
    append: (value: CompanyBranchInput) => {
      setFormValues((prev) => ({
        ...prev,
        branches: [...prev.branches, value],
      }));
    },
    remove: (index: number) => {
      setFormValues((prev) => ({
        ...prev,
        branches: prev.branches.filter((_, i) => i !== index),
      }));
    },
  };

  const customFields = {
    fields: formValues.employeeCustomFields as EmployeeCustomFieldInput[],
    append: (value: EmployeeCustomFieldInput) => {
      setFormValues((prev) => ({
        ...prev,
        employeeCustomFields: [...prev.employeeCustomFields, value],
      }));
    },
    remove: (index: number) => {
      setFormValues((prev) => ({
        ...prev,
        employeeCustomFields: prev.employeeCustomFields.filter(
          (_, i) => i !== index,
        ),
      }));
    },
  };

  const holidayList = formValues.generalSetting.holidayList;
  const watchedCustomFields = formValues.employeeCustomFields;

  useEffect(() => {
    async function load() {
      try {
        const [userData, companyData] = await Promise.all([
          fetchCurrentUser(),
          fetchCompanySetup(),
        ]);
        setUser(userData);
        if (companyData.company) {
          setCompanyExists(true);
          setFormValues(companyData.company.values);
        } else {
          setFormValues(getDefaultCompanySetupValues(userData.company?.name || ""));
        }
      } catch {
        const message = "Could not load company setup.";
        setPageError(message);
        showError(message);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  async function submitForm(mode: "draft" | "complete") {
    setIsSubmitting(true);
    try {
      const rawValues = await formik.submitForm();
      if (!rawValues) {
        setIsSubmitting(false);
        return;
      }

      const payload = {
        ...rawValues,
        markSetupComplete: mode === "complete",
      };
      const toastId = showLoading(
        mode === "complete" ? "Saving company settings..." : "Saving draft...",
      );

      const data = await saveCompanySetupRequest(payload, companyExists);

      setCompanyExists(true);
      dismissToast(toastId);
      showSuccess(data.message || "Saved successfully.");
      if (data.company) {
        setFormValues(data.company.values);
      }
      startTransition(() => router.refresh());
    } catch (error) {
      if (error instanceof Error && error.message === "Unauthorized.") {
        router.push("/login");
        return;
      }

      showError(
        error instanceof Error
          ? error.message
          : "Could not save company settings.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function addHoliday() {
    if (!holidayInput) {
      return;
    }

    if (holidayList.includes(holidayInput)) {
      setHolidayInput("");
      return;
    }

    setFormValues((prev) => ({
      ...prev,
      generalSetting: {
        ...prev.generalSetting,
        holidayList: [...prev.generalSetting.holidayList, holidayInput],
      },
    }));
    setHolidayInput("");
  }

  function getError(path: string): string | undefined {
    const error = formErrors[path];
    const isTouched = touched[path];
    return isTouched ? error : undefined;
  }

  if (loading) {
    return (
      <div className="animate-[loaderFadeIn_220ms_ease-out] space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/10">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-4 h-10 w-2/3" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-4/5" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-lg shadow-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/10">
            <div className="space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          </aside>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/10">
            <div className="grid gap-6 md:grid-cols-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-400">
        {pageError || "Unauthorized"}
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-indigo-600 dark:text-indigo-400">
              Company Settings
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">
              Configure {formValues.companyName || user.company?.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">
              Build the core operating profile for your HR workspace. Save a
              draft anytime, or complete setup once the essentials are in place.
            </p>
          </div>
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700 dark:border-indigo-900/30 dark:bg-indigo-900/20 dark:text-indigo-400">
            <p className="font-medium">HR Admin: {user.name}</p>
            <p className="mt-1 text-indigo-500 dark:text-indigo-500">
              {companyExists
                ? "Existing company profile loaded"
                : "Starting a fresh company profile"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-lg shadow-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/10">
          <div className="space-y-2">
            {steps.map((step, index) => {
              const isActive = currentStep === index;
              const isComplete = index < currentStep;

              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => setCurrentStep(index)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                    isActive
                      ? "bg-indigo-50 text-slate-950 ring-1 ring-indigo-100 dark:bg-indigo-900/30 dark:text-white dark:ring-indigo-800"
                      : "bg-slate-50 text-slate-700 hover:bg-white dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                      isActive
                        ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white"
                        : isComplete
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {isComplete ? "✓" : index + 1}
                  </span>
                  <span className="font-medium">{step}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <form
          onSubmit={(event) => {
            event.preventDefault();
          }}
          className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/10"
        >
          {pageError ? (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-400">
              {pageError}
            </div>
          ) : null}

          {currentStep === 0 ? (
            <section className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  label="Company Name"
                  error={getError("companyName")}
                  required
                >
                  <TextInput
                    name="companyName"
                    value={formValues.companyName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="WorkNest Technologies Pvt Ltd"
                  />
                </FormField>
                <FormField
                  label="Industry"
                  error={getError("industry")}
                  required
                >
                  <SelectInput
                    name="industry"
                    value={formValues.industry}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  >
                    {COMPANY_INDUSTRY_OPTIONS.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <UploadField
                  label="Company Logo"
                  value={formValues.logoUrl ?? ""}
                  onUploaded={(url) => {
                    formik.setFieldValue("logoUrl", url);
                    formik.setFieldTouched("logoUrl", true);
                  }}
                />
                <UploadField
                  label="Company Icon"
                  value={formValues.iconUrl ?? ""}
                  onUploaded={(url) => {
                    formik.setFieldValue("iconUrl", url);
                    formik.setFieldTouched("iconUrl", true);
                  }}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <FormField
                  label="Registration Number"
                  error={getError("registrationNumber")}
                >
                  <TextInput
                    name="registrationNumber"
                    value={formValues.registrationNumber ?? ""}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="U74999KA2026PTC000123"
                  />
                </FormField>
                <FormField label="PAN Number" error={getError("panNumber")}>
                  <TextInput
                    name="panNumber"
                    value={formValues.panNumber ?? ""}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="ABCDE1234F"
                  />
                </FormField>
                <FormField label="TAN Number" error={getError("tanNumber")}>
                  <TextInput
                    name="tanNumber"
                    value={formValues.tanNumber ?? ""}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="BLRA12345B"
                  />
                </FormField>
                <FormField label="GST Number" error={getError("gstNumber")}>
                  <TextInput
                    name="gstNumber"
                    value={formValues.gstNumber ?? ""}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="29ABCDE1234F1Z5"
                  />
                </FormField>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                <FormField
                  label="Company Start Date"
                  error={getError("companyStartDate")}
                >
                  <TextInput
                    type="date"
                    name="companyStartDate"
                    value={formValues.companyStartDate ?? ""}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                </FormField>
                <FormField
                  label="Fiscal Year Start"
                  error={getError("fiscalYearStart")}
                >
                  <TextInput
                    type="date"
                    name="fiscalYearStart"
                    value={formValues.fiscalYearStart ?? ""}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                </FormField>
                <FormField
                  label="Fiscal Year End"
                  error={getError("fiscalYearEnd")}
                >
                  <TextInput
                    type="date"
                    name="fiscalYearEnd"
                    value={formValues.fiscalYearEnd ?? ""}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                </FormField>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <FormField
                  label="Primary Email"
                  error={getError("primaryEmail")}
                >
                  <TextInput
                    type="email"
                    name="primaryEmail"
                    value={formValues.primaryEmail ?? ""}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="hr@worknest.com"
                  />
                </FormField>
                <FormField
                  label="Primary Phone"
                  error={getError("primaryPhone")}
                >
                  <TextInput
                    name="primaryPhone"
                    value={formValues.primaryPhone ?? ""}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="+91 98765 43210"
                  />
                </FormField>
                <FormField label="Website" error={getError("website")}>
                  <TextInput
                    name="website"
                    value={formValues.website ?? ""}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="https://worknest.com"
                  />
                </FormField>
              </div>
            </section>
          ) : null}

          {currentStep === 1 ? (
            <section className="space-y-5">
              {addresses.fields.map((address, index) => (
                <div
                  key={index}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-700/50"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Address {index + 1}
                    </h2>
                    {addresses.fields.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => addresses.remove(index)}
                        className="text-sm text-rose-600 transition hover:text-rose-500 dark:text-rose-400"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <FormField
                      label="Address Type"
                      error={getError(`addresses.${index}.type`)}
                      required
                    >
                      <SelectInput
                        name={`addresses.${index}.type`}
                        value={address.type}
                        onChange={(e) =>
                          handleArrayFieldChange(index, "addresses", "type", e.target.value)
                        }
                        onBlur={formik.handleBlur}
                      >
                        <option value="HEAD_OFFICE">Head Office</option>
                        <option value="BRANCH">Branch</option>
                      </SelectInput>
                    </FormField>
                    <FormField
                      label="Label"
                      error={getError(`addresses.${index}.label`)}
                    >
                      <TextInput
                        name={`addresses.${index}.label`}
                        value={address.label ?? ""}
                        onChange={(e) =>
                          handleArrayFieldChange(index, "addresses", "type", e.target.value)
                        }
                        onBlur={formik.handleBlur}
                        placeholder="Corporate HQ"
                      />
                    </FormField>
                    <FormField
                      label="Address Line 1"
                      error={getError(`addresses.${index}.addressLine1`)}
                      required
                    >
                      <TextInput
                        name={`addresses.${index}.addressLine1`}
                        value={address.addressLine1 ?? ""}
                        onChange={(e) =>
                          handleArrayFieldChange(index, "addresses", "type", e.target.value)
                        }
                        onBlur={formik.handleBlur}
                        placeholder="Building, street, area"
                      />
                    </FormField>
                    <FormField
                      label="Address Line 2"
                      error={getError(`addresses.${index}.addressLine2`)}
                    >
                      <TextInput
                        name={`addresses.${index}.addressLine2`}
                        value={address.addressLine2 ?? ""}
                        onChange={(e) =>
                          handleArrayFieldChange(index, "addresses", "type", e.target.value)
                        }
                        onBlur={formik.handleBlur}
                        placeholder="Landmark or suite"
                      />
                    </FormField>
                    <FormField
                      label="City"
                      error={getError(`addresses.${index}.city`)}
                      required
                    >
                      <TextInput
                        name={`addresses.${index}.city`}
                        value={address.city ?? ""}
                        onChange={(e) =>
                          handleArrayFieldChange(index, "addresses", "type", e.target.value)
                        }
                        onBlur={formik.handleBlur}
                      />
                    </FormField>
                    <FormField
                      label="State"
                      error={getError(`addresses.${index}.state`)}
                      required
                    >
                      <TextInput
                        name={`addresses.${index}.state`}
                        value={address.state ?? ""}
                        onChange={(e) =>
                          handleArrayFieldChange(index, "addresses", "type", e.target.value)
                        }
                        onBlur={formik.handleBlur}
                      />
                    </FormField>
                    <FormField
                      label="Country"
                      error={getError(`addresses.${index}.country`)}
                      required
                    >
                      <TextInput
                        name={`addresses.${index}.country`}
                        value={address.country ?? ""}
                        onChange={(e) =>
                          handleArrayFieldChange(index, "addresses", "type", e.target.value)
                        }
                        onBlur={formik.handleBlur}
                      />
                    </FormField>
                    <FormField
                      label="Pincode"
                      error={getError(`addresses.${index}.pincode`)}
                      required
                    >
                      <TextInput
                        name={`addresses.${index}.pincode`}
                        value={address.pincode ?? ""}
                        onChange={(e) =>
                          handleArrayFieldChange(index, "addresses", "type", e.target.value)
                        }
                        onBlur={formik.handleBlur}
                      />
                    </FormField>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  addresses.append({
                    type: "BRANCH",
                    label: "",
                    addressLine1: "",
                    addressLine2: "",
                    city: "",
                    state: "",
                    country: "India",
                    pincode: "",
                  })
                }
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:text-blue-400"
              >
                <MdAdd className="text-base" />
                Add Address
              </button>
            </section>
          ) : null}

          {currentStep === 2 ? (
            <section className="space-y-5">
              {branches.fields.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-400">
                  No branches added yet. Add branches now or come back later.
                </div>
              ) : null}

              {branches.fields.map((branch, index) => (
                <div
                  key={index}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-700/50"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Branch {index + 1}
                    </h2>
                    <button
                      type="button"
                      onClick={() => branches.remove(index)}
                      className="text-sm text-rose-600 transition hover:text-rose-500 dark:text-rose-400"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <FormField
                      label="Branch Name"
                      error={getError(`branches.${index}.name`)}
                      required
                    >
                      <TextInput
                        name={`branches.${index}.name`}
                        value={branch.name ?? ""}
                        onChange={(e) =>
                          handleArrayFieldChange(index, "branches", "contactEmail", e.target.value)
                        }
                        onBlur={formik.handleBlur}
                        placeholder="Bengaluru Branch"
                      />
                    </FormField>
                    <FormField
                      label="Contact Email"
                      error={getError(`branches.${index}.contactEmail`)}
                    >
                      <TextInput
                        type="email"
                        name={`branches.${index}.contactEmail`}
                        value={branch.contactEmail ?? ""}
                        onChange={(e) =>
                          handleArrayFieldChange(index, "branches", "contactEmail", e.target.value)
                        }
                        onBlur={formik.handleBlur}
                        placeholder="blr@company.com"
                      />
                    </FormField>
                    <FormField
                      label="Contact Phone"
                      error={getError(`branches.${index}.contactPhone`)}
                    >
                      <TextInput
                        name={`branches.${index}.contactPhone`}
                        value={branch.contactPhone ?? ""}
                        onChange={(e) =>
                          handleArrayFieldChange(index, "branches", "contactEmail", e.target.value)
                        }
                        onBlur={formik.handleBlur}
                        placeholder="+91 91234 56789"
                      />
                    </FormField>
                    <FormField
                      label="Address Line 1"
                      error={getError(`branches.${index}.addressLine1`)}
                      required
                    >
                      <TextInput
                        name={`branches.${index}.addressLine1`}
                        value={branch.addressLine1 ?? ""}
                        onChange={(e) =>
                          handleArrayFieldChange(index, "branches", "contactEmail", e.target.value)
                        }
                        onBlur={formik.handleBlur}
                      />
                    </FormField>
                    <FormField
                      label="Address Line 2"
                      error={getError(`branches.${index}.addressLine2`)}
                    >
                      <TextInput
                        name={`branches.${index}.addressLine2`}
                        value={branch.addressLine2 ?? ""}
                        onChange={(e) =>
                          handleArrayFieldChange(index, "branches", "contactEmail", e.target.value)
                        }
                        onBlur={formik.handleBlur}
                      />
                    </FormField>
                    <FormField
                      label="City"
                      error={getError(`branches.${index}.city`)}
                      required
                    >
                      <TextInput
                        name={`branches.${index}.city`}
                        value={branch.city ?? ""}
                        onChange={(e) =>
                          handleArrayFieldChange(index, "branches", "contactEmail", e.target.value)
                        }
                        onBlur={formik.handleBlur}
                      />
                    </FormField>
                    <FormField
                      label="State"
                      error={getError(`branches.${index}.state`)}
                      required
                    >
                      <TextInput
                        name={`branches.${index}.state`}
                        value={branch.state ?? ""}
                        onChange={(e) =>
                          handleArrayFieldChange(index, "branches", "contactEmail", e.target.value)
                        }
                        onBlur={formik.handleBlur}
                      />
                    </FormField>
                    <FormField
                      label="Country"
                      error={getError(`branches.${index}.country`)}
                      required
                    >
                      <TextInput
                        name={`branches.${index}.country`}
                        value={branch.country ?? ""}
                        onChange={(e) =>
                          handleArrayFieldChange(index, "branches", "contactEmail", e.target.value)
                        }
                        onBlur={formik.handleBlur}
                      />
                    </FormField>
                    <FormField
                      label="Pincode"
                      error={getError(`branches.${index}.pincode`)}
                      required
                    >
                      <TextInput
                        name={`branches.${index}.pincode`}
                        value={branch.pincode ?? ""}
                        onChange={(e) =>
                          handleArrayFieldChange(index, "branches", "contactEmail", e.target.value)
                        }
                        onBlur={formik.handleBlur}
                      />
                    </FormField>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  branches.append({
                    name: "",
                    contactEmail: "",
                    contactPhone: "",
                    addressLine1: "",
                    addressLine2: "",
                    city: "",
                    state: "",
                    country: "India",
                    pincode: "",
                  })
                }
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:text-blue-400"
              >
                <MdAdd className="text-base" />
                Add Branch
              </button>
            </section>
          ) : null}

          {currentStep === 3 ? (
            <section className="grid gap-6 md:grid-cols-2">
              <FormField
                label="Bank Name"
                error={getError("bankDetail.bankName")}
                required
              >
                <TextInput
                  name="bankDetail.bankName"
                  value={formValues.bankDetail.bankName ?? ""}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="HDFC Bank"
                />
              </FormField>
              <FormField
                label="Account Holder Name"
                error={getError("bankDetail.accountHolderName")}
                required
              >
                <TextInput
                  name="bankDetail.accountHolderName"
                  value={formValues.bankDetail.accountHolderName ?? ""}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="WorkNest Technologies Pvt Ltd"
                />
              </FormField>
              <FormField
                label="Account Number"
                error={getError("bankDetail.accountNumber")}
                required
              >
                <TextInput
                  name="bankDetail.accountNumber"
                  value={formValues.bankDetail.accountNumber ?? ""}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="50200012345678"
                />
              </FormField>
              <FormField
                label="IFSC Code"
                error={getError("bankDetail.ifscCode")}
                required
              >
                <TextInput
                  name="bankDetail.ifscCode"
                  value={formValues.bankDetail.ifscCode ?? ""}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="HDFC0000123"
                />
              </FormField>
              <FormField
                label="Branch Name"
                error={getError("bankDetail.branchName")}
                required
              >
                <TextInput
                  name="bankDetail.branchName"
                  value={formValues.bankDetail.branchName ?? ""}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Koramangala"
                />
              </FormField>
            </section>
          ) : null}

          {currentStep === 4 ? (
            <section className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <FormField
                  label="Currency"
                  error={getError("generalSetting.currency")}
                  required
                >
                  <SelectInput
                    name="generalSetting.currency"
                    value={formValues.generalSetting.currency}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  >
                    {COMPANY_CURRENCY_OPTIONS.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
                <FormField
                  label="Date Format"
                  error={getError("generalSetting.dateFormat")}
                  required
                >
                  <SelectInput
                    name="generalSetting.dateFormat"
                    value={formValues.generalSetting.dateFormat}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  >
                    {COMPANY_DATE_FORMAT_OPTIONS.map((format) => (
                      <option key={format} value={format}>
                        {format}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
                <FormField
                  label="Time Zone"
                  error={getError("generalSetting.timeZone")}
                  required
                >
                  <SelectInput
                    name="generalSetting.timeZone"
                    value={formValues.generalSetting.timeZone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  >
                    {COMPANY_TIME_ZONE_OPTIONS.map((timeZone) => (
                      <option key={timeZone} value={timeZone}>
                        {timeZone}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
                <FormField
                  label="Workweek"
                  error={getError("generalSetting.workweek")}
                  required
                >
                  <SelectInput
                    name="generalSetting.workweek"
                    value={formValues.generalSetting.workweek}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  >
                    <option value="MON_FRI">Mon-Fri</option>
                    <option value="MON_SAT">Mon-Sat</option>
                  </SelectInput>
                </FormField>
              </div>

              <ToggleField
                checked={formValues.generalSetting.emailNotifications}
                onChange={(checked) => {
                  formik.setFieldValue("generalSetting.emailNotifications", checked);
                  formik.setFieldTouched("generalSetting.emailNotifications", true);
                }}
                label="Email Notifications"
                description="Keep company-wide HR alerts and workflow emails enabled."
              />

              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-700/50">
                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                  <div className="flex-1">
                    <FormField
                      label="Holiday List"
                      hint="Add one holiday date at a time."
                    >
                      <TextInput
                        type="date"
                        value={holidayInput}
                        onChange={(event) =>
                          setHolidayInput(event.target.value)
                        }
                      />
                    </FormField>
                  </div>
                  <button
                    type="button"
                    onClick={addHoliday}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:text-blue-400"
                  >
                    <MdAdd className="text-base" />
                    Add Holiday
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {holidayList.length === 0 ? (
                    <p className="text-sm text-slate-400 dark:text-slate-500">
                      No holidays added yet.
                    </p>
                  ) : null}
                  {holidayList.map((holiday) => (
                    <button
                      key={holiday}
                      type="button"
                      onClick={() =>
                        setFormValues((prev) => ({
                          ...prev,
                          generalSetting: {
                            ...prev.generalSetting,
                            holidayList: prev.generalSetting.holidayList.filter(
                              (item) => item !== holiday,
                            ),
                          },
                        }))
                      }
                      className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400"
                    >
                      {holiday} ×
                    </button>
                  ))}
                </div>
                {getError("generalSetting.holidayList") ? (
                  <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">
                    {getError("generalSetting.holidayList")}
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}

          {currentStep === 5 ? (
            <section className="space-y-5">
              {customFields.fields.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-400">
                  No employee custom fields yet. Add fields for IDs, probation
                  notes, equipment ownership, or any company-specific employee
                  metadata.
                </div>
              ) : null}

              {customFields.fields.map((field, index) => {
                const fieldType = watchedCustomFields?.[index]?.fieldType;

                return (
                  <div
                    key={index}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-700/50"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Field {index + 1}
                      </h2>
                      <button
                        type="button"
                        onClick={() => customFields.remove(index)}
                        className="text-sm text-rose-600 transition hover:text-rose-500 dark:text-rose-400"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-5 md:grid-cols-3">
                      <FormField
                        label="Field Name"
                        error={getError(`employeeCustomFields.${index}.fieldName`)}
                        required
                      >
                        <TextInput
                          name={`employeeCustomFields.${index}.fieldName`}
                          value={field.fieldName ?? ""}
                          onChange={(e) =>
                          handleArrayFieldChange(
                              index,
                              "employeeCustomFields",
                              "fieldType",
                              e.target.value,
                            )
                          }
                          onBlur={formik.handleBlur}
                          placeholder="Blood Group"
                        />
                      </FormField>
                      <FormField
                        label="Field Type"
                        error={getError(`employeeCustomFields.${index}.fieldType`)}
                        required
                      >
                        <SelectInput
                          name={`employeeCustomFields.${index}.fieldType`}
                          value={field.fieldType ?? "TEXT"}
                          onChange={(e) =>
                          handleArrayFieldChange(
                              index,
                              "employeeCustomFields",
                              "fieldType",
                              e.target.value,
                            )
                          }
                          onBlur={formik.handleBlur}
                        >
                          <option value="TEXT">Text</option>
                          <option value="NUMBER">Number</option>
                          <option value="DATE">Date</option>
                          <option value="DROPDOWN">Dropdown</option>
                          <option value="CHECKBOX">Checkbox</option>
                        </SelectInput>
                      </FormField>
                      <ToggleField
                        checked={field.required ?? false}
                        onChange={(checked) => {
                          setFormValues((prev) => {
                            const updated = [...prev.employeeCustomFields];
                            updated[index] = {
                              ...updated[index],
                              required: checked,
                            };
                            return { ...prev, employeeCustomFields: updated };
                          });
                          setTouched((prev) => ({
                            ...prev,
                            [`employeeCustomFields.${index}.required`]: true,
                          }));
                        }}
                        label="Required Field"
                        description="Employees must fill this field."
                      />
                    </div>

                    {fieldType === "DROPDOWN" ? (
                      <FormField
                        label="Dropdown Options"
                        hint="Enter one option per line."
                        error={getError(`employeeCustomFields.${index}.options`)}
                      >
                        <textarea
                          value={(field.options ?? []).join("\n")}
                          onChange={(event) => {
                            const newOptions = event.target.value
                              .split("\n")
                              .map((item) => item.trim())
                              .filter(Boolean);
                            setFormValues((prev) => {
                              const updated = [...prev.employeeCustomFields];
                              updated[index] = {
                                ...updated[index],
                                options: newOptions,
                              };
                              return { ...prev, employeeCustomFields: updated };
                            });
                            setTouched((prev) => ({
                              ...prev,
                              [`employeeCustomFields.${index}.options`]: true,
                            }));
                          }}
                          rows={4}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:bg-slate-700 dark:focus:ring-blue-900"
                        />
                      </FormField>
                    ) : null}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() =>
                  customFields.append({
                    fieldName: "",
                    fieldType: "TEXT",
                    required: false,
                    options: [],
                  })
                }
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:text-blue-400"
              >
                <MdAdd className="text-base" />
                Add Custom Field
              </button>
            </section>
          ) : null}

          <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-6 md:flex-row md:items-center md:justify-between dark:border-slate-700">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))}
                disabled={currentStep === 0}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                <MdArrowBack className="text-base" />
                Back
              </button>
              <button
                type="button"
                onClick={() =>
                  setCurrentStep((step) => Math.min(step + 1, steps.length - 1))
                }
                disabled={currentStep === steps.length - 1}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                <MdArrowForward className="text-base" />
                Next
              </button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void submitForm("draft")}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:text-blue-400"
              >
                {isSubmitting ? (
                  <Spinner className="text-current" label="Saving draft" />
                ) : (
                  <MdCheckCircle className="text-base" />
                )}
                {isSubmitting ? "Saving..." : "Save Draft"}
              </button>
              <button
                type="button"
                onClick={() => void submitForm("complete")}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-500 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Spinner className="text-white" label="Saving settings" />
                ) : (
                  <MdArrowForward className="text-base" />
                )}
                {isSubmitting
                  ? "Saving..."
                  : companyExists
                    ? "Update Settings"
                    : "Complete Setup"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}