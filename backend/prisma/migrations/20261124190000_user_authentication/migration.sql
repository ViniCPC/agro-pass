CREATE TYPE "UserRole" AS ENUM (
  'PRODUCER',
  'COOPERATIVE',
  'OPERATOR',
  'ADMIN'
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "producerId" TEXT,
  "cooperativeId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_producerId_key" ON "User"("producerId");
CREATE UNIQUE INDEX "User_cooperativeId_key" ON "User"("cooperativeId");

ALTER TABLE "User"
ADD CONSTRAINT "User_producerId_fkey"
FOREIGN KEY ("producerId") REFERENCES "Producer"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "User"
ADD CONSTRAINT "User_cooperativeId_fkey"
FOREIGN KEY ("cooperativeId") REFERENCES "Cooperative"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TraceEvent" ADD COLUMN "userId" TEXT;
CREATE INDEX "TraceEvent_userId_idx" ON "TraceEvent"("userId");

ALTER TABLE "TraceEvent"
ADD CONSTRAINT "TraceEvent_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
