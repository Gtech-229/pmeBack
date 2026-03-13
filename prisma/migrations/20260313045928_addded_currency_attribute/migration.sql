/*
  Warnings:

  - Added the required column `currency` to the `PME` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PME" ADD COLUMN     "currency" TEXT NOT NULL;
