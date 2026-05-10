import { Type } from 'class-transformer';
import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { TraceEventType } from '../../../generated/prisma/enums';

export class CreateTraceEventDto {
  @IsEnum(TraceEventType)
  type!: TraceEventType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  actorName!: string;

  @IsUUID()
  @IsOptional()
  cooperativeId?: string;

  @IsUUID()
  @IsOptional()
  exporterId?: string;

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
  @MaxLength(140)
  customStageName?: string;

  @IsUUID()
  @IsOptional()
  documentId?: string;
}
