import { z } from "zod";

export const payrollMonthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format");

export const generatePayrollSchema = z.object({
  month: payrollMonthSchema,
  overwrite: z.boolean().optional().default(true),
});

export const listPayrollSchema = z.object({
  month: payrollMonthSchema.optional(),
});

export type GeneratePayrollInput = z.infer<typeof generatePayrollSchema>;
export type ListPayrollInput = z.infer<typeof listPayrollSchema>;

