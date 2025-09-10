-- AlterTable
ALTER TABLE "public"."Customer" ADD COLUMN     "city" TEXT,
ADD COLUMN     "last_seen" TIMESTAMP(3),
ADD COLUMN     "total_spend" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "visit" INTEGER NOT NULL DEFAULT 0;
