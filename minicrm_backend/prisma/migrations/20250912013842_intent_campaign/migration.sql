/*
  Warnings:

  - The values [RETRYING] on the enum `DeliveryStatus` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `intent` to the `Campaign` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."DeliveryStatus_new" AS ENUM ('PENDING', 'SENT', 'FAILED');
ALTER TABLE "public"."Communication_log" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Communication_log" ALTER COLUMN "status" TYPE "public"."DeliveryStatus_new" USING ("status"::text::"public"."DeliveryStatus_new");
ALTER TYPE "public"."DeliveryStatus" RENAME TO "DeliveryStatus_old";
ALTER TYPE "public"."DeliveryStatus_new" RENAME TO "DeliveryStatus";
DROP TYPE "public"."DeliveryStatus_old";
ALTER TABLE "public"."Communication_log" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "public"."Campaign" ADD COLUMN     "intent" TEXT NOT NULL;
