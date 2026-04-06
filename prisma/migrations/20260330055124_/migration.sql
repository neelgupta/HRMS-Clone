-- DropForeignKey
ALTER TABLE "bank_details" DROP CONSTRAINT "bank_details_companyId_fkey";

-- DropForeignKey
ALTER TABLE "branches" DROP CONSTRAINT "branches_companyId_fkey";

-- DropForeignKey
ALTER TABLE "company_addresses" DROP CONSTRAINT "company_addresses_companyId_fkey";

-- DropForeignKey
ALTER TABLE "employee_custom_fields" DROP CONSTRAINT "employee_custom_fields_companyId_fkey";

-- DropForeignKey
ALTER TABLE "general_settings" DROP CONSTRAINT "general_settings_companyId_fkey";

-- AlterTable
ALTER TABLE "bank_details" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "branches" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "companies" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "company_addresses" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "employee_custom_fields" ALTER COLUMN "options" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "general_settings" ALTER COLUMN "holidayList" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "company_addresses" ADD CONSTRAINT "company_addresses_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_details" ADD CONSTRAINT "bank_details_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "general_settings" ADD CONSTRAINT "general_settings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_custom_fields" ADD CONSTRAINT "employee_custom_fields_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
