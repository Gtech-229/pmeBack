-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('INDIVIDUAL', 'COLLECTIVE');

-- CreateTable
CREATE TABLE "CampaignCriteria" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "gender" "Gender",
    "maritalStatus" "MaritalStatus",
    "projectType" "ProjectType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignCriteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sector" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignCriteriaSector" (
    "criteriaId" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,

    CONSTRAINT "CampaignCriteriaSector_pkey" PRIMARY KEY ("criteriaId","sectorId")
);

-- CreateIndex
CREATE UNIQUE INDEX "CampaignCriteria_campaignId_key" ON "CampaignCriteria"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "Sector_name_key" ON "Sector"("name");

-- AddForeignKey
ALTER TABLE "CampaignCriteria" ADD CONSTRAINT "CampaignCriteria_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignCriteriaSector" ADD CONSTRAINT "CampaignCriteriaSector_criteriaId_fkey" FOREIGN KEY ("criteriaId") REFERENCES "CampaignCriteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignCriteriaSector" ADD CONSTRAINT "CampaignCriteriaSector_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE CASCADE ON UPDATE CASCADE;
