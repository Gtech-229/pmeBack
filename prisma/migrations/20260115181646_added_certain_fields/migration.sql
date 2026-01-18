/*
  Warnings:

  - Changed the type of `type` on the `PME` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PMEType" AS ENUM ('non_profit', 'for_profit');

-- AlterEnum
ALTER TYPE "ProjectStatus" ADD VALUE 'suspended';

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_pmeId_fkey";

-- AlterTable
ALTER TABLE "PME" DROP COLUMN "type",
ADD COLUMN     "type" "PMEType" NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "credit" DOUBLE PRECISION;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_pmeId_fkey" FOREIGN KEY ("pmeId") REFERENCES "PME"("id") ON DELETE CASCADE ON UPDATE CASCADE;
