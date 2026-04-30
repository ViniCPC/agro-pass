import { IsEnum } from 'class-validator';
import { FarmStatus } from '../../../generated/prisma/enums';

export class UpdateFarmStatusDto {
  @IsEnum(FarmStatus)
  status!: FarmStatus;
}
