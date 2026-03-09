-- AlterTable
ALTER TABLE "CampaignCriteria" ADD COLUMN     "hasDisability" BOOLEAN;

-- CreateIndex
CREATE INDEX "Campaign_type_idx" ON "Campaign"("type");

-- CreateIndex
CREATE INDEX "Campaign_createdAt_idx" ON "Campaign"("createdAt");

-- CreateIndex
CREATE INDEX "CampaignCriteria_projectType_idx" ON "CampaignCriteria"("projectType");

-- CreateIndex
CREATE INDEX "CampaignCriteria_minAge_maxAge_idx" ON "CampaignCriteria"("minAge", "maxAge");

-- CreateIndex
CREATE INDEX "CampaignCriteria_campaignId_idx" ON "CampaignCriteria"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignCriteria_hasDisability_idx" ON "CampaignCriteria"("hasDisability");

-- CreateIndex
CREATE INDEX "CampaignCriteriaSector_sectorId_idx" ON "CampaignCriteriaSector"("sectorId");

-- CreateIndex
CREATE INDEX "CampaignCriteriaSector_criteriaId_idx" ON "CampaignCriteriaSector"("criteriaId");
