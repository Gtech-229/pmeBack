/*
  Warnings:

  - You are about to drop the column `fundDisbursementDates` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `fundedAmount` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "fundDisbursementDates",
DROP COLUMN "fundedAmount";

-- CreateTable
CREATE TABLE "FundDisbursement" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "plannedDate" TIMESTAMP(3) NOT NULL,
    "actualDate" TIMESTAMP(3),
    "isDisbursed" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "meetingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FundDisbursement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FundDisbursement_projectId_idx" ON "FundDisbursement"("projectId");

-- CreateIndex
CREATE INDEX "FundDisbursement_meetingId_idx" ON "FundDisbursement"("meetingId");

-- AddForeignKey
ALTER TABLE "FundDisbursement" ADD CONSTRAINT "FundDisbursement_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundDisbursement" ADD CONSTRAINT "FundDisbursement_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "CommitteeMeeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
