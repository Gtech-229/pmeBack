/*
  Warnings:

  - The values [PROJECT_APPROVED] on the enum `ActivityType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ActivityType_new" AS ENUM ('WELCOME', 'PROJECT_CREATED', 'STEP_APPROVED', 'STEP_REJECTED', 'ACCOUNT_VERIFIED', 'REPAYMENT', 'PROJECT_UPDATE', 'PROJECT_FUNDED', 'PROJECT_COMPLETED', 'PROJECT_REJECTED', 'REPAYMENT_LATE', 'REPAYMENT_REMINDER', 'CREDIT_COMPLETED', 'DISBURSEMENT_SCHEDULED', 'DISBURSEMENT_CONFIRMED', 'NEW_OPEN_CAMPAIGN', 'CAMPAIGN_CLOSING_SOON', 'CAMPAIGN_CLOSED', 'ACCOUNT_SUSPENDED', 'PASSWORD_CHANGED');
ALTER TABLE "Activity" ALTER COLUMN "type" TYPE "ActivityType_new" USING ("type"::text::"ActivityType_new");
ALTER TYPE "ActivityType" RENAME TO "ActivityType_old";
ALTER TYPE "ActivityType_new" RENAME TO "ActivityType";
DROP TYPE "public"."ActivityType_old";
COMMIT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pushToken" TEXT;
