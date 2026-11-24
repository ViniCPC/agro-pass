-- Demonstration requests sent from the landing page.
CREATE TYPE "DemoRequestProfile" AS ENUM ('PRODUCER', 'COOPERATIVE', 'CARRIER', 'BUYER');

CREATE TABLE "DemoRequest" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "profile" "DemoRequestProfile" NOT NULL,
  "consentAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DemoRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DemoRequest_createdAt_idx" ON "DemoRequest"("createdAt");
