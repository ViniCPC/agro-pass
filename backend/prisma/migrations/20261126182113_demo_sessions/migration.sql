-- AlterTable
ALTER TABLE "Cooperative" ADD COLUMN     "demoSessionId" TEXT;

-- AlterTable
ALTER TABLE "Producer" ADD COLUMN     "demoSessionId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "demoSessionId" TEXT;

-- CreateTable
CREATE TABLE "DemoSession" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemoSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DemoSession_expiresAt_idx" ON "DemoSession"("expiresAt");

-- CreateIndex
CREATE INDEX "Cooperative_demoSessionId_idx" ON "Cooperative"("demoSessionId");

-- CreateIndex
CREATE INDEX "Producer_demoSessionId_idx" ON "Producer"("demoSessionId");

-- CreateIndex
CREATE INDEX "User_demoSessionId_idx" ON "User"("demoSessionId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_demoSessionId_fkey" FOREIGN KEY ("demoSessionId") REFERENCES "DemoSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producer" ADD CONSTRAINT "Producer_demoSessionId_fkey" FOREIGN KEY ("demoSessionId") REFERENCES "DemoSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cooperative" ADD CONSTRAINT "Cooperative_demoSessionId_fkey" FOREIGN KEY ("demoSessionId") REFERENCES "DemoSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
