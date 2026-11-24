-- Remove records whose enum values are being retired.
UPDATE "TraceEvent"
SET "documentId" = NULL
WHERE "documentId" IN (
  SELECT "id"
  FROM "Document"
  WHERE "type"::text IN ('ENVIRONMENTAL_REPORT', 'SATELLITE_IMAGE')
);

DELETE FROM "TraceEvent"
WHERE "type"::text = 'EUDR_VALIDATED';

DELETE FROM "Document"
WHERE "type"::text IN ('ENVIRONMENTAL_REPORT', 'SATELLITE_IMAGE');

-- Remove environmental validation data and Telegram/AI persistence.
ALTER TABLE "Farm" DROP CONSTRAINT "Farm_lastValidationId_fkey";

DROP TABLE "EudrValidation";
DROP TABLE "ConversationMessage";
DROP TABLE "CarDraft";

ALTER TABLE "Farm"
  DROP COLUMN "appAreaHa",
  DROP COLUMN "biome",
  DROP COLUMN "carRawJson",
  DROP COLUMN "consolidatedAreaHa",
  DROP COLUMN "demoCode",
  DROP COLUMN "isAmazonLegal",
  DROP COLUMN "lastValidatedAt",
  DROP COLUMN "lastValidationHash",
  DROP COLUMN "lastValidationId",
  DROP COLUMN "lastValidationStatus",
  DROP COLUMN "legalReserveAreaHa",
  DROP COLUMN "status";

ALTER TABLE "Producer" DROP COLUMN "telegramUserId";
ALTER TABLE "Cooperative" DROP COLUMN "slug";

-- PostgreSQL enum values cannot be removed in place, so recreate the enums.
CREATE TYPE "DocumentType_new" AS ENUM (
  'CAR',
  'INVOICE',
  'WAREHOUSE_RECEIPT',
  'OTHER'
);

ALTER TABLE "Document"
  ALTER COLUMN "type" TYPE "DocumentType_new"
  USING ("type"::text::"DocumentType_new");

DROP TYPE "DocumentType";
ALTER TYPE "DocumentType_new" RENAME TO "DocumentType";

CREATE TYPE "TraceEventType_new" AS ENUM (
  'CREATED',
  'HARVESTED',
  'RECEIVED_BY_COOPERATIVE',
  'TRANSPORTED',
  'PROCESSED',
  'EXPORTED',
  'MINTED_ONCHAIN'
);

ALTER TABLE "TraceEvent"
  ALTER COLUMN "type" TYPE "TraceEventType_new"
  USING ("type"::text::"TraceEventType_new");

DROP TYPE "TraceEventType";
ALTER TYPE "TraceEventType_new" RENAME TO "TraceEventType";

DROP TYPE "Biome";
DROP TYPE "FarmStatus";
DROP TYPE "ValidationStatus";
DROP TYPE "MessageRole";
