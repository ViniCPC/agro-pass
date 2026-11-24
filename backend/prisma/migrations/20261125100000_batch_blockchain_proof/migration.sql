-- One cNFT per batch, registered after closing with the final chain hash.
CREATE TYPE "TokenizationStatus" AS ENUM ('NONE', 'PENDING', 'CONFIRMED', 'FAILED');

ALTER TABLE "Batch"
ADD COLUMN "tokenizationStatus" "TokenizationStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN "tokenizationAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "tokenizationStartedAt" TIMESTAMP(3),
ADD COLUMN "tokenizationError" TEXT,
ADD COLUMN "proofHash" TEXT,
ADD COLUMN "tokenTxHash" TEXT,
ADD COLUMN "blockchainNetwork" TEXT;

-- Batches minted by the previous flow keep their proof. That flow only ran
-- on devnet; its transaction lives in the MINTED_ONCHAIN event and the hash
-- it carried was not recorded.
UPDATE "Batch"
SET "tokenizationStatus" = 'CONFIRMED', "blockchainNetwork" = 'devnet'
WHERE "tokenAddress" IS NOT NULL OR "tokenizedAt" IS NOT NULL;

UPDATE "Batch" AS batch
SET "tokenTxHash" = event."txHash"
FROM (
  SELECT DISTINCT ON ("batchId") "batchId", "txHash"
  FROM "TraceEvent"
  WHERE "type" = 'MINTED_ONCHAIN' AND "txHash" IS NOT NULL
  ORDER BY "batchId", "sequence" DESC
) AS event
WHERE batch."id" = event."batchId";

CREATE UNIQUE INDEX "Batch_tokenTxHash_key" ON "Batch"("tokenTxHash");
