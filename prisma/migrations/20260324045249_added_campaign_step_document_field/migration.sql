-- CreateTable
CREATE TABLE "CampaignStepDocument" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignStepDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CampaignStepDocument_stepId_idx" ON "CampaignStepDocument"("stepId");

-- AddForeignKey
ALTER TABLE "CampaignStepDocument" ADD CONSTRAINT "CampaignStepDocument_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "CampaignStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
