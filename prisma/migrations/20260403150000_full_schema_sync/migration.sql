-- Full schema sync vs prisma/schema.prisma after migration 20260401074115_.
-- Replaces removed folders 20260403120000_add_users_employee_id and
-- 20260403140000_departments_designations_employee_fks.
--
-- Recovery: If _prisma_migrations still lists those removed migration names, delete those
-- rows and reconcile partial DDL, or reset the Postgres volume / use a fresh database
-- before running prisma migrate deploy.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "employeeId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "users_employeeId_key" ON "users"("employeeId");
DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "departments" (
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
CREATE TABLE IF NOT EXISTS "designations" (
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
CREATE UNIQUE INDEX IF NOT EXISTS "departments_companyId_code_key" ON "departments"("companyId", "code");
CREATE INDEX IF NOT EXISTS "departments_companyId_idx" ON "departments"("companyId");
CREATE UNIQUE INDEX IF NOT EXISTS "designations_companyId_code_key" ON "designations"("companyId", "code");
CREATE INDEX IF NOT EXISTS "designations_companyId_idx" ON "designations"("companyId");
DO $$ BEGIN
  ALTER TABLE "departments" ADD CONSTRAINT "departments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "designations" ADD CONSTRAINT "designations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP INDEX IF EXISTS "employees_department_idx";
ALTER TABLE "employees" DROP COLUMN IF EXISTS "department";
ALTER TABLE "employees" DROP COLUMN IF EXISTS "designation";
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "departmentId" TEXT;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "designationId" TEXT;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "reportingManagerId" TEXT;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "probationEndDate" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "employees_departmentId_idx" ON "employees"("departmentId");
CREATE INDEX IF NOT EXISTS "employees_designationId_idx" ON "employees"("designationId");
CREATE INDEX IF NOT EXISTS "employees_reportingManagerId_idx" ON "employees"("reportingManagerId");
DO $$ BEGIN
  ALTER TABLE "employees" ADD CONSTRAINT "employees_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "employees" ADD CONSTRAINT "employees_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "designations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "employees" ADD CONSTRAINT "employees_reportingManagerId_fkey" FOREIGN KEY ("reportingManagerId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "parentId" TEXT;
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "accessRoles" "Role"[] DEFAULT ARRAY[]::"Role"[];
CREATE INDEX IF NOT EXISTS "documents_type_idx" ON "documents"("type");
DO $$ BEGIN
  ALTER TABLE "documents" ADD CONSTRAINT "documents_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AttendanceStatus" AS ENUM ('PENDING', 'PRESENT', 'ABSENT', 'HALF_DAY', 'LATE', 'ON_LEAVE', 'HOLIDAY', 'WEEK_OFF');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "RegularizationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "shifts" (
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
CREATE UNIQUE INDEX IF NOT EXISTS "shifts_companyId_code_key" ON "shifts"("companyId", "code");
CREATE INDEX IF NOT EXISTS "shifts_companyId_idx" ON "shifts"("companyId");
DO $$ BEGIN
  ALTER TABLE "shifts" ADD CONSTRAINT "shifts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "shift_assignments" (
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
CREATE UNIQUE INDEX IF NOT EXISTS "shift_assignments_employeeId_shiftId_effectiveFrom_key" ON "shift_assignments"("employeeId", "shiftId", "effectiveFrom");
CREATE INDEX IF NOT EXISTS "shift_assignments_employeeId_idx" ON "shift_assignments"("employeeId");
CREATE INDEX IF NOT EXISTS "shift_assignments_shiftId_idx" ON "shift_assignments"("shiftId");
DO $$ BEGIN
  ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "attendances" (
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
    "breakStart" TIMESTAMP(3),
    "breakEnd" TIMESTAMP(3),
    "totalBreakMins" INTEGER,
    "totalHours" DOUBLE PRECISION,
    "overtimeHours" DOUBLE PRECISION,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PENDING'::"AttendanceStatus",
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "attendances_employeeId_date_key" ON "attendances"("employeeId", "date");
CREATE INDEX IF NOT EXISTS "attendances_employeeId_idx" ON "attendances"("employeeId");
CREATE INDEX IF NOT EXISTS "attendances_companyId_idx" ON "attendances"("companyId");
CREATE INDEX IF NOT EXISTS "attendances_date_idx" ON "attendances"("date");
DO $$ BEGIN
  ALTER TABLE "attendances" ADD CONSTRAINT "attendances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "attendances" ADD CONSTRAINT "attendances_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "attendances" ADD CONSTRAINT "attendances_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "attendance_policies" (
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
    "allowedIps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "weeklyOff1" TEXT NOT NULL DEFAULT 'SUNDAY',
    "weeklyOff2" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "attendance_policies_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "attendance_policies_companyId_key" ON "attendance_policies"("companyId");
DO $$ BEGIN
  ALTER TABLE "attendance_policies" ADD CONSTRAINT "attendance_policies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "attendance_regularizations" (
    "id" TEXT NOT NULL,
    "attendanceId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "requestedClockIn" TIMESTAMP(3),
    "requestedClockOut" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "status" "RegularizationStatus" NOT NULL DEFAULT 'PENDING'::"RegularizationStatus",
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewRemarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "attendance_regularizations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "attendance_regularizations_attendanceId_idx" ON "attendance_regularizations"("attendanceId");
CREATE INDEX IF NOT EXISTS "attendance_regularizations_employeeId_idx" ON "attendance_regularizations"("employeeId");
CREATE INDEX IF NOT EXISTS "attendance_regularizations_status_idx" ON "attendance_regularizations"("status");
DO $$ BEGIN
  ALTER TABLE "attendance_regularizations" ADD CONSTRAINT "attendance_regularizations_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "attendances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
