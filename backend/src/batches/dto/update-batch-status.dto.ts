import { IsEnum } from 'class-validator';
import { BatchStatus } from '../../../generated/prisma/enums';

export class UpdateBatchStatusDto {
  @IsEnum(BatchStatus)
  status!: BatchStatus;
}
