import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  EUDR_VALIDATION_HISTORY_DEFAULT_LIMIT,
  EUDR_VALIDATION_HISTORY_DEFAULT_PAGE,
  EUDR_VALIDATION_HISTORY_MAX_LIMIT,
} from '../eudr.constants';

export class ListValidationsQueryDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page: number = EUDR_VALIDATION_HISTORY_DEFAULT_PAGE;

  @IsInt()
  @Min(1)
  @Max(EUDR_VALIDATION_HISTORY_MAX_LIMIT)
  @IsOptional()
  @Type(() => Number)
  limit: number = EUDR_VALIDATION_HISTORY_DEFAULT_LIMIT;
}
