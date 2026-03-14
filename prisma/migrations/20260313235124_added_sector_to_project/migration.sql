/*
  Warnings:

  - You are about to drop the column `activityField` on the `PME` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PME" DROP COLUMN "activityField";

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "sectorId" TEXT;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE SET NULL ON UPDATE CASCADE;
