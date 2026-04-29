import { BatchStatus } from '../../../generated/prisma/client';

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
