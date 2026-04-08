/*
  Warnings:

  - Changed the column `maritalStatus` on the `CampaignCriteria` table from a scalar field to a list field. If there are non-null values in that column, this step will fail.

*/
-- AlterTable
ALTER TABLE "CampaignCriteria" ALTER COLUMN "maritalStatus" SET DATA TYPE "MaritalStatus"[] USING ARRAY["maritalStatus"::"MaritalStatus"];
