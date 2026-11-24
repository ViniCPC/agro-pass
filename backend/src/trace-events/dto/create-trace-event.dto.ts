import { Type } from 'class-transformer';
import {
  IsEnum,
  IsArray,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  ArrayUnique,
  MaxLength,
} from 'class-validator';
import { TraceEventType } from '../../../generated/prisma/enums';

export class CreateTraceEventDto {
  @IsEnum(TraceEventType)
  type!: TraceEventType;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  location?: string;

  @IsLatitude()
  @IsOptional()
  @Type(() => Number)
  latitude?: number;

  @IsLongitude()
  @IsOptional()
  @Type(() => Number)
  longitude?: number;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;

  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  @IsOptional()
  documentIds?: string[];

  @IsUUID()
  @IsOptional()
  correctedEventId?: string;
}
