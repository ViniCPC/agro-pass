import { Type } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export class UpdateBatchVisibilityDto {
  @IsBoolean()
  @Type(() => Boolean)
  isPublic!: boolean;
}
