/*
  Warnings:

  - You are about to drop the column `submissionDate` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the `SubStep` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ProjectValidators` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_SubStepValidators` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "StepStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "SubStep" DROP CONSTRAINT "SubStep_projectId_fkey";

-- DropForeignKey
ALTER TABLE "_ProjectValidators" DROP CONSTRAINT "_ProjectValidators_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProjectValidators" DROP CONSTRAINT "_ProjectValidators_B_fkey";

-- DropForeignKey
ALTER TABLE "_SubStepValidators" DROP CONSTRAINT "_SubStepValidators_A_fkey";

-- DropForeignKey
ALTER TABLE "_SubStepValidators" DROP CONSTRAINT "_SubStepValidators_B_fkey";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "submissionDate";

-- DropTable
DROP TABLE "SubStep";

-- DropTable
DROP TABLE "_ProjectValidators";

-- DropTable
DROP TABLE "_SubStepValidators";

-- DropEnum
DROP TYPE "SubStepState";

-- CreateTable
CREATE TABLE "ProjectStepProgress" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "campaignStepId" TEXT NOT NULL,
    "status" "StepStatus" NOT NULL DEFAULT 'PENDING',
    "validatedAt" TIMESTAMP(3),
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectStepProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectStepProgress_status_idx" ON "ProjectStepProgress"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectStepProgress_projectId_campaignStepId_key" ON "ProjectStepProgress"("projectId", "campaignStepId");

-- AddForeignKey
ALTER TABLE "ProjectStepProgress" ADD CONSTRAINT "ProjectStepProgress_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectStepProgress" ADD CONSTRAINT "ProjectStepProgress_campaignStepId_fkey" FOREIGN KEY ("campaignStepId") REFERENCES "CampaignStep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
