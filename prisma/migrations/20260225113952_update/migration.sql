-- DropForeignKey
ALTER TABLE "Committee" DROP CONSTRAINT "Committee_stepId_fkey";

-- AlterTable
ALTER TABLE "Committee" ALTER COLUMN "stepId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Committee" ADD CONSTRAINT "Committee_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "CampaignStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;
