/*
  Warnings:

  - You are about to drop the column `userRole` on the `PME` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "CampaignStep" DROP CONSTRAINT "CampaignStep_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "Committee" DROP CONSTRAINT "Committee_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_campaignId_fkey";

-- AlterTable
ALTER TABLE "PME" DROP COLUMN "userRole";

-- CreateTable
CREATE TABLE "Promoter" (
    "id" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "gender" "Gender",
    "birthDate" TIMESTAMP(3),
    "hasDisability" BOOLEAN NOT NULL DEFAULT false,
    "disabilityType" TEXT,
    "maritalStatus" "MaritalStatus",
    "role" TEXT,
    "userId" TEXT NOT NULL,
    "pmeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promoter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Promoter_userId_key" ON "Promoter"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Promoter_pmeId_key" ON "Promoter"("pmeId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promoter" ADD CONSTRAINT "Promoter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promoter" ADD CONSTRAINT "Promoter_pmeId_fkey" FOREIGN KEY ("pmeId") REFERENCES "PME"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignStep" ADD CONSTRAINT "CampaignStep_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Committee" ADD CONSTRAINT "Committee_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
