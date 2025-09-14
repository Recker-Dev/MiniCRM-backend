/*
  Warnings:

  - Added the required column `summary` to the `Campaign` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Campaign" ADD COLUMN     "summary" TEXT NOT NULL;
