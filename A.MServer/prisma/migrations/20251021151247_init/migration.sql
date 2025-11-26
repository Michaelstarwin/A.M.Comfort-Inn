/*
  Warnings:

  - You are about to drop the `Admin` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Alert` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Purchase` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Recharge` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Setting` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StockLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Token` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Transaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "BookingPaymentStatus" AS ENUM ('Pending', 'Success', 'Failed', 'Refunded');

-- CreateEnum
CREATE TYPE "PaymentTransactionStatus" AS ENUM ('Received', 'Failed');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('Active', 'Inactive');

-- DropForeignKey
ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_productId_fkey";

-- DropForeignKey
ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_userId_fkey";

-- DropForeignKey
ALTER TABLE "Recharge" DROP CONSTRAINT "Recharge_rechargedBy_fkey";

-- DropForeignKey
ALTER TABLE "Recharge" DROP CONSTRAINT "Recharge_userId_fkey";

-- DropForeignKey
ALTER TABLE "StockLog" DROP CONSTRAINT "StockLog_changedBy_fkey";

-- DropForeignKey
ALTER TABLE "StockLog" DROP CONSTRAINT "StockLog_productId_fkey";

-- DropForeignKey
ALTER TABLE "Token" DROP CONSTRAINT "Token_purchaseId_fkey";

-- DropForeignKey
ALTER TABLE "Token" DROP CONSTRAINT "Token_userId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_userId_fkey";

-- DropTable
DROP TABLE "Admin";

-- DropTable
DROP TABLE "Alert";

-- DropTable
DROP TABLE "Product";

-- DropTable
DROP TABLE "Purchase";

-- DropTable
DROP TABLE "Recharge";

-- DropTable
DROP TABLE "Setting";

-- DropTable
DROP TABLE "StockLog";

-- DropTable
DROP TABLE "Token";

-- DropTable
DROP TABLE "Transaction";

-- DropTable
DROP TABLE "User";

-- DropEnum
DROP TYPE "AdminRole";

-- DropEnum
DROP TYPE "PaymentMethod";

-- DropEnum
DROP TYPE "TokenStatus";

-- DropEnum
DROP TYPE "TransactionType";

-- DropEnum
DROP TYPE "UserStatus";

-- DropEnum
DROP TYPE "UserType";

-- CreateTable
CREATE TABLE "RoomInventory" (
    "roomId" TEXT NOT NULL,
    "roomType" TEXT NOT NULL,
    "totalRooms" INTEGER NOT NULL,
    "currentRate" DOUBLE PRECISION NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomInventory_pkey" PRIMARY KEY ("roomId")
);

-- CreateTable
CREATE TABLE "Booking" (
    "bookingId" TEXT NOT NULL,
    "userId" TEXT,
    "guestInfo" JSONB,
    "checkInDate" TIMESTAMP(3) NOT NULL,
    "checkInTime" TEXT NOT NULL,
    "checkOutDate" TIMESTAMP(3) NOT NULL,
    "checkOutTime" TEXT NOT NULL,
    "roomCount" INTEGER NOT NULL,
    "roomType" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paymentStatus" "BookingPaymentStatus" NOT NULL DEFAULT 'Pending',
    "cashfreeOrderId" TEXT,
    "referenceNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "roomInventoryId" TEXT NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("bookingId")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "cashfreeOrderId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "transactionId" TEXT,
    "paymentMode" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PaymentTransactionStatus" NOT NULL,
    "gatewayResponsePayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("cashfreeOrderId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_cashfreeOrderId_key" ON "Booking"("cashfreeOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_referenceNumber_key" ON "Booking"("referenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_bookingId_key" ON "PaymentTransaction"("bookingId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_roomInventoryId_fkey" FOREIGN KEY ("roomInventoryId") REFERENCES "RoomInventory"("roomId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("bookingId") ON DELETE RESTRICT ON UPDATE CASCADE;
