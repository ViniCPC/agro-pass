import type { BatchStatus } from '../../../generated/prisma/enums';

export class ValidateBatchResponseDto {
  batchId!: string;
  status!: BatchStatus;
  documentsValidated!: number;
  checks!: {
    carDocumentFound: boolean;
    farmLocationProvided: boolean;
    environmentalValidation: 'MOCKED';
  };
  message!: string;
}
