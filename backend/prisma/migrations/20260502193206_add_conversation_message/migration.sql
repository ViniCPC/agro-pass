-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'MODEL');

-- CreateTable
CREATE TABLE "ConversationMessage" (
    "id" TEXT NOT NULL,
    "telegramUserId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConversationMessage_telegramUserId_createdAt_idx" ON "ConversationMessage"("telegramUserId", "createdAt");
