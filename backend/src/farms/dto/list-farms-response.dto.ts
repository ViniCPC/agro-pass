import { FarmDto } from './farm.dto';
import { PaginationDto } from './pagination.dto';

export class ListFarmsResponseDto {
  data!: FarmDto[];
  pagination!: PaginationDto;
}
