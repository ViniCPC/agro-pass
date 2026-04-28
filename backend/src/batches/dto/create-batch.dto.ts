import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { ProductType } from '../../../generated/prisma/client';

export class CreateBatchDto {
  @IsUUID()
  @IsNotEmpty()
  farmId!: string;

  @IsEnum(ProductType)
  productType!: ProductType;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  unit!: string;

  @IsDateString()
  @IsOptional()
  harvestDate?: string;
}
