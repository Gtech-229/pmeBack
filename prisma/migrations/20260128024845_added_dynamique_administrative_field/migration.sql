/*
  Warnings:

  - You are about to drop the column `credit` on the `Project` table. All the data in the column will be lost.
  - Added the required column `activityField` to the `PME` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PME" ADD COLUMN     "activityField" TEXT NOT NULL,
ADD COLUMN     "administrative" JSONB,
ALTER COLUMN "city" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "credit";

-- CreateTable
CREATE TABLE "ProjectCredit" (
    "id" TEXT NOT NULL,
    "borrower" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "interestRate" DOUBLE PRECISION NOT NULL,
    "monthlyPayment" DOUBLE PRECISION NOT NULL,
    "remainingBalance" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectCredit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectCredit_projectId_idx" ON "ProjectCredit"("projectId");

-- AddForeignKey
ALTER TABLE "ProjectCredit" ADD CONSTRAINT "ProjectCredit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
