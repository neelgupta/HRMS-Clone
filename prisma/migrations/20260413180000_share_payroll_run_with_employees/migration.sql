-- Add `sharedWithEmployees` to payroll runs so HR can publish salary slips to employees.
ALTER TABLE "payroll_runs"
ADD COLUMN "sharedWithEmployees" BOOLEAN NOT NULL DEFAULT false;

