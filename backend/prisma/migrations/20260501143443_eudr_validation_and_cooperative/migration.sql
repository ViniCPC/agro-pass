/*
  Warnings:

  - The values [SOLD] on the enum `BatchStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [SOLD] on the enum `TraceEventType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `eudrEvidenceUrl` on the `Farm` table. All the data in the column will be lost.
  - You are about to drop the column `isEudrCompliant` on the `Farm` table. All the data in the column will be lost.
  - You are about to drop the column `preservedSurplusHa` on the `Farm` table. All the data in the column will be lost.
  - You are about to drop the column `validatedAt` on the `Farm` table. All the data in the column will be lost.
  - You are about to drop the `CarbonCredit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Sale` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SaleItem` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Cooperative` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[lastValidationId]` on the table `Farm` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `Producer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Cooperative` table without a default value. This is not possible if the table is not empty.
  - Made the column `document` on table `Producer` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('PENDING', 'COMPLIANT', 'NON_COMPLIANT', 'NEEDS_REVIEW', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CooperativePlan" AS ENUM ('BASIC', 'PRO', 'ENTERPRISE');

-- AlterEnum
BEGIN;
CREATE TYPE "BatchStatus_new" AS ENUM ('CREATED', 'VERIFIED', 'MINTED', 'IN_TRANSIT', 'EXPORTED');
ALTER TABLE "public"."Batch" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Batch" ALTER COLUMN "status" TYPE "BatchStatus_new" USING ("status"::text::"BatchStatus_new");
ALTER TYPE "BatchStatus" RENAME TO "BatchStatus_old";
ALTER TYPE "BatchStatus_new" RENAME TO "BatchStatus";
DROP TYPE "public"."BatchStatus_old";
ALTER TABLE "Batch" ALTER COLUMN "status" SET DEFAULT 'CREATED';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TraceEventType_new" AS ENUM ('CREATED', 'HARVESTED', 'RECEIVED_BY_COOPERATIVE', 'TRANSPORTED', 'PROCESSED', 'EXPORTED', 'MINTED_ONCHAIN', 'EUDR_VALIDATED');
ALTER TABLE "TraceEvent" ALTER COLUMN "type" TYPE "TraceEventType_new" USING ("type"::text::"TraceEventType_new");
ALTER TYPE "TraceEventType" RENAME TO "TraceEventType_old";
ALTER TYPE "TraceEventType_new" RENAME TO "TraceEventType";
DROP TYPE "public"."TraceEventType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "CarbonCredit" DROP CONSTRAINT "CarbonCredit_farmId_fkey";

-- DropForeignKey
ALTER TABLE "CarbonCredit" DROP CONSTRAINT "CarbonCredit_producerId_fkey";

-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_exporterId_fkey";

-- DropForeignKey
ALTER TABLE "SaleItem" DROP CONSTRAINT "SaleItem_batchId_fkey";

-- DropForeignKey
ALTER TABLE "SaleItem" DROP CONSTRAINT "SaleItem_carbonCreditId_fkey";

-- DropForeignKey
ALTER TABLE "SaleItem" DROP CONSTRAINT "SaleItem_saleId_fkey";

-- DropIndex
DROP INDEX "Batch_productType_idx";

-- AlterTable
ALTER TABLE "Cooperative" ADD COLUMN     "contractedAt" TIMESTAMP(3),
ADD COLUMN     "monthlyFee" DOUBLE PRECISION,
ADD COLUMN     "plan" "CooperativePlan" NOT NULL DEFAULT 'BASIC',
ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Farm" DROP COLUMN "eudrEvidenceUrl",
DROP COLUMN "isEudrCompliant",
DROP COLUMN "preservedSurplusHa",
DROP COLUMN "validatedAt",
ADD COLUMN     "lastValidationId" TEXT,
ADD COLUMN     "polygonGeoJson" JSONB;

-- AlterTable
ALTER TABLE "Producer" ADD COLUMN     "cooperativeId" TEXT,
ALTER COLUMN "document" SET NOT NULL;

-- DropTable
DROP TABLE "CarbonCredit";

-- DropTable
DROP TABLE "Sale";

-- DropTable
DROP TABLE "SaleItem";

-- DropEnum
DROP TYPE "CarbonCreditStatus";

-- DropEnum
DROP TYPE "SaleStatus";

-- CreateTable
CREATE TABLE "EudrValidation" (
    "id" TEXT NOT NULL,
    "status" "ValidationStatus" NOT NULL,
    "cutoffDate" TIMESTAMP(3) NOT NULL DEFAULT '2020-12-31 00:00:00 +00:00',
    "hectaresDeforested" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mapBiomasResult" JSONB,
    "prodesResult" JSONB,
    "hansenResult" JSONB,
    "satelliteImageBeforeUrl" TEXT,
    "satelliteImageAfterUrl" TEXT,
    "ndviBefore" DOUBLE PRECISION,
    "ndviAfter" DOUBLE PRECISION,
    "evidenceHash" TEXT NOT NULL,
    "validatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "farmId" TEXT NOT NULL,

    CONSTRAINT "EudrValidation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EudrValidation_farmId_idx" ON "EudrValidation"("farmId");

-- CreateIndex
CREATE INDEX "EudrValidation_status_idx" ON "EudrValidation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Cooperative_slug_key" ON "Cooperative"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Farm_lastValidationId_key" ON "Farm"("lastValidationId");

-- CreateIndex
CREATE UNIQUE INDEX "Producer_phone_key" ON "Producer"("phone");

-- CreateIndex
CREATE INDEX "Producer_cooperativeId_idx" ON "Producer"("cooperativeId");

-- CreateIndex
CREATE INDEX "Producer_document_idx" ON "Producer"("document");

-- AddForeignKey
ALTER TABLE "Producer" ADD CONSTRAINT "Producer_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES "Cooperative"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farm" ADD CONSTRAINT "Farm_lastValidationId_fkey" FOREIGN KEY ("lastValidationId") REFERENCES "EudrValidation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EudrValidation" ADD CONSTRAINT "EudrValidation_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
