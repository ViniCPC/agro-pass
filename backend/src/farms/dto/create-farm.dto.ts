import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Biome } from '../../../generated/prisma/client';

export class CreateFarmDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2)
  state!: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude!: number;

  @IsString()
  @IsOptional()
  carNumber?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  totalAreaHa?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  legalReserveAreaHa?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  appAreaHa?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  consolidatedAreaHa?: number;

  @IsEnum(Biome)
  @IsOptional()
  biome?: Biome;

  @IsBoolean()
  @IsOptional()
  isAmazonLegal?: boolean;

  @IsUUID()
  @IsNotEmpty()
  producerId!: string;
}
