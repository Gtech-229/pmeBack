-- AlterEnum
ALTER TYPE "PMEType" ADD VALUE 'ong';

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "targetProjects" INTEGER;
