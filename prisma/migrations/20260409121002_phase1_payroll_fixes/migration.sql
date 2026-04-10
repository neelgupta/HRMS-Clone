/*
  Warnings:

  - You are about to drop the column `department` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `designation` on the `employees` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[companyEmail]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[employeeId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PENDING', 'PRESENT', 'ABSENT', 'HALF_DAY', 'LATE', 'ON_LEAVE', 'HOLIDAY', 'WEEK_OFF');

-- CreateEnum
CREATE TYPE "RegularizationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LeaveCategory" AS ENUM ('CASUAL', 'SICK', 'PRIVILEGE', 'MATERNITY', 'PATERNITY', 'BEREAVEMENT', 'UNPAID', 'COMP_OFF', 'WORK_FROM_HOME');

-- CreateEnum
CREATE TYPE "AccrualType" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('FULL_DAY', 'FIRST_HALF', 'SECOND_HALF');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'MODIFICATION_REQUESTED');

-- CreateEnum
CREATE TYPE "ApprovalRole" AS ENUM ('MANAGER', 'HR', 'BOTH');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('CASUAL', 'SICK', 'PRIVILEGE', 'MATERNITY', 'PATERNITY', 'BEREAVEMENT', 'UNPAID', 'WORK_FROM_HOME');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CompOffStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'USED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LEAVE_APPLIED', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'LEAVE_MODIFICATION_REQUESTED', 'LEAVE_CANCELLED', 'BALANCE_LOW', 'COMP_OFF_EARNED', 'COMP_OFF_EXPIRING', 'COMP_OFF_APPLIED', 'COMP_OFF_APPROVED', 'COMP_OFF_REJECTED');

-- CreateEnum
CREATE TYPE "SalaryComponentType" AS ENUM ('EARNING', 'DEDUCTION');

-- CreateEnum
CREATE TYPE "ComponentCategory" AS ENUM ('BASIC', 'HRA', 'CONVEYANCE', 'SPECIAL_ALLOWANCE', 'BONUS', 'PF', 'ESI', 'TDS', 'PROFESSIONAL_TAX', 'LOAN', 'OTHER');

-- CreateEnum
CREATE TYPE "CalculateOn" AS ENUM ('CTC', 'BASIC', 'GROSS');

-- CreateEnum
CREATE TYPE "DeclarationType" AS ENUM ('INVESTMENT', 'EXPENSE', 'RENT', 'HOME_LOAN', 'OTHER');

-- CreateEnum
CREATE TYPE "TaxDeclarationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PayrollRunStatus" AS ENUM ('DRAFT', 'PROCESSED', 'LOCKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayrollItemStatus" AS ENUM ('CALCULATED', 'APPROVED', 'PAID', 'HOLD');

-- CreateEnum
CREATE TYPE "AdjustmentType" AS ENUM ('ARREARS', 'BONUS', 'REIMBURSEMENT', 'LOP_ADJUSTMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "LoanType" AS ENUM ('PERSONAL', 'HOME', 'CAR', 'EDUCATION', 'OTHER');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RepaymentStatus" AS ENUM ('PENDING', 'DEDUCTED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ReimbursementType" AS ENUM ('TRAVEL', 'MEDICAL', 'FOOD', 'COMMUNICATION', 'EQUIPMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ReimbursementStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID');

-- CreateEnum
CREATE TYPE "TaxRegime" AS ENUM ('OLD', 'NEW');

-- CreateEnum
CREATE TYPE "SalaryCycle" AS ENUM ('MONTHLY', 'BIWEEKLY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "WorkingDaysCalcMethod" AS ENUM ('CALENDAR_DAYS_MINUS_HOLIDAYS', 'FIXED_TWENTY_SIX');

-- CreateEnum
CREATE TYPE "MidMonthMethod" AS ENUM ('CALENDAR_DAYS', 'WORKING_DAYS');

-- CreateEnum
CREATE TYPE "RoundingRule" AS ENUM ('ROUND_OFF', 'ROUND_UP', 'ROUND_DOWN', 'NO_ROUNDING');

-- CreateEnum
CREATE TYPE "LOPMethod" AS ENUM ('PER_WORKING_DAY', 'PER_CALENDAR_DAY');

-- CreateEnum
CREATE TYPE "FnFStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SeparationType" AS ENUM ('RESIGNATION', 'TERMINATION', 'RETIREMENT', 'ABSCONDING', 'DEATH');

-- DropIndex
DROP INDEX "employees_department_idx";

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "accessRoles" "Role"[],
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "employees" DROP COLUMN "department",
DROP COLUMN "designation",
ADD COLUMN     "companyEmail" TEXT,
ADD COLUMN     "departmentId" TEXT,
ADD COLUMN     "designationId" TEXT,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "probationEndDate" TIMESTAMP(3),
ADD COLUMN     "reportingManagerId" TEXT,
ADD COLUMN     "userEmail" TEXT,
ADD COLUMN     "userPassword" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "employeeId" TEXT;

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "headId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "designations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "designations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shifts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "gracePeriodMins" INTEGER NOT NULL DEFAULT 0,
    "halfDayHours" DOUBLE PRECISION NOT NULL DEFAULT 4,
    "minWorkingHours" DOUBLE PRECISION NOT NULL DEFAULT 8,
    "isFlexible" BOOLEAN NOT NULL DEFAULT false,
    "isNightShift" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_assignments" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "shiftId" TEXT,
    "clockIn" TIMESTAMP(3),
    "clockOut" TIMESTAMP(3),
    "clockInIp" TEXT,
    "clockOutIp" TEXT,
    "clockInLocation" JSONB,
    "clockOutLocation" JSONB,
    "clockInPhoto" TEXT,
    "clockOutPhoto" TEXT,
    "totalHours" DOUBLE PRECISION,
    "overtimeHours" DOUBLE PRECISION,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "breakEnd" TIMESTAMP(3),
    "breakStart" TIMESTAMP(3),
    "totalBreakMins" INTEGER,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_policies" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "allowLateArrival" BOOLEAN NOT NULL DEFAULT true,
    "gracePeriodMins" INTEGER NOT NULL DEFAULT 0,
    "allowEarlyDeparture" BOOLEAN NOT NULL DEFAULT true,
    "earlyDepartureMins" INTEGER NOT NULL DEFAULT 0,
    "halfDayHours" DOUBLE PRECISION NOT NULL DEFAULT 4,
    "minWorkingHours" DOUBLE PRECISION NOT NULL DEFAULT 8,
    "allowOvertime" BOOLEAN NOT NULL DEFAULT false,
    "maxOvertimeHoursDay" DOUBLE PRECISION NOT NULL DEFAULT 4,
    "deductSalaryForLate" BOOLEAN NOT NULL DEFAULT false,
    "lateArrivalDeductPerc" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "requirePhotoCapture" BOOLEAN NOT NULL DEFAULT false,
    "requireGpsLocation" BOOLEAN NOT NULL DEFAULT false,
    "requireIpRestriction" BOOLEAN NOT NULL DEFAULT false,
    "allowedIps" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "weeklyOff1" TEXT NOT NULL DEFAULT 'SUNDAY',
    "weeklyOff2" TEXT,

    CONSTRAINT "attendance_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_regularizations" (
    "id" TEXT NOT NULL,
    "attendanceId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "requestedClockIn" TIMESTAMP(3),
    "requestedClockOut" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "status" "RegularizationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewRemarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_regularizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_type_configs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "LeaveCategory" NOT NULL,
    "annualDays" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "accrualType" "AccrualType" NOT NULL DEFAULT 'YEARLY',
    "accrualRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxConsecutive" INTEGER NOT NULL DEFAULT 0,
    "minNoticeDays" INTEGER NOT NULL DEFAULT 0,
    "canApplyHalfDay" BOOLEAN NOT NULL DEFAULT true,
    "maxHalfDaysPerYear" INTEGER NOT NULL DEFAULT 0,
    "genderSpecific" "Gender",
    "allowCarryForward" BOOLEAN NOT NULL DEFAULT false,
    "maxCarryForward" INTEGER NOT NULL DEFAULT 0,
    "allowEncashment" BOOLEAN NOT NULL DEFAULT false,
    "maxEncashDays" INTEGER NOT NULL DEFAULT 0,
    "expiryDays" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_type_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_policies" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "managerApprovalDays" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "allowAutoApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvalLevel1" "ApprovalRole" NOT NULL DEFAULT 'MANAGER',
    "approvalLevel2" "ApprovalRole",
    "autoApprovalDaysThreshold" INTEGER NOT NULL DEFAULT 0,
    "carryForwardDeadline" TIMESTAMP(3),
    "encashmentEndMonth" INTEGER NOT NULL DEFAULT 3,
    "encashmentStartMonth" INTEGER NOT NULL DEFAULT 1,
    "hrApprovalDays" INTEGER NOT NULL DEFAULT 3,
    "processCarryForward" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "leave_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_applications" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "leaveType" "LeaveType",
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "totalDays" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approverId" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "currentApproverLevel" INTEGER NOT NULL DEFAULT 1,
    "endSession" "SessionType" NOT NULL DEFAULT 'FULL_DAY',
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "leaveTypeId" TEXT,
    "level1Remarks" TEXT,
    "level1ReviewedAt" TIMESTAMP(3),
    "level1ReviewedBy" TEXT,
    "level1Status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "level2Remarks" TEXT,
    "level2ReviewedAt" TIMESTAMP(3),
    "level2ReviewedBy" TEXT,
    "level2Status" "ApprovalStatus",
    "startSession" "SessionType" NOT NULL DEFAULT 'FULL_DAY',

    CONSTRAINT "leave_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_balances" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "leaveType" "LeaveType",
    "usedDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pendingDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "availableDays" DOUBLE PRECISION NOT NULL,
    "carriedForward" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "accruedDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "allocatedDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "encashedDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expiredDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastAccruedAt" TIMESTAMP(3),
    "leaveTypeId" TEXT,
    "month" INTEGER,

    CONSTRAINT "leave_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comp_off_requests" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "workDate" DATE NOT NULL,
    "workSession" "SessionType" NOT NULL DEFAULT 'FULL_DAY',
    "expiryDate" TIMESTAMP(3),
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedOnDate" TIMESTAMP(3),
    "reason" TEXT,
    "attachmentUrl" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "status" "CompOffStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comp_off_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comp_off_balances" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "earnedDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usedDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "availableDays" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comp_off_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holidays" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT,
    "branchId" TEXT,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_holidays" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_comments" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_notifications" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "relatedType" TEXT,
    "relatedId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_approval_history" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_approval_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_components" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SalaryComponentType" NOT NULL,
    "category" "ComponentCategory" NOT NULL,
    "description" TEXT,
    "isTaxable" BOOLEAN NOT NULL DEFAULT false,
    "isFixed" BOOLEAN NOT NULL DEFAULT true,
    "calculateOn" "CalculateOn" NOT NULL DEFAULT 'CTC',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_structures" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "salary_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_structure_items" (
    "id" TEXT NOT NULL,
    "structureId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "percentage" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "salary_structure_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_structure_revisions" (
    "id" TEXT NOT NULL,
    "structureId" TEXT NOT NULL,
    "revisionDate" TIMESTAMP(3) NOT NULL,
    "changes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "salary_structure_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_declarations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "financialYear" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "declarationType" "DeclarationType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "documents" TEXT[],
    "status" "TaxDeclarationStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_declarations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_runs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "PayrollRunStatus" NOT NULL DEFAULT 'DRAFT',
    "totalEmployees" INTEGER NOT NULL,
    "totalEarnings" DECIMAL(15,2) NOT NULL,
    "totalDeductions" DECIMAL(15,2) NOT NULL,
    "totalGross" DECIMAL(15,2) NOT NULL,
    "totalNetPay" DECIMAL(15,2) NOT NULL,
    "runDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedBy" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_items" (
    "id" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "workingDays" INTEGER NOT NULL,
    "daysWorked" INTEGER NOT NULL,
    "lopDays" DECIMAL(5,2) NOT NULL,
    "halfDays" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "lateDays" INTEGER NOT NULL DEFAULT 0,
    "overtimeHours" DECIMAL(5,2) NOT NULL,
    "overtimeAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "grossSalary" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lopAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "basicEarnings" DECIMAL(12,2) NOT NULL,
    "hraEarnings" DECIMAL(12,2) NOT NULL,
    "conveyanceEarnings" DECIMAL(12,2) NOT NULL,
    "specialAllowance" DECIMAL(12,2) NOT NULL,
    "bonusEarnings" DECIMAL(12,2) NOT NULL,
    "otherEarnings" DECIMAL(12,2) NOT NULL,
    "totalEarnings" DECIMAL(12,2) NOT NULL,
    "pfDeduction" DECIMAL(12,2) NOT NULL,
    "esiDeduction" DECIMAL(12,2) NOT NULL,
    "tdsDeduction" DECIMAL(12,2) NOT NULL,
    "professionalTax" DECIMAL(12,2) NOT NULL,
    "loanDeduction" DECIMAL(12,2) NOT NULL,
    "otherDeductions" DECIMAL(12,2) NOT NULL,
    "totalDeductions" DECIMAL(12,2) NOT NULL,
    "netPay" DECIMAL(12,2) NOT NULL,
    "arrears" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "reimbursements" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxRegimeUsed" "TaxRegime" NOT NULL DEFAULT 'NEW',
    "status" "PayrollItemStatus" NOT NULL DEFAULT 'CALCULATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_adjustments" (
    "id" TEXT NOT NULL,
    "payrollItemId" TEXT NOT NULL,
    "type" "AdjustmentType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "payroll_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslips" (
    "id" TEXT NOT NULL,
    "payrollItemId" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentViaEmail" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "payslips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pf_records" (
    "id" TEXT NOT NULL,
    "payrollItemId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "uanNumber" TEXT,
    "pfNumber" TEXT,
    "employeeContrib" DECIMAL(12,2) NOT NULL,
    "employerContrib" DECIMAL(12,2) NOT NULL,
    "totalContrib" DECIMAL(12,2) NOT NULL,
    "pensionContrib" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pf_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esi_records" (
    "id" TEXT NOT NULL,
    "payrollItemId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "esiNumber" TEXT,
    "employeeContrib" DECIMAL(12,2) NOT NULL,
    "employerContrib" DECIMAL(12,2) NOT NULL,
    "totalContrib" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "esi_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tds_records" (
    "id" TEXT NOT NULL,
    "payrollItemId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "taxFromSalary" DECIMAL(12,2) NOT NULL,
    "taxFromOther" DECIMAL(12,2) NOT NULL,
    "totalTax" DECIMAL(12,2) NOT NULL,
    "cess" DECIMAL(12,2) NOT NULL,
    "totalTds" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tds_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "loanType" "LoanType" NOT NULL,
    "principalAmount" DECIMAL(12,2) NOT NULL,
    "interestRate" DECIMAL(5,2) NOT NULL,
    "tenureMonths" INTEGER NOT NULL,
    "emiAmount" DECIMAL(12,2) NOT NULL,
    "totalInterest" DECIMAL(12,2) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "disbursedAmount" DECIMAL(12,2) NOT NULL,
    "outstandingAmount" DECIMAL(12,2) NOT NULL,
    "status" "LoanStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_repayments" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "principal" DECIMAL(12,2) NOT NULL,
    "interest" DECIMAL(12,2) NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL,
    "status" "RepaymentStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_repayments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reimbursements" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "ReimbursementType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT NOT NULL,
    "receiptUrl" TEXT,
    "status" "ReimbursementStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "addedToPayroll" BOOLEAN NOT NULL DEFAULT false,
    "payrollItemId" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reimbursements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_settings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "pfEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pfRate" DECIMAL(5,2) NOT NULL DEFAULT 12,
    "pfWageCeiling" DECIMAL(10,2) NOT NULL DEFAULT 15000,
    "pfContribOnActual" BOOLEAN NOT NULL DEFAULT false,
    "vpfEnabled" BOOLEAN NOT NULL DEFAULT false,
    "esiEnabled" BOOLEAN NOT NULL DEFAULT true,
    "esiRate" DECIMAL(5,2) NOT NULL DEFAULT 0.75,
    "esiEmployerRate" DECIMAL(5,2) NOT NULL DEFAULT 3.25,
    "esiWageCeiling" DECIMAL(10,2) NOT NULL DEFAULT 21000,
    "tdsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "taxRegime" "TaxRegime" NOT NULL DEFAULT 'NEW',
    "ptEnabled" BOOLEAN NOT NULL DEFAULT true,
    "ptState" TEXT,
    "professionalTax" DECIMAL(10,2) NOT NULL DEFAULT 200,
    "gratuityEnabled" BOOLEAN NOT NULL DEFAULT true,
    "gratuityRate" DECIMAL(6,4) NOT NULL DEFAULT 0.0481,
    "defaultBasicPercent" DECIMAL(5,2) NOT NULL DEFAULT 40,
    "defaultHraPercent" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "defaultConveyanceAmt" DECIMAL(10,2) NOT NULL DEFAULT 1600,
    "salaryCycle" "SalaryCycle" NOT NULL DEFAULT 'MONTHLY',
    "salaryPayDay" INTEGER NOT NULL DEFAULT 1,
    "workingDaysCalcMethod" "WorkingDaysCalcMethod" NOT NULL DEFAULT 'CALENDAR_DAYS_MINUS_HOLIDAYS',
    "midMonthCalcMethod" "MidMonthMethod" NOT NULL DEFAULT 'CALENDAR_DAYS',
    "roundingRule" "RoundingRule" NOT NULL DEFAULT 'ROUND_OFF',
    "overtimeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "overtimeRate" DECIMAL(4,2) NOT NULL DEFAULT 2.0,
    "halfDayAsLop" DECIMAL(3,2) NOT NULL DEFAULT 0.5,
    "lateDaysThreshold" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_tax_configs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "taxRegime" "TaxRegime" NOT NULL DEFAULT 'NEW',
    "isMetroCity" BOOLEAN NOT NULL DEFAULT false,
    "monthlyRent" DECIMAL(10,2),
    "pfOptOut" BOOLEAN NOT NULL DEFAULT false,
    "vpfAmount" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_tax_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_tax_slabs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "minSalary" DECIMAL(10,2) NOT NULL,
    "maxSalary" DECIMAL(10,2),
    "monthlyPT" DECIMAL(8,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "professional_tax_slabs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_pin_configs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastChanged" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_pin_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "full_final_settlements" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "lastWorkingDate" TIMESTAMP(3) NOT NULL,
    "resignationDate" TIMESTAMP(3),
    "separationType" "SeparationType" NOT NULL,
    "noticePeriodDays" INTEGER NOT NULL DEFAULT 0,
    "noticePeriodServed" INTEGER NOT NULL DEFAULT 0,
    "noticeRecoveryAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "noticePayout" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "leaveEncashmentDays" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "leaveEncashmentAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "gratuityAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "outstandingLoanAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "otherDeductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "otherPayments" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lastMonthSalary" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalPayable" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "FnFStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "settledAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "full_final_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "departments_companyId_idx" ON "departments"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "departments_companyId_code_key" ON "departments"("companyId", "code");

-- CreateIndex
CREATE INDEX "designations_companyId_idx" ON "designations"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "designations_companyId_code_key" ON "designations"("companyId", "code");

-- CreateIndex
CREATE INDEX "shifts_companyId_idx" ON "shifts"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "shifts_companyId_code_key" ON "shifts"("companyId", "code");

-- CreateIndex
CREATE INDEX "shift_assignments_employeeId_idx" ON "shift_assignments"("employeeId");

-- CreateIndex
CREATE INDEX "shift_assignments_shiftId_idx" ON "shift_assignments"("shiftId");

-- CreateIndex
CREATE UNIQUE INDEX "shift_assignments_employeeId_shiftId_effectiveFrom_key" ON "shift_assignments"("employeeId", "shiftId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "attendances_employeeId_idx" ON "attendances"("employeeId");

-- CreateIndex
CREATE INDEX "attendances_companyId_idx" ON "attendances"("companyId");

-- CreateIndex
CREATE INDEX "attendances_date_idx" ON "attendances"("date");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_employeeId_date_key" ON "attendances"("employeeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_policies_companyId_key" ON "attendance_policies"("companyId");

-- CreateIndex
CREATE INDEX "attendance_regularizations_attendanceId_idx" ON "attendance_regularizations"("attendanceId");

-- CreateIndex
CREATE INDEX "attendance_regularizations_employeeId_idx" ON "attendance_regularizations"("employeeId");

-- CreateIndex
CREATE INDEX "attendance_regularizations_status_idx" ON "attendance_regularizations"("status");

-- CreateIndex
CREATE INDEX "leave_type_configs_companyId_idx" ON "leave_type_configs"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "leave_type_configs_companyId_code_key" ON "leave_type_configs"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "leave_policies_companyId_key" ON "leave_policies"("companyId");

-- CreateIndex
CREATE INDEX "leave_applications_companyId_idx" ON "leave_applications"("companyId");

-- CreateIndex
CREATE INDEX "leave_applications_employeeId_idx" ON "leave_applications"("employeeId");

-- CreateIndex
CREATE INDEX "leave_applications_status_idx" ON "leave_applications"("status");

-- CreateIndex
CREATE INDEX "leave_applications_leaveTypeId_idx" ON "leave_applications"("leaveTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "leave_applications_employeeId_startDate_key" ON "leave_applications"("employeeId", "startDate");

-- CreateIndex
CREATE INDEX "leave_balances_employeeId_idx" ON "leave_balances"("employeeId");

-- CreateIndex
CREATE INDEX "leave_balances_companyId_idx" ON "leave_balances"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "leave_balances_employeeId_year_leaveTypeId_key" ON "leave_balances"("employeeId", "year", "leaveTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "leave_balances_employeeId_year_leaveType_key" ON "leave_balances"("employeeId", "year", "leaveType");

-- CreateIndex
CREATE INDEX "comp_off_requests_companyId_idx" ON "comp_off_requests"("companyId");

-- CreateIndex
CREATE INDEX "comp_off_requests_employeeId_idx" ON "comp_off_requests"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "comp_off_requests_employeeId_workDate_key" ON "comp_off_requests"("employeeId", "workDate");

-- CreateIndex
CREATE UNIQUE INDEX "comp_off_balances_employeeId_key" ON "comp_off_balances"("employeeId");

-- CreateIndex
CREATE INDEX "comp_off_balances_employeeId_idx" ON "comp_off_balances"("employeeId");

-- CreateIndex
CREATE INDEX "holidays_companyId_idx" ON "holidays"("companyId");

-- CreateIndex
CREATE INDEX "holidays_branchId_idx" ON "holidays"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "holidays_companyId_date_branchId_key" ON "holidays"("companyId", "date", "branchId");

-- CreateIndex
CREATE INDEX "leave_holidays_companyId_idx" ON "leave_holidays"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "leave_holidays_companyId_date_key" ON "leave_holidays"("companyId", "date");

-- CreateIndex
CREATE INDEX "leave_comments_applicationId_idx" ON "leave_comments"("applicationId");

-- CreateIndex
CREATE INDEX "leave_notifications_employeeId_idx" ON "leave_notifications"("employeeId");

-- CreateIndex
CREATE INDEX "leave_notifications_companyId_idx" ON "leave_notifications"("companyId");

-- CreateIndex
CREATE INDEX "leave_approval_history_applicationId_idx" ON "leave_approval_history"("applicationId");

-- CreateIndex
CREATE INDEX "salary_components_companyId_idx" ON "salary_components"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "salary_components_companyId_name_key" ON "salary_components"("companyId", "name");

-- CreateIndex
CREATE INDEX "salary_structures_companyId_idx" ON "salary_structures"("companyId");

-- CreateIndex
CREATE INDEX "salary_structures_employeeId_idx" ON "salary_structures"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "salary_structures_employeeId_effectiveFrom_key" ON "salary_structures"("employeeId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "salary_structure_items_structureId_idx" ON "salary_structure_items"("structureId");

-- CreateIndex
CREATE INDEX "salary_structure_items_componentId_idx" ON "salary_structure_items"("componentId");

-- CreateIndex
CREATE INDEX "salary_structure_revisions_structureId_idx" ON "salary_structure_revisions"("structureId");

-- CreateIndex
CREATE INDEX "tax_declarations_companyId_idx" ON "tax_declarations"("companyId");

-- CreateIndex
CREATE INDEX "tax_declarations_employeeId_idx" ON "tax_declarations"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "tax_declarations_companyId_employeeId_financialYear_section_key" ON "tax_declarations"("companyId", "employeeId", "financialYear", "section");

-- CreateIndex
CREATE INDEX "payroll_runs_companyId_idx" ON "payroll_runs"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_runs_companyId_month_year_key" ON "payroll_runs"("companyId", "month", "year");

-- CreateIndex
CREATE INDEX "payroll_items_payrollRunId_idx" ON "payroll_items"("payrollRunId");

-- CreateIndex
CREATE INDEX "payroll_items_employeeId_idx" ON "payroll_items"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_items_payrollRunId_employeeId_key" ON "payroll_items"("payrollRunId", "employeeId");

-- CreateIndex
CREATE INDEX "payroll_adjustments_payrollItemId_idx" ON "payroll_adjustments"("payrollItemId");

-- CreateIndex
CREATE UNIQUE INDEX "payslips_payrollItemId_key" ON "payslips"("payrollItemId");

-- CreateIndex
CREATE UNIQUE INDEX "pf_records_payrollItemId_key" ON "pf_records"("payrollItemId");

-- CreateIndex
CREATE INDEX "pf_records_employeeId_idx" ON "pf_records"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "esi_records_payrollItemId_key" ON "esi_records"("payrollItemId");

-- CreateIndex
CREATE INDEX "esi_records_employeeId_idx" ON "esi_records"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "tds_records_payrollItemId_key" ON "tds_records"("payrollItemId");

-- CreateIndex
CREATE INDEX "tds_records_employeeId_idx" ON "tds_records"("employeeId");

-- CreateIndex
CREATE INDEX "loans_companyId_idx" ON "loans"("companyId");

-- CreateIndex
CREATE INDEX "loans_employeeId_idx" ON "loans"("employeeId");

-- CreateIndex
CREATE INDEX "loan_repayments_loanId_idx" ON "loan_repayments"("loanId");

-- CreateIndex
CREATE UNIQUE INDEX "loan_repayments_loanId_month_year_key" ON "loan_repayments"("loanId", "month", "year");

-- CreateIndex
CREATE INDEX "reimbursements_companyId_idx" ON "reimbursements"("companyId");

-- CreateIndex
CREATE INDEX "reimbursements_employeeId_idx" ON "reimbursements"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_settings_companyId_key" ON "payroll_settings"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_tax_configs_employeeId_key" ON "employee_tax_configs"("employeeId");

-- CreateIndex
CREATE INDEX "employee_tax_configs_companyId_idx" ON "employee_tax_configs"("companyId");

-- CreateIndex
CREATE INDEX "professional_tax_slabs_companyId_state_idx" ON "professional_tax_slabs"("companyId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_pin_configs_userId_key" ON "payroll_pin_configs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "full_final_settlements_employeeId_key" ON "full_final_settlements"("employeeId");

-- CreateIndex
CREATE INDEX "full_final_settlements_companyId_idx" ON "full_final_settlements"("companyId");

-- CreateIndex
CREATE INDEX "documents_type_idx" ON "documents"("type");

-- CreateIndex
CREATE UNIQUE INDEX "employees_companyEmail_key" ON "employees"("companyEmail");

-- CreateIndex
CREATE INDEX "employees_departmentId_idx" ON "employees"("departmentId");

-- CreateIndex
CREATE INDEX "employees_designationId_idx" ON "employees"("designationId");

-- CreateIndex
CREATE INDEX "employees_reportingManagerId_idx" ON "employees"("reportingManagerId");

-- CreateIndex
CREATE UNIQUE INDEX "users_employeeId_key" ON "users"("employeeId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designations" ADD CONSTRAINT "designations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "designations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_reportingManagerId_fkey" FOREIGN KEY ("reportingManagerId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_policies" ADD CONSTRAINT "attendance_policies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_regularizations" ADD CONSTRAINT "attendance_regularizations_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "attendances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_type_configs" ADD CONSTRAINT "leave_type_configs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_policies" ADD CONSTRAINT "leave_policies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "leave_type_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "leave_type_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comp_off_requests" ADD CONSTRAINT "comp_off_requests_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comp_off_requests" ADD CONSTRAINT "comp_off_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comp_off_balances" ADD CONSTRAINT "comp_off_balances_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comp_off_balances" ADD CONSTRAINT "comp_off_balances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_holidays" ADD CONSTRAINT "leave_holidays_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_comments" ADD CONSTRAINT "leave_comments_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "leave_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_comments" ADD CONSTRAINT "leave_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_notifications" ADD CONSTRAINT "leave_notifications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_approval_history" ADD CONSTRAINT "leave_approval_history_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "leave_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_approval_history" ADD CONSTRAINT "leave_approval_history_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_components" ADD CONSTRAINT "salary_components_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_structures" ADD CONSTRAINT "salary_structures_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_structures" ADD CONSTRAINT "salary_structures_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_structure_items" ADD CONSTRAINT "salary_structure_items_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "salary_structures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_structure_items" ADD CONSTRAINT "salary_structure_items_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "salary_components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_structure_revisions" ADD CONSTRAINT "salary_structure_revisions_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "salary_structures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_declarations" ADD CONSTRAINT "tax_declarations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_declarations" ADD CONSTRAINT "tax_declarations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_adjustments" ADD CONSTRAINT "payroll_adjustments_payrollItemId_fkey" FOREIGN KEY ("payrollItemId") REFERENCES "payroll_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payrollItemId_fkey" FOREIGN KEY ("payrollItemId") REFERENCES "payroll_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pf_records" ADD CONSTRAINT "pf_records_payrollItemId_fkey" FOREIGN KEY ("payrollItemId") REFERENCES "payroll_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pf_records" ADD CONSTRAINT "pf_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esi_records" ADD CONSTRAINT "esi_records_payrollItemId_fkey" FOREIGN KEY ("payrollItemId") REFERENCES "payroll_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esi_records" ADD CONSTRAINT "esi_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tds_records" ADD CONSTRAINT "tds_records_payrollItemId_fkey" FOREIGN KEY ("payrollItemId") REFERENCES "payroll_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tds_records" ADD CONSTRAINT "tds_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_repayments" ADD CONSTRAINT "loan_repayments_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reimbursements" ADD CONSTRAINT "reimbursements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reimbursements" ADD CONSTRAINT "reimbursements_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_settings" ADD CONSTRAINT "payroll_settings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_tax_configs" ADD CONSTRAINT "employee_tax_configs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_tax_configs" ADD CONSTRAINT "employee_tax_configs_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_tax_slabs" ADD CONSTRAINT "professional_tax_slabs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_pin_configs" ADD CONSTRAINT "payroll_pin_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "full_final_settlements" ADD CONSTRAINT "full_final_settlements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "full_final_settlements" ADD CONSTRAINT "full_final_settlements_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
