-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "userEmail" TEXT,
ADD COLUMN     "userPassword" TEXT;
