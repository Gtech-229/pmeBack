/*
  Warnings:

  - A unique constraint covering the columns `[campaignId,setsProjectStatus]` on the table `CampaignStep` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "CampaignStep_campaignId_idx" ON "CampaignStep"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignStep_campaignId_order_idx" ON "CampaignStep"("campaignId", "order");

-- CreateIndex
CREATE INDEX "CampaignStep_campaignId_setsProjectStatus_idx" ON "CampaignStep"("campaignId", "setsProjectStatus");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignStep_campaignId_setsProjectStatus_key" ON "CampaignStep"("campaignId", "setsProjectStatus");
