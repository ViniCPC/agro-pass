-- AlterTable
ALTER TABLE "Cooperative" ADD COLUMN "inviteCode" TEXT;

UPDATE "Cooperative"
SET "inviteCode" = substr(md5("id"), 1, 12)
WHERE "inviteCode" IS NULL;

ALTER TABLE "Cooperative" ALTER COLUMN "inviteCode" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Cooperative_inviteCode_key" ON "Cooperative"("inviteCode");
