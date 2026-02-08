/*
  Warnings:

  - You are about to drop the `CampaignCommittee` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[stepId]` on the table `Committee` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[campaignId]` on the table `Committee` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[campaignId,pmeId]` on the table `Project` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `campaignId` to the `Committee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stepId` to the `Committee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `campaignId` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CampaignCommittee" DROP CONSTRAINT "CampaignCommittee_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "CampaignCommittee" DROP CONSTRAINT "CampaignCommittee_committeeId_fkey";

-- AlterTable
ALTER TABLE "Committee" ADD COLUMN     "campaignId" TEXT NOT NULL,
ADD COLUMN     "stepId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "campaignId" TEXT NOT NULL;

-- DropTable
DROP TABLE "CampaignCommittee";

-- CreateTable
CREATE TABLE "CampaignStep" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CampaignStep_campaignId_order_key" ON "CampaignStep"("campaignId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Committee_stepId_key" ON "Committee"("stepId");

-- CreateIndex
CREATE UNIQUE INDEX "Committee_campaignId_key" ON "Committee"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_campaignId_pmeId_key" ON "Project"("campaignId", "pmeId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignStep" ADD CONSTRAINT "CampaignStep_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Committee" ADD CONSTRAINT "Committee_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Committee" ADD CONSTRAINT "Committee_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "CampaignStep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
