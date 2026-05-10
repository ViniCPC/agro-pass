ALTER TABLE "TraceEvent"
ADD COLUMN "customStageName" TEXT,
ADD COLUMN "documentId" TEXT;

CREATE UNIQUE INDEX "TraceEvent_documentId_key" ON "TraceEvent"("documentId");

ALTER TABLE "TraceEvent"
ADD CONSTRAINT "TraceEvent_documentId_fkey"
FOREIGN KEY ("documentId") REFERENCES "Document"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
