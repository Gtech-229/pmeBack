/*
  Warnings:

  - You are about to drop the column `meetingId` on the `FundDisbursement` table. All the data in the column will be lost.
  - Added the required column `decisionId` to the `FundDisbursement` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "FundDisbursement" DROP CONSTRAINT "FundDisbursement_meetingId_fkey";

-- DropIndex
DROP INDEX "FundDisbursement_meetingId_idx";

-- AlterTable
ALTER TABLE "FundDisbursement" DROP COLUMN "meetingId",
ADD COLUMN     "decisionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MeetingProjectDecision" ADD COLUMN     "tranchesPayload" JSONB;

-- CreateIndex
CREATE INDEX "FundDisbursement_decisionId_idx" ON "FundDisbursement"("decisionId");

-- AddForeignKey
ALTER TABLE "FundDisbursement" ADD CONSTRAINT "FundDisbursement_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "MeetingProjectDecision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
