-- CreateTable (were in schema.prisma but never in earlier migrations)
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

CREATE UNIQUE INDEX "departments_companyId_code_key" ON "departments"("companyId", "code");
CREATE INDEX "departments_companyId_idx" ON "departments"("companyId");

CREATE UNIQUE INDEX "designations_companyId_code_key" ON "designations"("companyId", "code");
CREATE INDEX "designations_companyId_idx" ON "designations"("companyId");

ALTER TABLE "departments" ADD CONSTRAINT "departments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "designations" ADD CONSTRAINT "designations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Align employees with schema (replace legacy department/designation TEXT)
DROP INDEX IF EXISTS "employees_department_idx";

ALTER TABLE "employees" DROP COLUMN IF EXISTS "department";
ALTER TABLE "employees" DROP COLUMN IF EXISTS "designation";

ALTER TABLE "employees" ADD COLUMN "departmentId" TEXT;
ALTER TABLE "employees" ADD COLUMN "designationId" TEXT;
ALTER TABLE "employees" ADD COLUMN "reportingManagerId" TEXT;
ALTER TABLE "employees" ADD COLUMN "probationEndDate" TIMESTAMP(3);

CREATE INDEX "employees_departmentId_idx" ON "employees"("departmentId");
CREATE INDEX "employees_designationId_idx" ON "employees"("designationId");
CREATE INDEX "employees_reportingManagerId_idx" ON "employees"("reportingManagerId");

ALTER TABLE "employees" ADD CONSTRAINT "employees_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "employees" ADD CONSTRAINT "employees_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "designations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "employees" ADD CONSTRAINT "employees_reportingManagerId_fkey" FOREIGN KEY ("reportingManagerId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
