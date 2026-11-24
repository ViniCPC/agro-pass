-- Add the digital passport fields before converting existing data.
ALTER TABLE "Batch"
ADD COLUMN "publicCode" TEXT,
ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "integrityHash" TEXT,
ADD COLUMN "tokenAddress" TEXT,
ADD COLUMN "tokenizedAt" TIMESTAMP(3),
ADD COLUMN "closedAt" TIMESTAMP(3);

UPDATE "Batch"
SET
  "tokenAddress" = "cnftAddress",
  "tokenizedAt" = CASE
    WHEN "cnftAddress" IS NOT NULL OR "mintTxHash" IS NOT NULL THEN "updatedAt"
    ELSE NULL
  END;

-- Normalize every existing internal code to AGP-YYYY-NNNN.
UPDATE "Batch" SET "code" = 'TMP-' || "id";

WITH ranked_batches AS (
  SELECT
    "id",
    COALESCE(EXTRACT(YEAR FROM "harvestDate"), EXTRACT(YEAR FROM "createdAt"))::INTEGER AS batch_year,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(EXTRACT(YEAR FROM "harvestDate"), EXTRACT(YEAR FROM "createdAt"))
      ORDER BY "createdAt", "id"
    ) AS sequence
  FROM "Batch"
)
UPDATE "Batch" AS batch
SET "code" =
  'AGP-' || ranked.batch_year || '-' || LPAD(ranked.sequence::TEXT, 4, '0')
FROM ranked_batches AS ranked
WHERE batch."id" = ranked."id";

UPDATE "Batch" SET "publicCode" = "code";
ALTER TABLE "Batch" ALTER COLUMN "publicCode" SET NOT NULL;
CREATE UNIQUE INDEX "Batch_publicCode_key" ON "Batch"("publicCode");

DROP INDEX IF EXISTS "Batch_cnftAddress_key";
ALTER TABLE "Batch"
DROP COLUMN "cnftAddress",
DROP COLUMN "merkleTree",
DROP COLUMN "metadataUri",
DROP COLUMN "qrCodeUrl",
DROP COLUMN "mintTxHash";

-- Convert legacy technical statuses into the passport lifecycle.
ALTER TABLE "Batch" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Batch" ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;

UPDATE "Batch"
SET "status" = CASE "status"
  WHEN 'VERIFIED' THEN 'HARVESTED'
  WHEN 'MINTED' THEN 'HARVESTED'
  WHEN 'EXPORTED' THEN 'DELIVERED'
  ELSE "status"
END;

DROP TYPE "BatchStatus";
CREATE TYPE "BatchStatus" AS ENUM (
  'CREATED',
  'HARVESTED',
  'RECEIVED',
  'IN_TRANSIT',
  'PROCESSED',
  'DELIVERED',
  'CLOSED',
  'CANCELLED'
);

ALTER TABLE "Batch"
ALTER COLUMN "status" TYPE "BatchStatus" USING "status"::"BatchStatus",
ALTER COLUMN "status" SET DEFAULT 'CREATED';

-- Keep timeline event names aligned with the lifecycle.
ALTER TABLE "TraceEvent" ALTER COLUMN "type" TYPE TEXT USING "type"::TEXT;

UPDATE "TraceEvent"
SET "type" = CASE "type"
  WHEN 'RECEIVED_BY_COOPERATIVE' THEN 'RECEIVED'
  WHEN 'TRANSPORTED' THEN 'IN_TRANSIT'
  WHEN 'EXPORTED' THEN 'DELIVERED'
  ELSE "type"
END;

DROP TYPE "TraceEventType";
CREATE TYPE "TraceEventType" AS ENUM (
  'CREATED',
  'HARVESTED',
  'RECEIVED',
  'IN_TRANSIT',
  'PROCESSED',
  'DELIVERED',
  'CLOSED',
  'CANCELLED',
  'MINTED_ONCHAIN'
);

ALTER TABLE "TraceEvent"
ALTER COLUMN "type" TYPE "TraceEventType" USING "type"::"TraceEventType";
