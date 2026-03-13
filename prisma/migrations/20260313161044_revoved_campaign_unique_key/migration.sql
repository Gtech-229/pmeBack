-- DropIndex
DROP INDEX "Project_campaignId_pmeId_key";

-- CreateIndex
CREATE INDEX "Project_campaignId_pmeId_idx" ON "Project"("campaignId", "pmeId");
