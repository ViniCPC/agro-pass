-- AlterTable
ALTER TABLE "Farm" ADD COLUMN "carRawJson" JSONB;

-- CreateTable
CREATE TABLE "CarDraft" (
  "id" TEXT NOT NULL,
  "telegramUserId" TEXT NOT NULL,
  "carData" JSONB NOT NULL,
  "imageUrl" TEXT,
  "imageFileHash" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CarDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CarDraft_telegramUserId_key" ON "CarDraft"("telegramUserId");

-- CreateIndex
CREATE INDEX "CarDraft_expiresAt_idx" ON "CarDraft"("expiresAt");
