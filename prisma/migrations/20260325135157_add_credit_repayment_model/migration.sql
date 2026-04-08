/*
  Warnings:

  - You are about to drop the column `dueDate` on the `ProjectCredit` table. All the data in the column will be lost.
  - Added the required column `durationMonths` to the `ProjectCredit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endDate` to the `ProjectCredit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `ProjectCredit` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CreditStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DEFAULTED', 'RESTRUCTURED');

-- AlterTable
ALTER TABLE "ProjectCredit" DROP COLUMN "dueDate",
ADD COLUMN     "durationMonths" INTEGER NOT NULL,
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" "CreditStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "CreditRepayment" (
    "id" TEXT NOT NULL,
    "creditId" TEXT NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "remainingAfter" DOUBLE PRECISION NOT NULL,
    "isLate" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditRepayment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CreditRepayment" ADD CONSTRAINT "CreditRepayment_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "ProjectCredit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
