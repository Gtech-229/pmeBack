-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('MULTI_PROJECT', 'MONO_PROJECT');

-- DropIndex
DROP INDEX "users_email_trgm";

-- DropIndex
DROP INDEX "users_firstname_trgm";

-- DropIndex
DROP INDEX "users_lastname_trgm";

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "type" "CampaignType" NOT NULL DEFAULT 'MONO_PROJECT';
