"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { 
  MdCalendarToday, 
  MdEventNote, 
  MdUpload, 
  MdInfo,
  MdWarning,
  MdCheckCircle
} from "react-icons/md";
import { HiOutlineClock, HiOutlineDocumentText } from "react-icons/hi";
import { 
  type LeaveTypeConfig, 
  type LeaveBalance, 
  type Holiday,
  leaveCategoryLabels,
  sessionTypeLabels,
  getLeaveTypes,
  getLeaveBalances,
  getHolidays,
  createLeaveApplication
} from "@/lib/client/leave";
import { 
  createLeaveApplicationFullSchema,
  type CreateLeaveApplicationInput 
} from "@/lib/validations/leave-full";
import { TextInput } from "@/components/ui/text-input";
import { SelectInputWithOptions } from "@/components/ui/select-input-with-options";
import { FormField } from "@/components/ui/form-field";
import { TextArea } from "@/components/ui/text-area";
import { ToggleField } from "@/components/ui/toggle-field";
import { FileUpload } from "@/components/ui/file-upload";
import { Modal } from "@/components/ui/modal";

interface LeaveApplicationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function LeaveApplicationForm({ onSuccess, onCancel }: LeaveApplicationFormProps) {
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeConfig[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<LeaveTypeConfig | null>(null);
  const [previewDays, setPreviewDays] = useState(0);
  const [previewBalance, setPreviewBalance] = useState<number | null>(null);
  const [showEndDate, setShowEndDate] = useState(false);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [startSession, setStartSession] = useState<"FIRST_HALF" | "SECOND_HALF">("FIRST_HALF");
  const [endSession, setEndSession] = useState<"FIRST_HALF" | "SECOND_HALF">("SECOND_HALF");

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    setError,
    clearErrors,
  } = useForm<CreateLeaveApplicationInput>({
    resolver: zodResolver(createLeaveApplicationFullSchema),
    defaultValues: {
      leaveTypeId: "",
      startDate: "",
      endDate: "",
      reason: "",
      isHalfDay: false,
    },
  });

  const watchedStartDate = watch("startDate");
  const watchedEndDate = watch("endDate");
  const watchedLeaveTypeId = watch("leaveTypeId");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (watchedLeaveTypeId) {
      const type = leaveTypes.find(lt => lt.id === watchedLeaveTypeId);
      setSelectedType(type || null);
      
      // Update form based on leave type rules
      if (type) {
        const balance = balances.find(b => b.leaveTypeId === type.id);
        if (balance) {
          setPreviewBalance(balance.availableDays);
        }
        
        // Show/hide end date based on single day logic
        if (!type.canApplyHalfDay) {
          setShowEndDate(true);
        }
      }
    }
  }, [watchedLeaveTypeId, leaveTypes, balances]);

  useEffect(() => {
    if (watchedStartDate && watchedEndDate) {
      const start = new Date(watchedStartDate);
      const end = new Date(watchedEndDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      setPreviewDays(days);
    } else if (watchedStartDate && !watchedEndDate && !isHalfDay) {
      setPreviewDays(1);
    } else if (isHalfDay) {
      setPreviewDays(0.5);
    } else {
      setPreviewDays(0);
    }
  }, [watchedStartDate, watchedEndDate, isHalfDay]);

  async function fetchData() {
    try {
      const [typesRes, balancesRes, holidaysRes] = await Promise.all([
        getLeaveTypes(),
        getLeaveBalances(),
        getHolidays(new Date().getFullYear()),
      ]);

      if (typesRes.data?.leaveTypes) {
        setLeaveTypes(typesRes.data.leaveTypes.filter(lt => lt.isActive));
      }
      if (balancesRes.data?.balances) {
        setBalances(balancesRes.data.balances);
      }
      if (holidaysRes.data?.holidays) {
        setHolidays(holidaysRes.data.holidays);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }

  function isHoliday(date: string): boolean {
    return holidays.some(h => h.date === date);
  }

  function isWeekend(date: string): boolean {
    const d = new Date(date);
    return d.getDay() === 0 || d.getDay() === 6;
  }

  function getMinDate(): string {
    const today = new Date();
    today.setDate(today.getDate() + (selectedType?.minNoticeDays || 0));
    return today.toISOString().split('T')[0];
  }

  async function onSubmit(data: CreateLeaveApplicationInput) {
    if (!selectedType) {
      toast.error("Please select a leave type");
      return;
    }

    const balance = balances.find(b => b.leaveTypeId === selectedType.id);
    if (balance && balance.availableDays < previewDays && balance.availableDays !== -1) {
      setError("endDate", { 
        message: `Insufficient balance. Available: ${balance.availableDays} days, Requested: ${previewDays} days` 
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await createLeaveApplication({
        leaveTypeId: data.leaveTypeId,
        startDate: data.startDate,
        endDate: data.endDate || data.startDate,
        reason: data.reason,
        isHalfDay: data.isHalfDay,
        startSession: data.isHalfDay ? startSession : undefined,
        endSession: data.isHalfDay ? endSession : undefined,
      });

      if ((result as any).application) {
        toast.success("Leave application submitted successfully!");
        onSuccess?.();
      } else {
        toast.error((result as any).error || "Failed to submit leave application");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit leave application");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Apply for Leave</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Submit your leave request with proper documentation
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Leave Type Selection */}
          <FormField label="Leave Type" error={errors.leaveTypeId?.message}>
            <Controller
              name="leaveTypeId"
              control={control}
              render={({ field }) => (
                <SelectInputWithOptions
                  {...field}
                  options={leaveTypes.map(lt => ({
                    value: lt.id,
                    label: (
                      <div className="flex items-center justify-between">
                        <span>{lt.name}</span>
                        <span className="text-xs text-slate-500">
                          {lt.canApplyHalfDay && "Half-day allowed"}
                        </span>
                      </div>
                    ),
                  }))}
                  onChange={(value) => {
                    field.onChange(value);
                    clearErrors("endDate");
                  }}
                />
              )}
            />
          </FormField>

          {selectedType && (
            <>
              {/* Leave Type Info */}
              <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <MdInfo className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      {selectedType.name}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-medium">Annual Days:</span> {selectedType.annualDays}
                      </div>
                      <div>
                        <span className="font-medium">Min Notice:</span> {selectedType.minNoticeDays} days
                      </div>
                      <div>
                        <span className="font-medium">Max Consecutive:</span> {selectedType.maxConsecutive || 'Unlimited'} days
                      </div>
                      <div>
                        <span className="font-medium">Carry Forward:</span> {selectedType.allowCarryForward ? 'Yes' : 'No'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leave Balance */}
              {previewBalance !== null && (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-4 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <HiOutlineClock className="text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                          Available Balance
                        </p>
                        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                          {previewBalance === -1 ? 'Unlimited' : previewBalance} days
                        </p>
                      </div>
                    </div>
                    {previewDays > 0 && previewBalance !== -1 && (
                      <div className="text-right">
                        <p className="text-sm text-emerald-700 dark:text-emerald-300">
                          After this request: {Math.max(0, previewBalance - previewDays)} days
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Half Day Toggle */}
              {selectedType.canApplyHalfDay && (
                <FormField label="Leave Duration">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!isHalfDay}
                        onChange={() => {
                          setIsHalfDay(false);
                          setValue("endDate", watchedStartDate);
                          setShowEndDate(false);
                        }}
                        className="text-indigo-600"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Full Day
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={isHalfDay}
                        onChange={() => {
                          setIsHalfDay(true);
                          setValue("endDate", "");
                          setShowEndDate(false);
                        }}
                        className="text-indigo-600"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Half Day
                      </span>
                    </label>
                  </div>
                </FormField>
              )}

              {/* Date Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField 
                  label="Start Date" 
                  error={errors.startDate?.message}
                  required
                >
                  <TextInput
                    type="date"
                    {...register("startDate")}
                    min={getMinDate()}
                    onChange={(e) => {
                      register("startDate").onChange(e);
                      if (!isHalfDay && !showEndDate) {
                        setValue("endDate", e.target.value);
                      }
                    }}
                  />
                </FormField>

                {isHalfDay ? (
                  <>
                    <FormField label="Start Session" required>
                      <Controller
                        name="startSession"
                        control={control}
                        render={({ field }) => (
                          <SelectInputWithOptions
                            {...field}
                            options={[
                              { value: "FIRST_HALF", label: "First Half (9 AM - 1 PM)" },
                              { value: "SECOND_HALF", label: "Second Half (1 PM - 6 PM)" },
                            ]}
                          />
                        )}
                      />
                    </FormField>
                  </>
                ) : (
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <FormField 
                        label="End Date" 
                        error={errors.endDate?.message}
                        required={!isHalfDay}
                      >
                        <TextInput
                          type="date"
                          {...register("endDate")}
                          min={watchedStartDate}
                          disabled={!showEndDate && !isHalfDay}
                        />
                      </FormField>
                    </div>
                    {!isHalfDay && (
                      <div className="pb-6">
                        <ToggleField
                          label="Multiple Days"
                          checked={showEndDate}
                          onChange={(checked) => {
                            setShowEndDate(checked);
                            if (!checked) {
                              setValue("endDate", watchedStartDate);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {isHalfDay && (
                  <FormField label="End Session" required>
                    <Controller
                      name="endSession"
                      control={control}
                      render={({ field }) => (
                        <SelectInputWithOptions
                          {...field}
                          options={[
                            { value: "FIRST_HALF", label: "First Half (9 AM - 1 PM)" },
                            { value: "SECOND_HALF", label: "Second Half (1 PM - 6 PM)" },
                          ]}
                        />
                      )}
                    />
                  </FormField>
                )}
              </div>

              {/* Days Preview */}
              {previewDays > 0 && (
                <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 p-4 border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center gap-3">
                    <MdCalendarToday className="text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                        Total Leave Days
                      </p>
                      <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
                        {previewDays} {previewDays === 1 ? 'day' : 'days'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Reason */}
              <FormField 
                label="Reason for Leave" 
                error={errors.reason?.message}
                required={selectedType.minNoticeDays > 0}
              >
                <TextArea
                  {...register("reason")}
                  placeholder="Please provide a reason for your leave request..."
                  rows={4}
                />
              </FormField>

              {/* Document Upload */}
              {selectedType.minNoticeDays <= 1 && (
                <FormField label="Supporting Documents (Optional)">
                  <FileUpload
                    accept=".pdf,.jpg,.jpeg,.png"
                    maxSize={5 * 1024 * 1024} // 5MB
                    onFileSelect={(file: File) => {
                      // Handle file upload logic here
                      console.log("File selected:", file);
                    }}
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Upload medical certificates, travel documents, or other supporting files (PDF, JPG, PNG - Max 5MB)
                  </p>
                </FormField>
              )}

              {/* Warnings */}
              {(watchedStartDate && (isHoliday(watchedStartDate) || isWeekend(watchedStartDate))) && (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-4 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <MdWarning className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                        Leave on Holiday/Weekend
                      </p>
                      <p className="text-amber-700 dark:text-amber-300">
                        {isHoliday(watchedStartDate) ? "The selected date is a holiday." : ""}
                        {isHoliday(watchedStartDate) && isWeekend(watchedStartDate) ? " " : ""}
                        {isWeekend(watchedStartDate) ? "The selected date is a weekend." : ""}
                        This may require special approval.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !watchedLeaveTypeId || !watchedStartDate}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </span>
              ) : (
                "Submit Leave Application"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
