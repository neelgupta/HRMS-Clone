"use client";

import { startTransition, useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
  companySetupSchema,
  type CompanySetupInput,
} from "@/lib/validations/company";
import {
  fetchCompanySetup,
  fetchCurrentUser,
  getDefaultCompanySetupValues,
  saveCompanySetup as saveCompanySetupRequest,
  type CurrentUser,
} from "@/lib/client/company";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
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

export function CompanySetupForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [companyExists, setCompanyExists] = useState(false);
  const [holidayInput, setHolidayInput] = useState("");

  const form = useForm<CompanySetupInput>({
    resolver: zodResolver(companySetupSchema) as any,
    defaultValues: getDefaultCompanySetupValues(),
  });

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = form;

  const addresses = useFieldArray({ control, name: "addresses" });
  const branches = useFieldArray({ control, name: "branches" });
  const customFields = useFieldArray({ control, name: "employeeCustomFields" });

  const holidayList = watch("generalSetting.holidayList");
  const watchedCustomFields = watch("employeeCustomFields");
  const values = watch();

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
          reset(companyData.company.values);
        } else {
          reset(getDefaultCompanySetupValues(userData.company?.name || ""));
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
  }, [reset, router]);

  async function submitForm(mode: "draft" | "complete") {
    await handleSubmit(async (rawValues) => {
      const payload = {
        ...rawValues,
        markSetupComplete: mode === "complete",
      };
      const toastId = showLoading(
        mode === "complete" ? "Saving company settings..." : "Saving draft...",
      );

      try {
        const data = await saveCompanySetupRequest(payload, companyExists);

        setCompanyExists(true);
        dismissToast(toastId);
        showSuccess(data.message || "Saved successfully.");
        if (data.company) {
          reset(data.company.values);
        }
        startTransition(() => router.refresh());
      } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized.") {
          dismissToast(toastId);
          router.push("/login");
          return;
        }

        dismissToast(toastId);
        showError(
          error instanceof Error
            ? error.message
            : "Could not save company settings.",
        );
      }
    })();
  }

  function addHoliday() {
    if (!holidayInput) {
      return;
    }

    if (holidayList.includes(holidayInput)) {
      setHolidayInput("");
      return;
    }

    setValue("generalSetting.holidayList", [...holidayList, holidayInput], {
      shouldValidate: true,
    });
    setHolidayInput("");
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
    // <DashboardLayout
    //   title="Company Setup"
    //   subtitle="Configure company details, branches, banking, and HR settings from one place."
    //   userName={user.name}
    //   userEmail={user.email}
    // >
    <>
      <div className="mb-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-indigo-600 dark:text-indigo-400">
              Company Settings
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">
              Configure {values.companyName || user.company?.name}
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
                  error={errors.companyName?.message}
                  required
                >
                  <TextInput
                    {...register("companyName")}
                    placeholder="WorkNest Technologies Pvt Ltd"
                  />
                </FormField>
                <FormField
                  label="Industry"
                  error={errors.industry?.message}
                  required
                >
                  <SelectInput {...register("industry")}>
                    {COMPANY_INDUSTRY_OPTIONS.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Controller
                  control={control}
                  name="logoUrl"
                  render={({ field }) => (
                    <UploadField
                      label="Company Logo"
                      value={field.value ?? ""}
                      onUploaded={(url) => field.onChange(url)}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="iconUrl"
                  render={({ field }) => (
                    <UploadField
                      label="Company Icon"
                      value={field.value ?? ""}
                      onUploaded={(url) => field.onChange(url)}
                    />
                  )}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <FormField
                  label="Registration Number"
                  error={errors.registrationNumber?.message}
                >
                  <TextInput
                    {...register("registrationNumber")}
                    placeholder="U74999KA2026PTC000123"
                  />
                </FormField>
                <FormField label="PAN Number" error={errors.panNumber?.message}>
                  <TextInput
                    {...register("panNumber")}
                    placeholder="ABCDE1234F"
                  />
                </FormField>
                <FormField label="TAN Number" error={errors.tanNumber?.message}>
                  <TextInput
                    {...register("tanNumber")}
                    placeholder="BLRA12345B"
                  />
                </FormField>
                <FormField label="GST Number" error={errors.gstNumber?.message}>
                  <TextInput
                    {...register("gstNumber")}
                    placeholder="29ABCDE1234F1Z5"
                  />
                </FormField>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                <FormField
                  label="Company Start Date"
                  error={errors.companyStartDate?.message}
                >
                  <TextInput type="date" {...register("companyStartDate")} />
                </FormField>
                <FormField
                  label="Fiscal Year Start"
                  error={errors.fiscalYearStart?.message}
                >
                  <TextInput type="date" {...register("fiscalYearStart")} />
                </FormField>
                <FormField
                  label="Fiscal Year End"
                  error={errors.fiscalYearEnd?.message}
                >
                  <TextInput type="date" {...register("fiscalYearEnd")} />
                </FormField>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <FormField
                  label="Primary Email"
                  error={errors.primaryEmail?.message}
                >
                  <TextInput
                    type="email"
                    {...register("primaryEmail")}
                    placeholder="hr@worknest.com"
                  />
                </FormField>
                <FormField
                  label="Primary Phone"
                  error={errors.primaryPhone?.message}
                >
                  <TextInput
                    {...register("primaryPhone")}
                    placeholder="+91 98765 43210"
                  />
                </FormField>
                <FormField label="Website" error={errors.website?.message}>
                  <TextInput
                    {...register("website")}
                    placeholder="https://worknest.com"
                  />
                </FormField>
              </div>
            </section>
          ) : null}

          {currentStep === 1 ? (
            <section className="space-y-5">
              {addresses.fields.map((field, index) => (
                <div
                  key={field.id}
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
                      error={errors.addresses?.[index]?.type?.message}
                      required
                    >
                      <SelectInput {...register(`addresses.${index}.type`)}>
                        <option value="HEAD_OFFICE">Head Office</option>
                        <option value="BRANCH">Branch</option>
                      </SelectInput>
                    </FormField>
                    <FormField
                      label="Label"
                      error={errors.addresses?.[index]?.label?.message}
                    >
                      <TextInput
                        {...register(`addresses.${index}.label`)}
                        placeholder="Corporate HQ"
                      />
                    </FormField>
                    <FormField
                      label="Address Line 1"
                      error={errors.addresses?.[index]?.addressLine1?.message}
                      required
                    >
                      <TextInput
                        {...register(`addresses.${index}.addressLine1`)}
                        placeholder="Building, street, area"
                      />
                    </FormField>
                    <FormField
                      label="Address Line 2"
                      error={errors.addresses?.[index]?.addressLine2?.message}
                    >
                      <TextInput
                        {...register(`addresses.${index}.addressLine2`)}
                        placeholder="Landmark or suite"
                      />
                    </FormField>
                    <FormField
                      label="City"
                      error={errors.addresses?.[index]?.city?.message}
                      required
                    >
                      <TextInput {...register(`addresses.${index}.city`)} />
                    </FormField>
                    <FormField
                      label="State"
                      error={errors.addresses?.[index]?.state?.message}
                      required
                    >
                      <TextInput {...register(`addresses.${index}.state`)} />
                    </FormField>
                    <FormField
                      label="Country"
                      error={errors.addresses?.[index]?.country?.message}
                      required
                    >
                      <TextInput {...register(`addresses.${index}.country`)} />
                    </FormField>
                    <FormField
                      label="Pincode"
                      error={errors.addresses?.[index]?.pincode?.message}
                      required
                    >
                      <TextInput {...register(`addresses.${index}.pincode`)} />
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

              {branches.fields.map((field, index) => (
                <div
                  key={field.id}
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
                      error={errors.branches?.[index]?.name?.message}
                      required
                    >
                      <TextInput
                        {...register(`branches.${index}.name`)}
                        placeholder="Bengaluru Branch"
                      />
                    </FormField>
                    <FormField
                      label="Contact Email"
                      error={errors.branches?.[index]?.contactEmail?.message}
                    >
                      <TextInput
                        type="email"
                        {...register(`branches.${index}.contactEmail`)}
                        placeholder="blr@company.com"
                      />
                    </FormField>
                    <FormField
                      label="Contact Phone"
                      error={errors.branches?.[index]?.contactPhone?.message}
                    >
                      <TextInput
                        {...register(`branches.${index}.contactPhone`)}
                        placeholder="+91 91234 56789"
                      />
                    </FormField>
                    <FormField
                      label="Address Line 1"
                      error={errors.branches?.[index]?.addressLine1?.message}
                      required
                    >
                      <TextInput
                        {...register(`branches.${index}.addressLine1`)}
                      />
                    </FormField>
                    <FormField
                      label="Address Line 2"
                      error={errors.branches?.[index]?.addressLine2?.message}
                    >
                      <TextInput
                        {...register(`branches.${index}.addressLine2`)}
                      />
                    </FormField>
                    <FormField
                      label="City"
                      error={errors.branches?.[index]?.city?.message}
                      required
                    >
                      <TextInput {...register(`branches.${index}.city`)} />
                    </FormField>
                    <FormField
                      label="State"
                      error={errors.branches?.[index]?.state?.message}
                      required
                    >
                      <TextInput {...register(`branches.${index}.state`)} />
                    </FormField>
                    <FormField
                      label="Country"
                      error={errors.branches?.[index]?.country?.message}
                      required
                    >
                      <TextInput {...register(`branches.${index}.country`)} />
                    </FormField>
                    <FormField
                      label="Pincode"
                      error={errors.branches?.[index]?.pincode?.message}
                      required
                    >
                      <TextInput {...register(`branches.${index}.pincode`)} />
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
                error={errors.bankDetail?.bankName?.message}
                required
              >
                <TextInput
                  {...register("bankDetail.bankName")}
                  placeholder="HDFC Bank"
                />
              </FormField>
              <FormField
                label="Account Holder Name"
                error={errors.bankDetail?.accountHolderName?.message}
                required
              >
                <TextInput
                  {...register("bankDetail.accountHolderName")}
                  placeholder="WorkNest Technologies Pvt Ltd"
                />
              </FormField>
              <FormField
                label="Account Number"
                error={errors.bankDetail?.accountNumber?.message}
                required
              >
                <TextInput
                  {...register("bankDetail.accountNumber")}
                  placeholder="50200012345678"
                />
              </FormField>
              <FormField
                label="IFSC Code"
                error={errors.bankDetail?.ifscCode?.message}
                required
              >
                <TextInput
                  {...register("bankDetail.ifscCode")}
                  placeholder="HDFC0000123"
                />
              </FormField>
              <FormField
                label="Branch Name"
                error={errors.bankDetail?.branchName?.message}
                required
              >
                <TextInput
                  {...register("bankDetail.branchName")}
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
                  error={errors.generalSetting?.currency?.message}
                  required
                >
                  <SelectInput {...register("generalSetting.currency")}>
                    {COMPANY_CURRENCY_OPTIONS.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
                <FormField
                  label="Date Format"
                  error={errors.generalSetting?.dateFormat?.message}
                  required
                >
                  <SelectInput {...register("generalSetting.dateFormat")}>
                    {COMPANY_DATE_FORMAT_OPTIONS.map((format) => (
                      <option key={format} value={format}>
                        {format}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
                <FormField
                  label="Time Zone"
                  error={errors.generalSetting?.timeZone?.message}
                  required
                >
                  <SelectInput {...register("generalSetting.timeZone")}>
                    {COMPANY_TIME_ZONE_OPTIONS.map((timeZone) => (
                      <option key={timeZone} value={timeZone}>
                        {timeZone}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
                <FormField
                  label="Workweek"
                  error={errors.generalSetting?.workweek?.message}
                  required
                >
                  <SelectInput {...register("generalSetting.workweek")}>
                    <option value="MON_FRI">Mon-Fri</option>
                    <option value="MON_SAT">Mon-Sat</option>
                  </SelectInput>
                </FormField>
              </div>

              <Controller
                control={control}
                name="generalSetting.emailNotifications"
                render={({ field }) => (
                  <ToggleField
                    checked={field.value}
                    onChange={field.onChange}
                    label="Email Notifications"
                    description="Keep company-wide HR alerts and workflow emails enabled."
                  />
                )}
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
                        setValue(
                          "generalSetting.holidayList",
                          holidayList.filter((item) => item !== holiday),
                          { shouldValidate: true },
                        )
                      }
                      className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400"
                    >
                      {holiday} ×
                    </button>
                  ))}
                </div>
                {errors.generalSetting?.holidayList?.message ? (
                  <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">
                    {errors.generalSetting.holidayList.message}
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
                    key={field.id}
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
                        error={
                          errors.employeeCustomFields?.[index]?.fieldName
                            ?.message
                        }
                        required
                      >
                        <TextInput
                          {...register(
                            `employeeCustomFields.${index}.fieldName`,
                          )}
                          placeholder="Blood Group"
                        />
                      </FormField>
                      <FormField
                        label="Field Type"
                        error={
                          errors.employeeCustomFields?.[index]?.fieldType
                            ?.message
                        }
                        required
                      >
                        <SelectInput
                          {...register(
                            `employeeCustomFields.${index}.fieldType`,
                          )}
                        >
                          <option value="TEXT">Text</option>
                          <option value="NUMBER">Number</option>
                          <option value="DATE">Date</option>
                          <option value="DROPDOWN">Dropdown</option>
                          <option value="CHECKBOX">Checkbox</option>
                        </SelectInput>
                      </FormField>
                      <Controller
                        control={control}
                        name={`employeeCustomFields.${index}.required`}
                        render={({ field: requiredField }) => (
                          <ToggleField
                            checked={requiredField.value}
                            onChange={requiredField.onChange}
                            label="Required Field"
                            description="Employees must fill this field."
                          />
                        )}
                      />
                    </div>

                    {fieldType === "DROPDOWN" ? (
                      <Controller
                        control={control}
                        name={`employeeCustomFields.${index}.options`}
                        render={({ field: optionsField }) => (
                          <FormField
                            label="Dropdown Options"
                            hint="Enter one option per line."
                            error={
                              errors.employeeCustomFields?.[index]?.options
                                ?.message as string | undefined
                            }
                          >
                            <textarea
                              value={optionsField.value.join("\n")}
                              onChange={(event) =>
                                optionsField.onChange(
                                  event.target.value
                                    .split("\n")
                                    .map((item) => item.trim())
                                    .filter(Boolean),
                                )
                              }
                              rows={4}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:bg-slate-700 dark:focus:ring-blue-900"
                            />
                          </FormField>
                        )}
                      />
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
    // </DashboardLayout>
  );
}
