/*
  Warnings:

  - Added the required column `size` to the `ReportDocument` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ReportDocument" ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "size" INTEGER NOT NULL;
