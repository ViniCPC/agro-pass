ALTER TYPE "TraceEventType" ADD VALUE IF NOT EXISTS 'DOCUMENT_ATTACHED';
ALTER TYPE "TraceEventType" ADD VALUE IF NOT EXISTS 'CORRECTION';

ALTER TABLE "Document"
ADD COLUMN "originalName" TEXT,
ADD COLUMN "storageKey" TEXT,
ADD COLUMN "size" INTEGER,
ADD COLUMN "mimeType" TEXT,
ADD COLUMN "traceEventId" TEXT;

UPDATE "Document"
SET
  "originalName" = regexp_replace("fileUrl", '^.*/', ''),
  "storageKey" = 'legacy/' || "id",
  "size" = 0,
  "mimeType" = 'application/octet-stream';

UPDATE "Document" AS document
SET "traceEventId" = event."id"
FROM "TraceEvent" AS event
WHERE event."documentId" = document."id";

ALTER TABLE "Document"
ALTER COLUMN "originalName" SET NOT NULL,
ALTER COLUMN "storageKey" SET NOT NULL,
ALTER COLUMN "size" SET NOT NULL,
ALTER COLUMN "mimeType" SET NOT NULL;

CREATE UNIQUE INDEX "Document_storageKey_key" ON "Document"("storageKey");
CREATE INDEX "Document_traceEventId_idx" ON "Document"("traceEventId");

ALTER TABLE "TraceEvent"
ADD COLUMN "sequence" INTEGER,
ADD COLUMN "notes" TEXT,
ADD COLUMN "previousHash" TEXT,
ADD COLUMN "recordedById" TEXT,
ADD COLUMN "recordedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "correctedEventId" TEXT;

UPDATE "TraceEvent"
SET
  "notes" = "customStageName",
  "recordedById" = "userId",
  "recordedAt" = "createdAt";

INSERT INTO "User" (
  "id",
  "name",
  "email",
  "passwordHash",
  "role",
  "createdAt",
  "updatedAt"
)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'Sistema AgroPass',
  'sistema@agropass.invalid',
  '!system-account-disabled!',
  'ADMIN'::"UserRole",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE EXISTS (
  SELECT 1 FROM "TraceEvent" WHERE "recordedById" IS NULL
)
AND NOT EXISTS (
  SELECT 1 FROM "User" WHERE "id" = '00000000-0000-0000-0000-000000000001'
);

UPDATE "TraceEvent"
SET "recordedById" = '00000000-0000-0000-0000-000000000001'
WHERE "recordedById" IS NULL;

WITH numbered AS (
  SELECT
    "id",
    row_number() OVER (
      PARTITION BY "batchId"
      ORDER BY "createdAt", "id"
    ) AS number
  FROM "TraceEvent"
)
UPDATE "TraceEvent" AS event
SET "sequence" = numbered.number
FROM numbered
WHERE event."id" = numbered."id";

UPDATE "TraceEvent"
SET "eventHash" = md5("id" || ':' || "batchId") || md5("batchId" || ':' || "id")
WHERE "eventHash" IS NULL;

WITH chained AS (
  SELECT
    "id",
    lag("eventHash") OVER (
      PARTITION BY "batchId"
      ORDER BY "sequence"
    ) AS previous_hash
  FROM "TraceEvent"
)
UPDATE "TraceEvent" AS event
SET "previousHash" = chained.previous_hash
FROM chained
WHERE event."id" = chained."id";

WITH final_hash AS (
  SELECT DISTINCT ON ("batchId")
    "batchId",
    "eventHash"
  FROM "TraceEvent"
  ORDER BY "batchId", "sequence" DESC
)
UPDATE "Batch" AS batch
SET "integrityHash" = final_hash."eventHash"
FROM final_hash
WHERE batch."id" = final_hash."batchId";

ALTER TABLE "TraceEvent"
ALTER COLUMN "sequence" SET NOT NULL,
ALTER COLUMN "eventHash" SET NOT NULL,
ALTER COLUMN "recordedById" SET NOT NULL,
ALTER COLUMN "recordedAt" SET NOT NULL;

ALTER TABLE "TraceEvent" DROP CONSTRAINT IF EXISTS "TraceEvent_cooperativeId_fkey";
ALTER TABLE "TraceEvent" DROP CONSTRAINT IF EXISTS "TraceEvent_exporterId_fkey";
ALTER TABLE "TraceEvent" DROP CONSTRAINT IF EXISTS "TraceEvent_documentId_fkey";
ALTER TABLE "TraceEvent" DROP CONSTRAINT IF EXISTS "TraceEvent_userId_fkey";
DROP INDEX IF EXISTS "TraceEvent_documentId_key";
DROP INDEX IF EXISTS "TraceEvent_userId_idx";

ALTER TABLE "TraceEvent"
DROP COLUMN "actorName",
DROP COLUMN "cooperativeId",
DROP COLUMN "exporterId",
DROP COLUMN "customStageName",
DROP COLUMN "documentId",
DROP COLUMN "userId",
DROP COLUMN "createdAt";

CREATE UNIQUE INDEX "TraceEvent_batchId_sequence_key"
ON "TraceEvent"("batchId", "sequence");
CREATE INDEX "TraceEvent_recordedById_idx" ON "TraceEvent"("recordedById");
CREATE INDEX "TraceEvent_correctedEventId_idx" ON "TraceEvent"("correctedEventId");

ALTER TABLE "TraceEvent"
ADD CONSTRAINT "TraceEvent_recordedById_fkey"
FOREIGN KEY ("recordedById") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TraceEvent"
ADD CONSTRAINT "TraceEvent_correctedEventId_fkey"
FOREIGN KEY ("correctedEventId") REFERENCES "TraceEvent"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Document"
ADD CONSTRAINT "Document_traceEventId_fkey"
FOREIGN KEY ("traceEventId") REFERENCES "TraceEvent"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
