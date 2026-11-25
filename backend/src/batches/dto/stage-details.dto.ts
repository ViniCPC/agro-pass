import { Type } from 'class-transformer';
import {
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

// What the person recording a stage can add to it. Everything here becomes
// part of the event hash, like the stage itself.
export class StageDetailsDto {
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
}
