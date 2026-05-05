-- AlterTable
ALTER TABLE "Farm" ADD COLUMN     "lastValidationHash" TEXT,
ADD COLUMN     "lastValidationStatus" "ValidationStatus";
