
CREATE EXTENSION IF NOT EXISTS pg_trgm;


-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_firstName_lastName_createdAt_idx" ON "User"("firstName", "lastName", "createdAt");



CREATE INDEX users_firstname_trgm ON "User" USING gin ("firstName" gin_trgm_ops);
CREATE INDEX users_lastname_trgm ON "User" USING gin ("lastName" gin_trgm_ops);
CREATE INDEX users_email_trgm ON "User" USING gin ("email" gin_trgm_ops);


-- DropForeignKey
ALTER TABLE "Committee" DROP CONSTRAINT "Committee_stepId_fkey";
-- DropIndex
DROP INDEX "CampaignStep_campaignId_setsProjectStatus_idx";
-- DropIndex
DROP INDEX "CampaignStep_campaignId_order_idx";
-- AddForeignKey
ALTER TABLE "Committee" ADD CONSTRAINT "Committee_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "CampaignStep"("id") ON DELETE SET DEFAULT ON UPDATE CASCADE;



