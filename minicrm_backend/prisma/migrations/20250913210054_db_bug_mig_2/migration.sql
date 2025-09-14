/*
  Warnings:

  - You are about to drop the column `avatart` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "avatart",
ADD COLUMN     "avatar" TEXT,
ALTER COLUMN "id" SET DEFAULT concat('user_', replace(cast(gen_random_uuid() as text), '-', ''));
