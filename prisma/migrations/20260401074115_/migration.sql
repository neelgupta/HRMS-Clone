-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'PROBATION');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('PROBATION', 'CONFIRMED', 'TERMINATED', 'RESIGNED', 'RETIRED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('AADHAR_CARD', 'PAN_CARD', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID', 'BANK_PASSBOOK', 'EDUCATION_CERTIFICATE', 'EXPERIENCE_LETTER', 'OFFER_LETTER', 'APPOINTMENT_LETTER', 'SALARY_SLIP', 'FORM_16', 'PF_DOCUMENT', 'ESI_DOCUMENT', 'PHOTO', 'SIGNATURE', 'OTHER');

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT,
    "employeeCode" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "maritalStatus" "MaritalStatus",
    "bloodGroup" TEXT,
    "department" TEXT,
    "designation" TEXT,
    "dateOfJoining" TIMESTAMP(3),
    "dateOfLeaving" TIMESTAMP(3),
    "employmentType" "EmploymentType" NOT NULL DEFAULT E'FULL_TIME',
    "employmentStatus" "EmploymentStatus" NOT NULL DEFAULT E'PROBATION',
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactRelation" TEXT,
    "presentAddressLine1" TEXT,
    "presentAddressLine2" TEXT,
    "presentCity" TEXT,
    "presentState" TEXT,
    "presentCountry" TEXT,
    "presentPincode" TEXT,
    "permanentAddressLine1" TEXT,
    "permanentAddressLine2" TEXT,
    "permanentCity" TEXT,
    "permanentState" TEXT,
    "permanentCountry" TEXT,
    "permanentPincode" TEXT,
    "bankAccountHolderName" TEXT,
    "bankAccountNumber" TEXT,
    "bankName" TEXT,
    "bankBranchName" TEXT,
    "bankIfscCode" TEXT,
    "panNumber" TEXT,
    "aadharNumber" TEXT,
    "pfNumber" TEXT,
    "pfUAN" TEXT,
    "esiNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_educations" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "yearOfPassing" INTEGER,
    "percentage" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_educations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_work_histories" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "reasonForLeaving" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_work_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_custom_field_values" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_custom_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "expiryDate" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "isExpired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_employeeCode_key" ON "employees"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE INDEX "employees_companyId_idx" ON "employees"("companyId");

-- CreateIndex
CREATE INDEX "employees_branchId_idx" ON "employees"("branchId");

-- CreateIndex
CREATE INDEX "employees_department_idx" ON "employees"("department");

-- CreateIndex
CREATE UNIQUE INDEX "employee_custom_field_values_employeeId_fieldId_key" ON "employee_custom_field_values"("employeeId", "fieldId");

-- CreateIndex
CREATE INDEX "documents_employeeId_idx" ON "documents"("employeeId");

-- CreateIndex
CREATE INDEX "documents_expiryDate_idx" ON "documents"("expiryDate");

-- CreateIndex
CREATE INDEX "audit_logs_companyId_idx" ON "audit_logs"("companyId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_educations" ADD CONSTRAINT "employee_educations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_work_histories" ADD CONSTRAINT "employee_work_histories_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_custom_field_values" ADD CONSTRAINT "employee_custom_field_values_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "employee_custom_fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_custom_field_values" ADD CONSTRAINT "employee_custom_field_values_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
