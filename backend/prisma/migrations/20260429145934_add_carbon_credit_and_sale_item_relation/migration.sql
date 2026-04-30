/*
  Warnings:

  - A unique constraint covering the columns `[cnftAddress]` on the table `Batch` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[carNumber]` on the table `Farm` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[telegramUserId]` on the table `Producer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[walletAddress]` on the table `Producer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Batch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Farm` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Producer` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Biome" AS ENUM ('AMAZON', 'CERRADO', 'ATLANTIC_FOREST', 'CAATINGA', 'PAMPA', 'PANTANAL');

-- CreateEnum
CREATE TYPE "CarbonCreditStatus" AS ENUM ('ISSUED', 'AVAILABLE', 'RESERVED', 'SOLD', 'RETIRED');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('PENDING', 'PAID', 'DELIVERED', 'CANCELLED', 'REFUNDED');

-- AlterEnum
ALTER TYPE "BatchStatus" ADD VALUE 'SOLD';

-- AlterEnum
ALTER TYPE "DocumentType" ADD VALUE 'SATELLITE_IMAGE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProductType" ADD VALUE 'COCOA';
ALTER TYPE "ProductType" ADD VALUE 'PALM_OIL';
ALTER TYPE "ProductType" ADD VALUE 'RUBBER';
ALTER TYPE "ProductType" ADD VALUE 'WOOD';

-- AlterEnum
ALTER TYPE "TraceEventType" ADD VALUE 'SOLD';

-- AlterTable
ALTER TABLE "Batch" ADD COLUMN     "merkleTree" TEXT,
ADD COLUMN     "mintTxHash" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "farmId" TEXT;

-- AlterTable
ALTER TABLE "Farm" ADD COLUMN     "appAreaHa" DOUBLE PRECISION,
ADD COLUMN     "biome" "Biome",
ADD COLUMN     "consolidatedAreaHa" DOUBLE PRECISION,
ADD COLUMN     "eudrEvidenceUrl" TEXT,
ADD COLUMN     "isAmazonLegal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isEudrCompliant" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "legalReserveAreaHa" DOUBLE PRECISION,
ADD COLUMN     "preservedSurplusHa" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "totalAreaHa" DOUBLE PRECISION,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "validatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Producer" ADD COLUMN     "reputationScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "telegramUserId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "walletAddress" TEXT;

-- AlterTable
ALTER TABLE "TraceEvent" ADD COLUMN     "cooperativeId" TEXT,
ADD COLUMN     "eventHash" TEXT,
ADD COLUMN     "exporterId" TEXT;

-- CreateTable
CREATE TABLE "Cooperative" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "walletAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cooperative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exporter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "walletAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exporter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarbonCredit" (
    "id" TEXT NOT NULL,
    "hectares" DOUBLE PRECISION NOT NULL,
    "tonnesCo2e" DOUBLE PRECISION NOT NULL,
    "factor" DOUBLE PRECISION NOT NULL,
    "vintage" INTEGER NOT NULL,
    "tokenMint" TEXT,
    "amountMinted" BIGINT NOT NULL DEFAULT 0,
    "status" "CarbonCreditStatus" NOT NULL DEFAULT 'ISSUED',
    "pricePerTonneUsd" DOUBLE PRECISION DEFAULT 15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "farmId" TEXT NOT NULL,
    "producerId" TEXT NOT NULL,

    CONSTRAINT "CarbonCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "totalUsd" DOUBLE PRECISION NOT NULL,
    "paymentTxHash" TEXT,
    "paymentTokenMint" TEXT,
    "status" "SaleStatus" NOT NULL DEFAULT 'PENDING',
    "buyerWallet" TEXT NOT NULL,
    "buyerEmail" TEXT,
    "buyerCountry" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "exporterId" TEXT NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "batchId" TEXT,
    "carbonCreditId" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPriceUsd" DOUBLE PRECISION NOT NULL,
    "totalUsd" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cooperative_document_key" ON "Cooperative"("document");

-- CreateIndex
CREATE UNIQUE INDEX "Cooperative_walletAddress_key" ON "Cooperative"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Exporter_document_key" ON "Exporter"("document");

-- CreateIndex
CREATE UNIQUE INDEX "Exporter_email_key" ON "Exporter"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Exporter_walletAddress_key" ON "Exporter"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "CarbonCredit_tokenMint_key" ON "CarbonCredit"("tokenMint");

-- CreateIndex
CREATE INDEX "CarbonCredit_farmId_idx" ON "CarbonCredit"("farmId");

-- CreateIndex
CREATE INDEX "CarbonCredit_status_idx" ON "CarbonCredit"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_paymentTxHash_key" ON "Sale"("paymentTxHash");

-- CreateIndex
CREATE INDEX "Sale_exporterId_idx" ON "Sale"("exporterId");

-- CreateIndex
CREATE INDEX "Sale_status_idx" ON "Sale"("status");

-- CreateIndex
CREATE INDEX "SaleItem_saleId_idx" ON "SaleItem"("saleId");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_cnftAddress_key" ON "Batch"("cnftAddress");

-- CreateIndex
CREATE INDEX "Batch_farmId_idx" ON "Batch"("farmId");

-- CreateIndex
CREATE INDEX "Batch_status_idx" ON "Batch"("status");

-- CreateIndex
CREATE INDEX "Batch_productType_idx" ON "Batch"("productType");

-- CreateIndex
CREATE INDEX "Document_farmId_idx" ON "Document"("farmId");

-- CreateIndex
CREATE INDEX "Document_batchId_idx" ON "Document"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "Farm_carNumber_key" ON "Farm"("carNumber");

-- CreateIndex
CREATE INDEX "Farm_producerId_idx" ON "Farm"("producerId");

-- CreateIndex
CREATE INDEX "Farm_state_idx" ON "Farm"("state");

-- CreateIndex
CREATE UNIQUE INDEX "Producer_telegramUserId_key" ON "Producer"("telegramUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Producer_walletAddress_key" ON "Producer"("walletAddress");

-- CreateIndex
CREATE INDEX "Producer_telegramUserId_idx" ON "Producer"("telegramUserId");

-- CreateIndex
CREATE INDEX "TraceEvent_batchId_idx" ON "TraceEvent"("batchId");

-- CreateIndex
CREATE INDEX "TraceEvent_type_idx" ON "TraceEvent"("type");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TraceEvent" ADD CONSTRAINT "TraceEvent_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES "Cooperative"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TraceEvent" ADD CONSTRAINT "TraceEvent_exporterId_fkey" FOREIGN KEY ("exporterId") REFERENCES "Exporter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarbonCredit" ADD CONSTRAINT "CarbonCredit_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarbonCredit" ADD CONSTRAINT "CarbonCredit_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "Producer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_exporterId_fkey" FOREIGN KEY ("exporterId") REFERENCES "Exporter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_carbonCreditId_fkey" FOREIGN KEY ("carbonCreditId") REFERENCES "CarbonCredit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
