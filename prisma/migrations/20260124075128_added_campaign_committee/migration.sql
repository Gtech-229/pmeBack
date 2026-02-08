-- CreateTable
CREATE TABLE "CampaignCommittee" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "committeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignCommittee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CampaignCommittee_campaignId_committeeId_key" ON "CampaignCommittee"("campaignId", "committeeId");

-- AddForeignKey
ALTER TABLE "CampaignCommittee" ADD CONSTRAINT "CampaignCommittee_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignCommittee" ADD CONSTRAINT "CampaignCommittee_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "Committee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
