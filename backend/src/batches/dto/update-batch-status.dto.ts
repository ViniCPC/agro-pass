import { IsEnum } from 'class-validator';
import { BatchStatus } from '../../../generated/prisma/client';

export class UpdateBatchStatusDto {
  @IsEnum(BatchStatus)
  status!: BatchStatus;
}
