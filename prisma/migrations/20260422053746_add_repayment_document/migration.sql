-- DropForeignKey
ALTER TABLE "CreditRepayment" DROP CONSTRAINT "CreditRepayment_creditId_fkey";

-- AlterTable
ALTER TABLE "CreditRepayment" ADD COLUMN     "documentName" TEXT,
ADD COLUMN     "documentUrl" TEXT,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "size" INTEGER;

-- AddForeignKey
ALTER TABLE "CreditRepayment" ADD CONSTRAINT "CreditRepayment_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "ProjectCredit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
