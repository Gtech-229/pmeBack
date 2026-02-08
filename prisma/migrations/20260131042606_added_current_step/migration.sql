-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "currentStepOrder" INTEGER;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "isActive" SET DEFAULT true;
