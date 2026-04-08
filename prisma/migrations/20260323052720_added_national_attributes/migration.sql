/*
  Warnings:

  - The values [OTHER] on the enum `Gender` will be removed. If these variants are still used in the database, this will fail.
  - Made the column `gender` on table `CampaignCriteria` required. This step will fail if there are existing NULL values in that column.
  - Made the column `projectType` on table `CampaignCriteria` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Gender_new" AS ENUM ('MALE', 'FEMALE', 'ALL');
ALTER TABLE "Promoter" ALTER COLUMN "gender" TYPE "Gender_new" USING ("gender"::text::"Gender_new");
ALTER TABLE "CampaignCriteria" ALTER COLUMN "gender" TYPE "Gender_new" USING ("gender"::text::"Gender_new");
ALTER TYPE "Gender" RENAME TO "Gender_old";
ALTER TYPE "Gender_new" RENAME TO "Gender";
DROP TYPE "public"."Gender_old";
COMMIT;

-- AlterEnum
ALTER TYPE "PMESize" ADD VALUE 'very_small';

-- AlterEnum
ALTER TYPE "ProjectType" ADD VALUE 'ALL';

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "isNational" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "targetCountry" TEXT;

-- AlterTable
ALTER TABLE "CampaignCriteria" ALTER COLUMN "gender" SET NOT NULL,
ALTER COLUMN "projectType" SET NOT NULL;
