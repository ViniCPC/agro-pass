import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

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

  @IsUUID()
  @IsNotEmpty()
  producerId!: string;
}
