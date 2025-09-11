/*
  Warnings:

  - You are about to drop the column `attempts` on the `Communication_log` table. All the data in the column will be lost.
  - You are about to drop the column `last_attempt_at` on the `Communication_log` table. All the data in the column will be lost.
  - You are about to drop the column `provider_messageId` on the `Communication_log` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Communication_log" DROP COLUMN "attempts",
DROP COLUMN "last_attempt_at",
DROP COLUMN "provider_messageId";
