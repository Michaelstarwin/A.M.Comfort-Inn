/*
  Warnings:

  - You are about to drop the column `cashfreeOrderId` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the `payment_transactions` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[paymentOrderId]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[paymentId]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."payment_transactions" DROP CONSTRAINT "payment_transactions_bookingId_fkey";

-- DropIndex
DROP INDEX "public"."bookings_cashfreeOrderId_key";

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "cashfreeOrderId",
ADD COLUMN     "paymentId" TEXT,
ADD COLUMN     "paymentOrderId" TEXT;

-- DropTable
DROP TABLE "public"."payment_transactions";

-- DropEnum
DROP TYPE "public"."PaymentTransactionStatus";

-- CreateIndex
CREATE UNIQUE INDEX "bookings_paymentOrderId_key" ON "bookings"("paymentOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_paymentId_key" ON "bookings"("paymentId");
