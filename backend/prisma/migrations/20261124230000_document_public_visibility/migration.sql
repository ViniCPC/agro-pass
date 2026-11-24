-- Documents stay private by default. The public passport lists every
-- document by hash, but only links the files explicitly marked public.
ALTER TABLE "Document" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;
