import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelBatchDto {
  // Recorded in the CANCELLED event, so the reason is part of the chain.
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}
