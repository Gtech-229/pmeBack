/*
  Warnings:

  - Added the required column `hasCredit` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "hasCredit" BOOLEAN NOT NULL;
