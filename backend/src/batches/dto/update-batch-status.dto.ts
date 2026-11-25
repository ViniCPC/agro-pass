import { IsEnum } from 'class-validator';
import { BatchStatus } from '../../../generated/prisma/enums';
import { StageDetailsDto } from './stage-details.dto';

export class UpdateBatchStatusDto extends StageDetailsDto {
  @IsEnum(BatchStatus)
  status!: BatchStatus;
}
