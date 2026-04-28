import { IsEnum } from 'class-validator';
import { FarmStatus } from '../../../generated/prisma/client';

export class UpdateFarmStatusDto {
  @IsEnum(FarmStatus)
  status!: FarmStatus;
}
