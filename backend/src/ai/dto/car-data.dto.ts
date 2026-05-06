import {
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Biome } from '../../../generated/prisma/enums';

export class CarDataDto {
  @IsOptional()
  @IsString()
  carNumber!: string | null;

  @IsOptional()
  @IsString()
  farmName!: string | null;

  @IsOptional()
  @IsString()
  ownerName!: string | null;

  @IsOptional()
  @IsString()
  city!: string | null;

  @IsOptional()
  @IsString()
  state!: string | null;

  @IsOptional()
  @IsString()
  municipalityCode!: string | null;

  @IsOptional()
  @IsEnum(Biome)
  biome!: Biome | null;

  @IsOptional()
  @IsNumber()
  latitude!: number | null;

  @IsOptional()
  @IsNumber()
  longitude!: number | null;

  @IsOptional()
  @IsNumber()
  totalAreaHa!: number | null;

  @IsOptional()
  @IsNumber()
  legalReserveAreaHa!: number | null;

  @IsOptional()
  @IsNumber()
  appAreaHa!: number | null;

  @IsOptional()
  @IsNumber()
  consolidatedAreaHa!: number | null;

  @IsNumber()
  @Min(0)
  @Max(1)
  confidence!: number;

  @IsOptional()
  @IsString()
  confidenceReason!: string | null;

  @IsArray()
  @IsString({ each: true })
  missingFields!: string[];

  @IsOptional()
  @IsString()
  rawText!: string | null;

  @IsOptional()
  @IsObject()
  rawModelJson!: object | null;
}
