import { EudrValidationDto } from './eudr-validation.dto';
import { PaginationDto } from './pagination.dto';

export class ListValidationsResponseDto {
  farmId!: string;
  farmName!: string;
  farmStatus!: string;
  data!: EudrValidationDto[];
  pagination!: PaginationDto;
}
